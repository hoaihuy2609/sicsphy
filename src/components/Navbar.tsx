'use client';

import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="tiad-navbar">
      {/* Sidebar toggle button (exact MathTIAD style) */}
      <button 
        className="w-7 h-7 rounded bg-[#59080b] hover:bg-[#4a0a0c] text-white flex items-center justify-center transition"
        title="Thu gọn menu"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <polyline points="11 17 6 12 11 7" />
          <polyline points="18 17 13 12 18 7" />
        </svg>
      </button>

      {/* Brand logo & title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-[#59080b] flex items-center justify-center font-bold text-[#59080b]">
          <span className="text-sm font-extrabold tracking-tight">SP</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-extrabold text-[#59080b] tracking-wider text-base">SCISPHY</span>
          <span className="font-semibold text-xs text-stone-700 tracking-wide uppercase">
            Ngân hàng số Vật lý GDPT 2018
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Đăng ký gói */}
        <button className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-[#59080b] transition px-2 py-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <span>ĐĂNG KÝ GÓI</span>
        </button>

        {/* Mã KM */}
        <button className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-[#59080b] transition px-2 py-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          <span>MÃ KM</span>
        </button>

        {/* Góp ý */}
        <button className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-[#59080b] transition px-2 py-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>GÓP Ý</span>
        </button>

        {/* Bell */}
        <button className="p-1.5 text-stone-600 hover:text-[#59080b] transition relative">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
          <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 font-bold text-xs">
            <svg className="w-4 h-4 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-stone-800 leading-tight">HOÀI HUY</span>
            <span className="text-[10px] text-stone-500 leading-tight">hoaihuy0905@gmail.com</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-300 ml-1">
            FREE
          </span>
        </div>
      </div>
    </header>
  );
}
