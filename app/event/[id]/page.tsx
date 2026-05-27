"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useEventStore } from '@/store/useEventStore'


const sortOptions = [
    { label: "최신순", value: "latest" as const },
    { label: "인기순", value: "popular" as const },
]

export default function EventDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const eventId = Number(id)

    const {
        selectedEvent, detailLoading, onFetchEventDetail,
        comments, commentTotal, commentLoading, hasNextComment, onFetchComments,
    } = useEventStore()

    const [sorting, setSorting] = useState<"latest" | "popular">("latest")

    useEffect(() => {
        onFetchEventDetail(eventId)
    }, [eventId, onFetchEventDetail])

    useEffect(() => {
        onFetchComments(eventId, sorting, 0)
    }, [eventId, sorting, onFetchComments])

    const handleSortChange = (s: "latest" | "popular") => {
        setSorting(s)
    }

    const handleLoadMore = () => {
        onFetchComments(eventId, sorting, comments.length)
    }

    return (
        <div className="min-h-screen">
            <div className="inner max-w-3xl mx-auto px-6 py-16">

                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors"
                >
                    ← 이벤트 목록
                </button>

                {detailLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : selectedEvent ? (
                    <div className="mb-12">
                        {selectedEvent.img && (
                            <div className="mb-7 overflow-hidden rounded-xl bg-white/5">
                                <img
                                    src={selectedEvent.img}
                                    alt={selectedEvent.name}
                                    className="w-full aspect-video object-cover"
                                />
                            </div>
                        )}

                        {/* 타이틀 */}
                        <div className="mb-6 flex flex-col gap-2">
                            <h1 className="text-xl font-bold">{selectedEvent.name}</h1>
                            <span className="text-white/30 text-sm">
                                {selectedEvent.start_datetime.slice(0, 10).replaceAll('-', '.')}
                                {' ~ '}
                                {selectedEvent.end_datetime.slice(0, 10).replaceAll('-', '.')}
                            </span>
                        </div>

                        {selectedEvent.contents?.blocks ? (
                            <div className="event-content w-full overflow-hidden rounded-xl bg-black">
                                {selectedEvent.contents.blocks.map((block, index) => {
                                    const text = block.content?.map((item) => item.content).join('') ?? ''

                                    if (block.type === 'image_v1' && block.src) {
                                        return (
                                            <img
                                                key={`${block.id}-${index}`}
                                                src={block.src}
                                                alt={selectedEvent.name}
                                                className="w-full object-cover"
                                            />
                                        )
                                    }

                                    if (block.type === 'heading_v1' && text) {
                                        return (
                                            <h2
                                                key={`${block.id}-${index}`}
                                                className="px-5 py-4 text-lg font-bold text-white"
                                                style={{ textAlign: block.textAlign ?? 'left' }}
                                            >
                                                {text}
                                            </h2>
                                        )
                                    }

                                    if (block.type === 'paragraph_v1' && text) {
                                        return (
                                            <p
                                                key={`${block.id}-${index}`}
                                                className="px-5 py-3 text-sm leading-relaxed text-white/70"
                                                style={{ textAlign: block.textAlign ?? 'left' }}
                                            >
                                                {text}
                                            </p>
                                        )
                                    }

                                    if (block.type === 'margin_v1') {
                                        return (
                                            <div
                                                key={`${block.id}-${index}`}
                                                style={{ height: block.size ?? 16 }}
                                            />
                                        )
                                    }

                                    return null
                                })}
                            </div>
                        ) : selectedEvent.content ? (
                            <div
                                className="event-content w-full [&_img]:w-full [&_img]:rounded-xl [&_img]:my-3"
                                dangerouslySetInnerHTML={{ __html: selectedEvent.content }}
                            />
                        ) : null}

                        {selectedEvent.status === "ongoing" && (
                            <button className="mt-8 w-full py-4 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-xl font-semibold text-white transition-colors">
                                이벤트 참여하기
                            </button>
                        )}
                    </div>
                ) : null}

                {/* 댓글 */}
                <div>
                    <div className="flex items-center justify-between mb-5">
                        <span className="font-semibold">
                            댓글 <span className="text-[#6c63ff]">{commentTotal}</span>
                        </span>
                        <div className="flex gap-1">
                            {sortOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleSortChange(opt.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sorting === opt.value
                                        ? 'bg-[#6c63ff] text-white'
                                        : 'bg-black/5 text-balcks/40 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {commentLoading && comments.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12 text-white/30 text-sm">
                            첫 번째 댓글을 남겨보세요!
                        </div>
                    ) : (
                        <>
                            <ul className="flex flex-col divide-y divide-white/5">
                                {comments.map((comment) => (
                                    <li key={comment.id} className="py-5 flex gap-3">
                                        <div className="flex-shrink-0">
                                            {comment.author?.profile_img ? (
                                                <img
                                                    src={comment.author.profile_img}
                                                    alt={comment.author?.nickname}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">
                                                    {comment.author?.nickname?.[0] ?? '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-black/80">
                                                    {comment.author?.nickname ?? '알 수 없음'}
                                                </span>
                                                <span className="text-xs text-black/25">
                                                    {comment.created?.slice(0, 10).replaceAll('-', '.')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-black/70 leading-relaxed break-words">
                                                {comment.content}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-xs text-black/30">
                                                    ♥ {comment.like_count.toLocaleString()}
                                                </span>
                                                {comment.reply_count > 0 && (
                                                    <span className="text-xs text-white/30">답글 {comment.reply_count}개</span>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* 더보기 */}
                            {hasNextComment && (
                                <button
                                    onClick={handleLoadMore}
                                    disabled={commentLoading}
                                    className="mt-6 w-full py-3 rounded-xl bg-black/5 hover:bg-white/10 text-black/50 hover:text-white text-sm font-medium transition-colors disabled:opacity-40"
                                >
                                    {commentLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border border-white/30 border-t-transparent rounded-full animate-spin" />
                                            불러오는 중...
                                        </span>
                                    ) : "댓글 더보기"}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
