'use client'
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'

import 'swiper/css';
import 'swiper/css/navigation';

import { Navigation, Autoplay } from 'swiper/modules';

type Banner = {
    url: string;
    title: string;
    content: string;
    button: string;
}

const Banners: Banner[] = [
    { url: "./images/store/StoreBanner1.png", title: "굿즈 컬렉션 OPEN", content: "코트의 열기를 그대로 ⚡ /n 하이큐 공식 굿즈 지금 만나보세요", button: "지금보러가기" },
    { url: "./images/store/StoreBanner2.png", title: "저주급 인기 주술회전 굿즈 컬렉션", content: "품절 전에 꼭 챙겨야 할 주술회전 인기 MD🔥", button: "지금보러가기" },
    { url: "./images/store/StoreBanner1.png", title: "굿즈 컬렉션 OPEN", content: "코트의 열기를 그대로 ⚡ /n 하이큐 공식 굿즈 지금 만나보세요", button: "지금보러가기" },
    { url: "./images/store/StoreBanner1.png", title: "굿즈 컬렉션 OPEN", content: "코트의 열기를 그대로 ⚡ /n 하이큐 공식 굿즈 지금 만나보세요", button: "지금보러가기" },
]

export default function StoreCarousel() {
    return (
        <div className="inner pt-[80px]">
            {/* 화살표 + 슬라이더를 감싸는 flex wrapper */}
            <div className="  relative flex items-center gap-4">

                {/* 커스텀 prev 버튼 */}
                <button className="store-swiper-prev flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-400 hover:bg-gray-500 transition-colors shadow-md z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* 슬라이더 */}
                <div className="rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                    <Swiper
                        slidesPerView={1}
                        loop={true}
                        autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                        }}
                        navigation={{
                            prevEl: '.store-swiper-prev',
                            nextEl: '.store-swiper-next',
                        }}
                        modules={[Navigation, Autoplay]}
                        className="mySwiper w-full"
                    >
                        {Banners.map((m, id) => (
                            <SwiperSlide key={id}>
                                <img src={m.url} alt={m.title} className="" />
                                <div className="text-box">
                                    <h1>{m.title}</h1>
                                    <p>{m.content}</p>
                                    <button>{m.button}</button>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* 커스텀 next 버튼 */}
                <button className="store-swiper-next flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-400 hover:bg-gray-500 transition-colors shadow-md z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

            </div>
        </div>
    )
}