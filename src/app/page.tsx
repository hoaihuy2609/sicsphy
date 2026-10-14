import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col justify-between min-h-[calc(100vh-52px)]">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        {/* Left Column: Text & CTA */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#1a0a0a] uppercase leading-tight">
              QUẢN LÝ ĐỀ THI{' '}
              <span className="text-[#59080b]">THÔNG MINH</span>{' '}
              <br />
              <span className="text-[#f0a500]">CÙNG SCISPHY</span>
            </h1>
            <p className="text-sm md:text-base text-stone-600 leading-relaxed max-w-xl pt-2">
              Hệ thống dữ liệu câu hỏi Vật lý được chuẩn hóa hàng đầu dành cho giáo viên và nhà trường.
              Tích hợp công nghệ biên soạn đề thi tự động, quản lý ma trận chuẩn GDPT 2018 và xuất bản chuyên nghiệp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/question-bank"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#59080b] hover:bg-[#4a0a0c] text-white font-bold text-sm tracking-wide shadow-md transition transform active:scale-95"
            >
              <span>Vào Ngân Hàng Đề</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            <Link
              href="/matrix"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-stone-50 text-[#1a0a0a] border border-stone-300 font-bold text-sm tracking-wide shadow-sm transition"
            >
              <span>Khám Phá Ma Trận</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Physics Atom 3D Graphic */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#59080b]/10 to-[#f0a500]/15 rounded-full blur-2xl" />

            {/* Cylinder / Orbit Representation matching MathTIAD hero visual */}
            <div className="relative w-72 h-72 border-2 border-[#59080b]/30 rounded-full flex items-center justify-center p-6 bg-white/70 backdrop-blur-sm shadow-xl">
              <svg viewBox="0 0 200 200" className="w-full h-full text-[#59080b]">
                {/* Orbit 1 */}
                <ellipse cx="100" cy="100" rx="85" ry="32" fill="none" stroke="#59080b" strokeWidth="2" strokeDasharray="4 2" transform="rotate(30 100 100)" />
                {/* Orbit 2 */}
                <ellipse cx="100" cy="100" rx="85" ry="32" fill="none" stroke="#f0a500" strokeWidth="2.5" transform="rotate(-30 100 100)" />
                {/* Orbit 3 */}
                <ellipse cx="100" cy="100" rx="85" ry="32" fill="none" stroke="#59080b" strokeWidth="2" transform="rotate(90 100 100)" />
                
                {/* Nucleus */}
                <circle cx="100" cy="100" r="18" fill="url(#nucleusGrad)" filter="drop-shadow(0 4px 6px rgba(89,8,11,0.4))" />
                
                {/* Electrons / Photons */}
                <circle cx="165" cy="62" r="6" fill="#f0a500" filter="drop-shadow(0 2px 4px rgba(240,165,0,0.5))" />
                <circle cx="35" cy="138" r="6" fill="#f0a500" filter="drop-shadow(0 2px 4px rgba(240,165,0,0.5))" />
                <circle cx="100" cy="15" r="5" fill="#59080b" />
                <circle cx="100" cy="185" r="5" fill="#59080b" />

                <defs>
                  <linearGradient id="nucleusGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f0a500" />
                    <stop offset="100%" stopColor="#59080b" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute -bottom-3 bg-white px-3 py-1 rounded-full border border-stone-200 text-[11px] font-bold text-stone-700 shadow-sm">
                Vật Lý 10 • 11 • 12 (GDPT 2018)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 3 MathTIAD Signature Cards */}
      <div className="pt-8 pb-4">
        <div className="bg-white/80 rounded-2xl p-4 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 px-2 text-xs font-bold text-stone-500">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span className="ml-2 font-mono text-[11px] text-stone-400">scisphy.edu.vn</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <Link
              href="/question-bank"
              className="bg-[#59080b] hover:bg-[#4a0a0c] text-white rounded-xl p-5 transition transform hover:-translate-y-0.5 shadow-md group block"
            >
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                <h3 className="text-base font-extrabold tracking-wide">15.000+ Câu Hỏi</h3>
              </div>
              <p className="text-xs text-stone-200/90 leading-relaxed">
                Phân loại chi tiết theo từng chuyên đề K10-K12 và 4 mức độ nhận thức chuẩn Bộ GD&ĐT.
              </p>
            </Link>

            {/* Card 2 */}
            <Link
              href="/matrix"
              className="bg-[#59080b] hover:bg-[#4a0a0c] text-white rounded-xl p-5 transition transform hover:-translate-y-0.5 shadow-md group block"
            >
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <h3 className="text-base font-extrabold tracking-wide">Ma Trận Tự Động</h3>
              </div>
              <p className="text-xs text-stone-200/90 leading-relaxed">
                Tạo cấu trúc đề thi thử, kiểm tra học kỳ chuẩn định dạng 2025: 18 TN + 4 Đ/S + 6 TLN với quy tắc 70/30.
              </p>
            </Link>

            {/* Card 3 */}
            <Link
              href="/word-editor"
              className="bg-[#59080b] hover:bg-[#4a0a0c] text-white rounded-xl p-5 transition transform hover:-translate-y-0.5 shadow-md group block"
            >
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <h3 className="text-base font-extrabold tracking-wide">Xuất bản Word/Latex</h3>
              </div>
              <p className="text-xs text-stone-200/90 leading-relaxed">
                Tương thích MathType, Equation OMML và hình vẽ mạch điện TikZ, đồ thị dao động sắc nét.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
