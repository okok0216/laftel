'use client'

import { useEffect, useState, useRef } from 'react'

interface AniItem {
    id: number
    name: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    first_air_date: string
    vote_average: number
    genre_ids: number[]
}

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
const IMG = 'https://image.tmdb.org/t/p'

const DAYS = [
    { id: 0, label: '월' }, { id: 1, label: '화' }, { id: 2, label: '수' },
    { id: 3, label: '목' }, { id: 4, label: '금' }, { id: 5, label: '토' }, { id: 6, label: '일' },
]

const GENRE_MAP: Record<number, string> = {
    16: '애니메이션', 10759: '액션·어드벤처', 35: '코미디', 18: '드라마',
    10751: '가족', 14: '판타지', 27: '호러', 9648: '미스터리',
    10765: 'SF·판타지', 10762: '어린이',
}

function jsDateDayToTabIdx(jsDay: number) { return jsDay === 0 ? 6 : jsDay - 1 }

function getWeekDates() {
    const today = new Date()
    const jsDay = today.getDay()
    const diff = jsDay === 0 ? -6 : 1 - jsDay
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday); d.setDate(monday.getDate() + i)
        return d.toISOString().slice(0, 10)
    })
}

function getYesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10) }
function getToday() { return new Date().toISOString().slice(0, 10) }

function seededShuffle<T>(arr: T[], seed: number): T[] {
    const a = [...arr]; let s = seed
    for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0xffffffff
        const j = Math.abs(s) % (i + 1);[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function dateSeed() {
    const d = new Date()
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

async function fetchAniByDate(date: string, pages = 2): Promise<AniItem[]> {
    let results: AniItem[] = []
    for (let page = 1; page <= pages; page++) {
        const url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&with_genres=16&with_original_language=ja&air_date.gte=${date}&air_date.lte=${date}&sort_by=popularity.desc&language=ko-KR&page=${page}`
        const res = await fetch(url)
        const data = await res.json()
        if (data.status_message) console.error('TMDB error:', data.status_message)
        if (!data.results?.length) break
        results = [...results, ...data.results]
    }
    return results
}

// ─── 호버 패널 ─────────────────────────────────────
function HoverPanel({ ani }: { ani: AniItem }) {
    const backdrop = ani.backdrop_path ? `${IMG}/w780${ani.backdrop_path}` : null
    const genres = ani.genre_ids.map(g => GENRE_MAP[g]).filter(Boolean).slice(0, 2)
    return (
        <div
            className="absolute top-0 left-1/2 w-60 rounded-2xl overflow-hidden z-[200] border border-white/[0.08]"
            style={{
                transform: 'translateX(-50%)',
                animation: 'panelIn 0.18s cubic-bezier(0.34,1.4,0.64,1)',
                background: 'rgba(18,18,24,0.96)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
        >
            {backdrop
                ? <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                    <img src={backdrop} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(18,18,24,0.98))' }} />
                </div>
                : <div className="w-full" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg,#1e1b4b,#312e81)' }} />
            }
            <div className="px-4 pb-4 pt-2.5">
                <p className="text-[13px] font-semibold text-white/90 leading-snug mb-2">{ani.name}</p>
                {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {genres.map(g => (
                            <span key={g} className="text-[10px] text-violet-300/70 border border-violet-400/20 rounded-full px-2 py-0.5 tracking-wide">
                                {g}
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-[11px] text-white/35 leading-relaxed mb-3">
                    {ani.overview ? ani.overview.slice(0, 75) + (ani.overview.length > 75 ? '…' : '') : '줄거리 정보가 없습니다.'}
                </p>
                <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-white text-[12px] font-medium border-none cursor-pointer transition-all"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>재생
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── 카드 공통 훅 ──────────────────────────────────
function useHover() {
    const [hovered, setHovered] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const onEnter = () => { timer.current = setTimeout(() => setHovered(true), 160) }
    const onLeave = () => { if (timer.current) clearTimeout(timer.current); setHovered(false) }
    return { hovered, onEnter, onLeave }
}

// ─── 슬라이드 카드 ─────────────────────────────────
function SlideCard({ ani, w }: { ani: AniItem; w: number }) {
    const poster = ani.poster_path ? `${IMG}/w342${ani.poster_path}` : null
    const score = Math.round(ani.vote_average * 10) / 10
    const genres = ani.genre_ids.map(g => GENRE_MAP[g]).filter(Boolean).slice(0, 2)
    return (
        <li className="relative cursor-pointer group shrink-0" style={{ width: w }}>
            <div className="relative overflow-hidden rounded-xl" style={{ width: w, aspectRatio: '2/3', background: '#1e1b4b' }}>
                {poster
                    ? <img src={poster} alt={ani.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="text-3xl font-black text-white/10">{ani.name[0]}</span></div>
                }
                {/* 내부 오버레이 */}
                <div className="absolute inset-0 flex flex-col justify-end p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)' }}>
                    <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2 mb-1">{ani.name}</p>
                    {genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                            {genres.map(g => <span key={g} className="text-[9px] text-white/50 border border-white/15 rounded-full px-1.5 py-0.5">{g}</span>)}
                        </div>
                    )}
                    {score > 0 && <span className="text-[10px] font-semibold text-amber-400/90">★ {score}</span>}
                </div>
                {/* 평소 점수 뱃지 */}
                {score > 0 && (
                    <span className="absolute bottom-2 left-2.5 text-[11px] font-semibold text-amber-400/90 group-hover:opacity-0 transition-opacity">
                        ★ {score}
                    </span>
                )}
            </div>
            <p className="mt-2 text-[11px] font-medium leading-snug line-clamp-1 text-white/50" style={{ width: w }}>{ani.name}</p>
        </li>
    )
}

// ─── 최근 업데이트 카드 ────────────────────────────
function RecentCard({ ani, dayLabel, featured = false }: { ani: AniItem & { _date?: string }; dayLabel: string; featured?: boolean }) {
    const poster = ani.poster_path ? `${IMG}/w342${ani.poster_path}` : null
    const backdrop = ani.backdrop_path ? `${IMG}/w780${ani.backdrop_path}` : null
    const score = Math.round(ani.vote_average * 10) / 10
    const isToday = ani._date === 'today'
    const genres = ani.genre_ids.map(g => GENRE_MAP[g]).filter(Boolean).slice(0, 2)

    return (
        <li className="relative cursor-pointer group shrink-0 w-[160px] sm:w-[180px] md:w-[200px]">
            <div
                className="relative overflow-hidden rounded-xl"
                style={{
                    aspectRatio: '1/1',
                    background: '#1e1b4b',
                    boxShadow: featured ? '0 0 0 2px rgba(139,92,246,0.8), 0 8px 32px rgba(109,40,217,0.4)' : 'none',
                }}
            >
                {/* 이미지 — featured는 backdrop 우선 */}
                {featured && backdrop
                    ? <img src={backdrop} alt={ani.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    : poster
                        ? <img src={poster} alt={ani.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        : <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl font-black text-white/10">{ani.name[0]}</span></div>
                }

                {/* featured 전용 보라 글로우 */}
                {featured && <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 0% 100%, rgba(109,40,217,0.8) 0%, transparent 60%)' }} />}

                {/* 기본 그라데이션 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* 뱃지 */}
                <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider z-10 ${isToday ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/50'}`}>
                    {isToday ? 'TODAY' : 'YEST'}
                </span>

                {/* 기본 정보 */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 group-hover:opacity-0 transition-opacity duration-200">
                    {score > 0 && <span className="text-[11px] font-semibold text-amber-400/90">★ {score}</span>}
                </div>

                {/* 호버 오버레이 */}
                <div className="absolute inset-0 flex flex-col justify-end p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)' }}>
                    <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2 mb-1">{ani.name}</p>
                    {featured && genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                            {genres.map(g => <span key={g} className="text-[9px] text-white/45 border border-white/15 rounded-full px-1.5 py-0.5">{g}</span>)}
                        </div>
                    )}
                    <p className="text-[9px] text-violet-300/60 tracking-wide">매주 {dayLabel}요일</p>
                </div>
            </div>
            <p className="mt-2 text-[11px] font-medium leading-snug line-clamp-1 text-white/55">{ani.name}</p>
            <p className="text-[10px] text-violet-400/50 mt-0.5 tracking-wide">매주 {dayLabel}요일</p>
        </li>
    )
}

// ─── 그리드 카드 ───────────────────────────────────
function GridCard({ ani }: { ani: AniItem }) {
    const poster = ani.poster_path ? `${IMG}/w342${ani.poster_path}` : null
    const score = Math.round(ani.vote_average * 10) / 10
    const genres = ani.genre_ids.map(g => GENRE_MAP[g]).filter(Boolean).slice(0, 2)
    return (
        <li className="relative cursor-pointer group overflow-hidden rounded-xl" style={{ aspectRatio: '2/3', background: '#1e1b4b' }}>
            {poster
                ? <img src={poster} alt={ani.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                : <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-black text-white/10">{ani.name[0]}</span></div>
            }
            {/* 호버 오버레이 — 카드 내부에서만 */}
            <div className="absolute inset-0 flex flex-col justify-end p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)' }}>
                <p className="text-white text-[12px] font-semibold leading-snug line-clamp-2 mb-1.5">{ani.name}</p>
                {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                        {genres.map(g => <span key={g} className="text-[9px] text-white/50 border border-white/15 rounded-full px-1.5 py-0.5">{g}</span>)}
                    </div>
                )}
                {score > 0 && <span className="text-[11px] font-semibold text-amber-400/90">★ {score}</span>}
            </div>
        </li>
    )
}

// ─── 스켈레톤 ──────────────────────────────────────
function SkeletonSlide({ w }: { w: number }) {
    return (
        <li className="shrink-0" style={{ width: w }}>
            <div className="rounded-xl" style={{ width: w, aspectRatio: '2/3', background: 'linear-gradient(90deg,#1e1b4b 25%,#2e2a6b 50%,#1e1b4b 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite' }} />
            <div className="mt-2 h-2.5 rounded-full" style={{ width: w * 0.65, background: 'linear-gradient(90deg,#1e1b4b 25%,#2e2a6b 50%,#1e1b4b 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite' }} />
        </li>
    )
}

function SkeletonGrid() {
    return (
        <li>
            <div className="w-full rounded-xl" style={{ aspectRatio: '2/3', background: 'linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.06) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite' }} />
        </li>
    )
}

// ─── 스크롤 버튼 ───────────────────────────────────
function ScrollBtn({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
    return (
        <button onClick={onClick}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full items-center justify-center cursor-pointer transition-all border border-white/10 bg-black/30 hover:bg-black/50 text-white/60 hover:text-white"
            style={{ [dir === 'left' ? 'left' : 'right']: -14 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
            </svg>
        </button>
    )
}

// ─── 섹션 타이틀 ───────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <h2 className="text-white font-black text-xl sm:text-2xl tracking-tight flex items-center gap-1.5">
                <span style={{ display: 'inline-block', animation: 'wiggle 1.2s ease-in-out infinite' }}>🔔</span>
                {children}
                <span className="text-violet-400">!</span>
            </h2>
            <span className="text-[11px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full border border-violet-400/30 text-violet-300/80 bg-violet-500/10">
                어제 · 오늘
            </span>
        </div>
    )
}

// ─── 메인 ──────────────────────────────────────────
export default function Page() {
    const weekDates = useRef(getWeekDates())
    const todayTabIdx = jsDateDayToTabIdx(new Date().getDay())
    const seed = dateSeed()

    const [activeDay, setActiveDay] = useState(todayTabIdx)
    const [tabCache, setTabCache] = useState<Record<number, AniItem[]>>({})
    const [tabLoading, setTabLoading] = useState(false)
    const [todayList, setTodayList] = useState<AniItem[]>([])
    const [todayLoading, setTodayLoading] = useState(true)
    const [recentList, setRecentList] = useState<(AniItem & { _date: string })[]>([])
    const [recentLoading, setRecentLoading] = useState(true)
    const [popularAni, setPopularAni] = useState<AniItem | null>(null)

    const todayScrollRef = useRef<HTMLUListElement>(null)
    const recentScrollRef = useRef<HTMLUListElement>(null)

    const scroll = (ref: React.RefObject<HTMLUListElement | null>, dir: 'left' | 'right') => {
        ref.current?.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' })
    }

    useEffect(() => {
        const load = async () => {
            setTodayLoading(true)
            try {
                const list = await fetchAniByDate(weekDates.current[todayTabIdx], 3)
                setTodayList(list)
                const sorted = [...list].sort((a, b) => b.vote_average - a.vote_average)
                setPopularAni(sorted[0] || null)
            } finally { setTodayLoading(false) }
        }
        load()
    }, [])

    useEffect(() => {
        const load = async () => {
            setRecentLoading(true)
            try {
                const [todayItems, yestItems] = await Promise.all([
                    fetchAniByDate(getToday(), 2),
                    fetchAniByDate(getYesterday(), 2),
                ])
                const merged = [
                    ...todayItems.map(a => ({ ...a, _date: 'today' })),
                    ...yestItems.map(a => ({ ...a, _date: 'yesterday' })),
                ]
                setRecentList(merged)
            } finally { setRecentLoading(false) }
        }
        load()
    }, [])

    useEffect(() => {
        if (tabCache[activeDay] !== undefined) return
        const load = async () => {
            setTabLoading(true)
            try {
                const list = await fetchAniByDate(weekDates.current[activeDay], 2)
                setTabCache(prev => ({ ...prev, [activeDay]: list }))
            } finally { setTabLoading(false) }
        }
        load()
    }, [activeDay])

    const tabList = tabCache[activeDay] ?? []
    const todayLabel = DAYS[todayTabIdx]?.label || '오늘'

    return (
        <>
            <style>{`
                @keyframes wiggle {
                    0%, 100% { transform: rotate(-8deg) scale(1); }
                    25% { transform: rotate(8deg) scale(1.15); }
                    50% { transform: rotate(-5deg) scale(1.05); }
                    75% { transform: rotate(6deg) scale(1.1); }
                }
                @keyframes panelIn {
                    from { opacity:0; transform:translateX(-50%) scale(.95) translateY(4px); }
                    to   { opacity:1; transform:translateX(-50%) scale(1)   translateY(0); }
                }
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                .hide-scroll::-webkit-scrollbar { display:none }
                .hide-scroll { -ms-overflow-style:none; scrollbar-width:none }
            `}</style>

            <div className="pt-14 min-h-screen bg-[#0a0910] dark:bg-[#0a0910] text-white transition-colors">

                {/* ── Today's Pick ─────────────────────────── */}
                <section className="px-4 sm:px-6 lg:px-8 pt-10 pb-10 max-w-[1400px] mx-auto">
                    <div className="flex items-start gap-6 sm:gap-10">

                        {/* 요일 원형 */}
                        <div className="relative shrink-0 mt-1" style={{ width: 120, height: 96 }}>
                            <div className="absolute rounded-full bg-[#1e1566]" style={{ width: 88, height: 88, top: 4, left: 0 }} />
                            <div className="absolute rounded-full flex items-center justify-center font-black text-white text-2xl"
                                style={{ width: 92, height: 92, top: 0, right: 0, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 8px 32px rgba(109,40,217,0.5)' }}>
                                {todayLabel}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="mb-5">
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-violet-400/50 block mb-1.5">Today's Pick</span>
                                <p className="text-white font-bold text-xl sm:text-2xl leading-tight tracking-tight">
                                    {todayLabel}요일 방영
                                    <span className="text-white/35 font-light text-lg sm:text-xl ml-2">애니메이션</span>
                                </p>
                            </div>
                            <div className="relative">
                                <ScrollBtn dir="left" onClick={() => scroll(todayScrollRef, 'left')} />
                                <ul ref={todayScrollRef} className="flex gap-3 overflow-x-auto hide-scroll pb-1">
                                    {todayLoading
                                        ? Array.from({ length: 6 }).map((_, i) => <SkeletonSlide key={i} w={200} />)
                                        : todayList.slice(0, 8).map(ani => <SlideCard key={ani.id} ani={ani} w={200} />)
                                    }
                                </ul>
                                <ScrollBtn dir="right" onClick={() => scroll(todayScrollRef, 'right')} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 섹션 구분선 */}
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="border-t border-white/[0.04]" />
                </div>

                {/* ── 최근 업데이트 ─────────────────────────── */}
                <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-10 max-w-[1400px] mx-auto">
                    <SectionTitle>최근 업데이트</SectionTitle>
                    {recentLoading
                        ? (
                            <div className="flex gap-4">
                                <div className="shrink-0 rounded-2xl" style={{ width: 280, aspectRatio: '1/1', background: 'linear-gradient(90deg,#1e1b4b 25%,#2e2a6b 50%,#1e1b4b 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite' }} />
                                <div className="flex gap-3 overflow-hidden">
                                    {Array.from({ length: 4 }).map((_, i) => <SkeletonSlide key={i} w={160} />)}
                                </div>
                            </div>
                        )
                        : recentList.length > 0 && (
                            <div className="flex items-center gap-4">
                                {/* 첫번째 카드 — 크게 고정 */}
                                <div className="shrink-0 cursor-pointer group" style={{ width: 280 }}>
                                    <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '1/1', background: '#1e1b4b' }}>
                                        {recentList[0].backdrop_path
                                            ? <img src={`${IMG}/w780${recentList[0].backdrop_path}`} alt={recentList[0].name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            : recentList[0].poster_path
                                                ? <img src={`${IMG}/w342${recentList[0].poster_path}`} alt={recentList[0].name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                : null
                                        }
                                        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                                        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 0% 100%, rgba(109,40,217,0.8) 0%, transparent 60%)' }} />
                                        <span className={`absolute top-3 left-3 text-[9px] font-bold px-2.5 py-1 rounded-full tracking-widest uppercase z-10 ${recentList[0]._date === 'today' ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/50'}`}>
                                            {recentList[0]._date === 'today' ? 'New Today' : 'Yesterday'}
                                        </span>
                                        <div className="absolute inset-0 flex flex-col justify-end p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10"
                                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 55%, transparent 100%)' }}>
                                            <p className="text-white font-bold text-[15px] leading-snug line-clamp-2 mb-1.5">{recentList[0].name}</p>
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {recentList[0].genre_ids.map(g => GENRE_MAP[g]).filter(Boolean).slice(0, 2).map(g => (
                                                    <span key={g} className="text-[10px] text-white/50 border border-white/15 rounded-full px-2 py-0.5">{g}</span>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] text-violet-300/70">매주 {todayLabel}요일</p>
                                                {recentList[0].vote_average > 0 && <span className="text-[12px] font-semibold text-amber-400/90">★ {Math.round(recentList[0].vote_average * 10) / 10}</span>}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-3 left-3 right-3 z-10 group-hover:opacity-0 transition-opacity">
                                            <p className="text-white font-semibold text-[13px] leading-snug line-clamp-1">{recentList[0].name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 나머지 카드 — 가로 스크롤 */}
                                <div className="relative flex-1 min-w-0">
                                    <ul className="flex items-center gap-3 overflow-x-auto hide-scroll pb-1">
                                        {recentList.slice(1, 20).map(ani => (
                                            <RecentCard key={ani.id} ani={ani} dayLabel={todayLabel} featured={false} />
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )
                    }
                </section>

                {/* ── 인기 배너 ─────────────────────────────── */}
                {popularAni && (
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                        <div className="flex items-center gap-4 px-5 py-3 rounded-2xl border border-white/[0.06]"
                            style={{ background: 'rgba(109,40,217,0.12)', backdropFilter: 'blur(12px)' }}>
                            <img src="/images/daynow_emoji.png" alt="" className="w-14 h-14 object-contain shrink-0" />
                            <div>
                                <p className="text-[11px] text-white/30 tracking-widest uppercase mb-0.5">오늘의 인기 애니</p>
                                <p className="text-[14px] font-semibold text-white/85">{popularAni.name}</p>
                            </div>
                            <div className="ml-auto shrink-0 text-[11px] font-semibold text-amber-400/80">
                                ★ {Math.round(popularAni.vote_average * 10) / 10}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 요일 탭 + 그리드 ──────────────────────── */}
                <div style={{ background: 'linear-gradient(160deg, #1a0533 0%, #2d0f5e 30%, #1e0a4a 60%, #120728 100%)' }}>
                    {/* 탭 */}
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex overflow-x-auto hide-scroll">
                            {DAYS.map(d => (
                                <button key={d.id} onClick={() => setActiveDay(d.id)}
                                    className={[
                                        'flex-1 min-w-[40px] py-4 text-[13px] font-semibold border-none cursor-pointer transition-all duration-200 relative whitespace-nowrap bg-transparent tracking-wide',
                                        activeDay === d.id ? 'text-white' : 'text-white/35 hover:text-white/60',
                                    ].join(' ')}
                                >
                                    {d.label}
                                    {activeDay === d.id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-white/80 rounded-full" />}
                                    {d.id === todayTabIdx && <span className="absolute top-2.5 right-[calc(50%-12px)] w-1 h-1 rounded-full bg-white/50" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 그리드 */}
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
                        <ul className="list-none m-0 p-0 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {tabLoading
                                ? Array.from({ length: 10 }).map((_, i) => <SkeletonGrid key={i} />)
                                : tabList.length === 0
                                    ? (
                                        <li className="col-span-full flex flex-col items-center justify-center py-24 gap-3">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10">
                                                <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                                            </svg>
                                            <p className="text-[12px] text-white/20 tracking-wider">방영 정보가 없어요</p>
                                        </li>
                                    )
                                    : tabList.map(ani => <GridCard key={ani.id} ani={ani} />)
                            }
                        </ul>
                    </div>
                </div>

            </div>
        </>
    )
}