// app/api/auth/naver/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const { code, state } = await req.json()

    try {
        // 1. 네이버 액세스 토큰 발급
        const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: process.env.NAVER_CLIENT_ID!,
                client_secret: process.env.NAVER_CLIENT_SECRET!,
                code,
                state,
            }),
        })
        const tokenData = await tokenRes.json()
        if (!tokenData.access_token) throw new Error('토큰 발급 실패')

        // 2. 네이버 유저 정보 조회
        const userRes = await fetch('https://openapi.naver.com/v1/nid/me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        const userData = await userRes.json()
        const profile = userData.response

        // 3. Firebase Admin으로 Custom Token 발급
        const admin = (await import('firebase-admin')).default
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            })
        }

        const uid = `naver:${profile.id}`
        const firebaseToken = await admin.auth().createCustomToken(uid, {
            email: profile.email,
            name: profile.name,
        })

        // 4. Firestore에 유저 정보 저장
        const db = admin.firestore()
        await db.collection('users').doc(uid).set({
            uid,
            email: profile.email || null,
            displayName: profile.name || null,
            photoURL: profile.profile_image || null,
            provider: 'naver',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true })

        return NextResponse.json({
            firebaseToken,
            email: profile.email,
            name: profile.name,
            profileImage: profile.profile_image,
        })
    } catch (err) {
        console.error('Naver auth error:', err)
        return NextResponse.json({ error: '로그인 실패' }, { status: 500 })
    }
}
