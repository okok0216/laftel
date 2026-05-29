"use client";

import Image from "next/image";
import Link from "next/link";


// ─── Header Component ────────────────────────────────────────────────────────

export default function Header() {
    return (

        <header className="w-full  py-[10px] bg-white px-[10px]">

            <div className=" w-full h-[55px] flex items-center justify-between bg-[#6B5CE7] rounded-full px-[40px]">

                {/* ── 로고 영역 ── */}

                {/* 텍스트 로고 */}
                <div className="flex items-center gap-[6px]">

                    <h1>
                        <Link href="/"><img src="/images/logo-white.svg" alt="logo" className='h-12' /></Link>
                    </h1>
                    <span className="text-white/80 font-medium text-[15px] tracking-[0.5px] leading-none">
                        : store
                    </span>
                </div>


                {/* ── 우측 아이콘 영역 ── */}
                <nav className="flex items-center gap-[28px]">
                    <button
                        type="button"
                        aria-label="검색"
                        className="flex items-center justify-center w-[36px] h-[36px] rounded-full hover:bg-white/15 transition-colors duration-200 cursor-pointer"
                    >
                        <img src="./images/store/search.svg" alt="" />
                    </button>

                    <button
                        type="button"
                        aria-label="위시리스트"
                        className="flex items-center justify-center w-[36px] h-[36px] rounded-full hover:bg-white/15 transition-colors duration-200 cursor-pointer"
                    >
                        <img src="./images/store/wish.svg" alt="" />
                    </button>

                    <button
                        type="button"
                        aria-label="장바구니"
                        className="flex items-center justify-center w-[36px] h-[36px] rounded-full hover:bg-white/15 transition-colors duration-200 cursor-pointer"
                    >
                        <img src="./images/store/cart.svg" alt="" />
                    </button>
                </nav>
            </div>
        </header>
    );
}
