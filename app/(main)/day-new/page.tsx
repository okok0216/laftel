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
    { id: 0, label: '월' },
    { id: 1, label: '화' },
    { id: 2, label: '수' },
    { id: 3, label: '목' },
    { id: 4, label: '금' },
    { id: 5, label: '토' },
    { id: 6, label: '일' },
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
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        return d.toISOString().slice(0, 10)
    })
}

function getYesterday() {
    const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10)
}
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
        if (!data.results?.length) break
        results = [...results, ...data.results]
    }
    return results
}

// ─── 호버 패널 공통 ────────────────────────────────
function HoverPanel({ ani }: { ani: AniItem }) {
    const backdrop = ani.backdrop_path ? `${IMG}/w780${ani.backdrop_path}` : null
    const genres = ani.genre_ids.map(g => GENRE_MAP[g]).filter(Boolean).slice(0, 2)
    return (
        <div
            className="absolute top-0 left-1/2 w-[220px] sm:w-[240px] rounded-xl overflow-hidden bg-[#1c1c1e] border border-white/10 shadow-[0_20px_55px_rgba(0,0,0,0.75)] z-[200]"
            style={{ transform: 'translateX(-50%)', animation: 'panelIn 0.16s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
            {backdrop
                ? <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                    <img src={backdrop} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1c1c1e]" />
                </div>
                : <div className="w-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" style={{ aspectRatio: '16/9' }} />
            }
            <div className="px-3.5 pb-3.5 pt-2">
                <p className="text-[13px] font-bold text-white leading-snug mb-1.5">{ani.name}</p>
                {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                        {genres.map(g => <span key={g} className="text-[10px] text-white/45 bg-white/[0.07] rounded px-1.5 py-0.5">{g}</span>)}
                    </div>
                )}
                <p className="text-[11px] text-white/40 leading-relaxed mb-2.5">
                    {ani.overview ? ani.overview.slice(0, 80) + (ani.overview.length > 80 ? '…' : '') : '줄거리 정보가 없습니다.'}
                </p>
                <div className="flex gap-1.5">
                    <button className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-[#6c63ff] hover:bg-[#5a52e0] transition-colors rounded-md text-white text-[12px] font-semibold border-none cursor-pointer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>재생
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] rounded-md text-white/65 hover:text-white transition-all cursor-pointer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── 슬라이드 카드 ─────────────────────────────────
function SlideCard({ ani, w }: { ani: AniItem; w: number }) {
    const [hovered, setHovered] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const poster = ani.poster_path ? `${IMG}/w342${ani.poster_path}` : null
    const score = Math.round(ani.vote_average * 10) / 10

    return (
        <li
            className="relative cursor-pointer group shrink-0"
            style={{ width: w }}
            onMouseEnter={() => { timer.current = setTimeout(() => setHovered(true), 180) }}
            onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setHovered(false) }}
        >
            <div className="relative overflow-hidden rounded-lg bg-[#3a2d6b]" style={{ width: w, aspectRatio: '2/3' }}>
                {poster
                    ? <img src={poster} alt={ani.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="text-3xl font-black text-white/20">{ani.name[0]}</span></div>
                }
                {score > 0 && <span className="absolute bottom-2 left-2 text-[11px] font-bold text-amber-300">★ {score}</span>}
            </div>
            <p className="mt-1.5 text-[12px] text-white/80 font-medium leading-snug line-clamp-1" style={{ width: w }}>{ani.name}</p>
            {hovered && <HoverPanel ani={ani} />}
        </li>
    )
}

// ─── 최근 업데이트 카드 ────────────────────────────
function RecentCard({ ani, dayLabel }: { ani: AniItem & { _date?: string }; dayLabel: string }) {
    const [hovered, setHovered] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const poster = ani.poster_path ? `${IMG}/w342${ani.poster_path}` : null
    const score = Math.round(ani.vote_average * 10) / 10
    const isToday = ani._date === 'today'

    return (
        <li
            className="relative cursor-pointer group shrink-0 w-[130px] sm:w-[150px] md:w-[160px]"
            onMouseEnter={() => { timer.current = setTimeout(() => setHovered(true), 180) }}
            onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setHovered(false) }}
        >
            <div className="relative overflow-hidden rounded-lg bg-[#3a2d6b]" style={{ aspectRatio: '1/1' }}>
                {poster
                    ? <img src={poster} alt={ani.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="text-3xl font-black text-white/20">{ani.name[0]}</span></div>
                }
                <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${isToday ? 'bg-[#6c63ff] text-white' : 'bg-white/20 text-white/70'}`}>
                    {isToday ? '오늘' : '어제'}
                </span>
                {score > 0 && <span className="absolute bottom-2 left-2 text-[11px] font-bold text-amber-300">★ {score}</span>}
            </div>
            <p className="mt-1.5 text-[12px] text-white/80 font-medium leading-snug line-clamp-1">{ani.name}</p>
            <p className="text-[10px] text-[#a78bfa] mt-0.5">매주 {dayLabel}요일</p>
            {hovered && <HoverPanel ani={ani} />}
        </li>
    )
}

// ─── 그리드 카드 ───────────────────────────────────
function GridCard({ ani }: { ani: AniItem }) {
    const [hovered, setHovered] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const poster = ani.poster_path ? `${IMG}/w342${ani.poster_path}` : null
    const score = Math.round(ani.vote_average * 10) / 10

    return (
        <li
            className="relative cursor-pointer group"
            onMouseEnter={() => { timer.current = setTimeout(() => setHovered(true), 180) }}
            onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setHovered(false) }}
        >
            <div className="relative w-full overflow-hidden rounded-lg bg-[#3a2d6b]" style={{ aspectRatio: '2/3' }}>
                {poster
                    ? <img src={poster} alt={ani.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="text-4xl font-black text-white/20">{ani.name[0]}</span></div>
                }
                {score > 0 && <span className="absolute bottom-2 left-2 text-[11px] font-bold text-amber-300">★ {score}</span>}
            </div>
            {hovered && <HoverPanel ani={ani} />}
        </li>
    )
}

// ─── 스켈레톤 ──────────────────────────────────────
function SkeletonSlide({ w }: { w: number }) {
    return (
        <li className="shrink-0" style={{ width: w }}>
            <div className="rounded-lg" style={{ width: w, aspectRatio: '2/3', background: 'linear-gradient(90deg,#5a3f9a 25%,#7c5cc4 50%,#5a3f9a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            <div className="mt-2 h-3 rounded" style={{ width: w * 0.7, background: 'linear-gradient(90deg,#5a3f9a 25%,#7c5cc4 50%,#5a3f9a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        </li>
    )
}

function SkeletonGrid() {
    return (
        <li>
            <div className="w-full rounded-lg" style={{ aspectRatio: '2/3', background: 'linear-gradient(90deg,#5a3f9a 25%,#7c5cc4 50%,#5a3f9a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        </li>
    )
}

// ─── 스크롤 버튼 ───────────────────────────────────
function ScrollBtn({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 items-center justify-center text-white transition-all cursor-pointer"
            style={{ [dir === 'left' ? 'left' : 'right']: -16 }}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
            </svg>
        </button>
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
                setTodayList(seededShuffle(list, seed))
                const sorted = [...list].sort((a, b) => b.vote_average - a.vote_average)
                const top5 = sorted.slice(0, 5)
                setPopularAni(top5[Math.abs(seed) % top5.length] || null)
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
                setRecentList([
                    ...todayItems.map(a => ({ ...a, _date: 'today' })),
                    ...yestItems.map(a => ({ ...a, _date: 'yesterday' })),
                ])
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
                @keyframes panelIn { from{opacity:0;transform:translateX(-50%) scale(.93)} to{opacity:1;transform:translateX(-50%) scale(1)} }
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                .hide-scroll::-webkit-scrollbar{display:none}
                .hide-scroll{-ms-overflow-style:none;scrollbar-width:none}
            `}</style>

            <div className="pt-14 min-h-screen bg-[#0d0d1a]">

                {/* ── Today's Pick ─────────────────────────── */}
                <div className="bg-[#0d0d1a] pt-5 pb-7">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-start gap-4 sm:gap-8">
                            {/* 요일 원형 */}
                            <div className="relative shrink-0" style={{ width: 140, height: 110 }}>
                                {/* 뒤 진한 남색 원 — 왼쪽에 반쯤 */}
                                <div className="absolute rounded-full bg-[#2a1d6e]" style={{ width: 100, height: 100, top: 5, left: 0 }} />
                                {/* 메인 보라 원 */}
                                <div className="absolute rounded-full bg-[#6c63ff] flex items-center justify-center" style={{ width: 105, height: 105, top: 0, right: 0 }}>
                                    <span className="text-2xl sm:text-3xl font-black text-white">{todayLabel}</span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className="text-[#fbbf24] font-bold text-xs sm:text-sm">Today's Pick!</span>
                                    <p className="text-white font-bold text-sm sm:text-base">{todayLabel}요일을 이겨내는 오늘의 방영 애니메이션!</p>
                                </div>
                                <div className="relative">
                                    <ScrollBtn dir="left" onClick={() => scroll(todayScrollRef, 'left')} />
                                    <ul ref={todayScrollRef} className="flex gap-2 sm:gap-3 overflow-x-auto hide-scroll pb-2">
                                        {todayLoading
                                            ? Array.from({ length: 8 }).map((_, i) => <SkeletonSlide key={i} w={120} />)
                                            : todayList.slice(0, 20).map(ani => <SlideCard key={ani.id} ani={ani} w={120} />)
                                        }
                                    </ul>
                                    <ScrollBtn dir="right" onClick={() => scroll(todayScrollRef, 'right')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 최근 업데이트 ─────────────────────────── */}
                <div className="bg-[#0d0d1a] pt-5 pb-7">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                        <p className="text-white font-bold text-sm sm:text-[15px] mb-4">최근 업데이트 된 애니메이션</p>
                        <div className="relative">
                            <ScrollBtn dir="left" onClick={() => scroll(recentScrollRef, 'left')} />
                            <ul ref={recentScrollRef} className="flex gap-2 sm:gap-3 overflow-x-auto hide-scroll pb-2">
                                {recentLoading
                                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonSlide key={i} w={130} />)
                                    : recentList.slice(0, 20).map(ani => (
                                        <RecentCard key={ani.id} ani={ani} dayLabel={todayLabel} />
                                    ))
                                }
                            </ul>
                            <ScrollBtn dir="right" onClick={() => scroll(recentScrollRef, 'right')} />
                        </div>
                    </div>
                </div>

                {/* ── 인기 배너 ─────────────────────────────── */}
                {popularAni && (
                    <div className="bg-[#b06ce0] py-3 mt-2">
                        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3">
                            <img src="/images/daynow_emoji.png" alt="" className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 object-contain" />
                            <div className="flex-1 bg-white rounded-full px-4 sm:px-6 py-2 sm:py-2.5">
                                <p className="text-[#1a1a1a] text-xs sm:text-sm font-medium truncate">
                                    오늘 가장 인기있는 애니는{' '}
                                    <span className="text-[#6c63ff] font-bold">"{popularAni.name}"</span>
                                    입니다
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 요일 탭 + 그리드 ──────────────────────── */}
                <div className="mt-2" style={{ background: 'linear-gradient(180deg, #c084fc 0%, #a855f7 35%, #7c3aed 100%)' }}>

                    {/* 탭 */}
                    <div className="w-full" style={{ background: 'rgba(0,0,0,0.15)' }}>
                        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto hide-scroll">
                            {DAYS.map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => setActiveDay(d.id)}
                                    className={[
                                        'flex-1 min-w-[40px] py-3 sm:py-4 text-sm sm:text-[16px] font-bold border-none cursor-pointer transition-all duration-200 relative whitespace-nowrap',
                                        activeDay === d.id ? 'text-white' : 'text-white/50 bg-transparent hover:text-white/80',
                                    ].join(' ')}
                                >
                                    {d.label}
                                    {activeDay === d.id && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t" />
                                    )}
                                    {d.id === todayTabIdx && (
                                        <span className="absolute top-1.5 right-[calc(50%-14px)] w-1.5 h-1.5 rounded-full bg-white/70" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 그리드 — 모바일 2열 / sm 3열 / md 4열 / lg 5열 */}
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
                        <ul className="list-none m-0 p-0 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {tabLoading
                                ? Array.from({ length: 10 }).map((_, i) => <SkeletonGrid key={i} />)
                                : tabList.length === 0
                                    ? (
                                        <li className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/20">
                                                <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                                            </svg>
                                            <p className="text-sm text-white/40 m-0">이 날 방영 정보가 없어요</p>
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