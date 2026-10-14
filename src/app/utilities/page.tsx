'use client';

import React, { useState } from 'react';
import MathRenderer from '@/components/MathRenderer';

interface MathExpression {
  type: string;
  raw: string;
  converted: string;
}

interface ValidationData {
  valid: boolean;
  issues: string[];
  errors?: string[];
  warnings?: string[];
}

export default function UtilitiesPage() {
  // ── TOOL 1: LaTeX → Unicode State ──────────────────────────────
  const [latexInput, setLatexInput] = useState<string>('\\vec{F} = m \\cdot \\vec{a} = m \\frac{d\\vec{v}}{dt}');
  const [unicodeResult, setUnicodeResult] = useState<string>('');
  const [charCount, setCharCount] = useState<number | null>(null);
  const [loadingUnicode, setLoadingUnicode] = useState<boolean>(false);
  const [errorUnicode, setErrorUnicode] = useState<string | null>(null);
  const [copiedUnicode, setCopiedUnicode] = useState<boolean>(false);
  const [showLatexPreview1, setShowLatexPreview1] = useState<boolean>(true);

  // ── TOOL 2: Math Expression Extractor State ─────────────────────
  const [extractorInput, setExtractorInput] = useState<string>(
    'Một vật dao động điều hoà có phương trình li độ $x = 4\\cos(2\\pi t + \\pi/3)$ cm. Động năng của vật biến thiên theo công thức $$W_d = \\frac{1}{2} m v^2 = W - \\frac{1}{2} k x^2$$. Hãy tính tần số góc $\\omega$ và cơ năng $W$.'
  );
  const [extractedExpressions, setExtractedExpressions] = useState<MathExpression[]>([]);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);
  const [loadingExtractor, setLoadingExtractor] = useState<boolean>(false);
  const [errorExtractor, setErrorExtractor] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<{ idx: number; kind: 'raw' | 'unicode' } | null>(null);

  // ── TOOL 3: LaTeX Validator State ───────────────────────────────
  const [validatorInput, setValidatorInput] = useState<string>(
    '\\int_{0}^{T} A \\cos(\\omega t + \\varphi) \\, dt = \\frac{A}{\\omega} \\left[ \\sin(\\omega T + \\varphi) - \\sin(\\varphi) \\right]'
  );
  const [validationResult, setValidationResult] = useState<ValidationData | null>(null);
  const [loadingValidator, setLoadingValidator] = useState<boolean>(false);
  const [errorValidator, setErrorValidator] = useState<string | null>(null);

  // ────────────────────────────────────────────────────────────────
  // Handlers for Tool 1: LaTeX → Unicode
  // ────────────────────────────────────────────────────────────────
  const handleConvertLatex = async (overrideText?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : latexInput;
    if (!textToSend.trim()) {
      setErrorUnicode('Vui lòng nhập công thức LaTeX.');
      return;
    }

    setLoadingUnicode(true);
    setErrorUnicode(null);

    try {
      const res = await fetch('/api/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'latex-to-unicode',
          latex: textToSend,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi chuyển đổi LaTeX sang Unicode.');
      }

      setUnicodeResult(data.text);
      setCharCount(data.charCount ?? data.text.length);
    } catch (err: any) {
      setErrorUnicode(err.message || 'Không thể kết nối đến máy chủ.');
      setUnicodeResult('');
      setCharCount(null);
    } finally {
      setLoadingUnicode(false);
    }
  };

  const copyToClipboard = (text: string, onDone: () => void) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    onDone();
  };

  // ────────────────────────────────────────────────────────────────
  // Handlers for Tool 2: Math Expression Extractor
  // ────────────────────────────────────────────────────────────────
  const handleExtractMath = async (overrideText?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : extractorInput;
    if (!textToSend.trim()) {
      setErrorExtractor('Vui lòng nhập đoạn văn bản chứa công thức.');
      return;
    }

    setLoadingExtractor(true);
    setErrorExtractor(null);

    try {
      const res = await fetch('/api/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract-math',
          text: textToSend,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi trích xuất công thức toán.');
      }

      setExtractedExpressions(data.expressions || []);
      setExtractedCount(data.count ?? (data.expressions ? data.expressions.length : 0));
    } catch (err: any) {
      setErrorExtractor(err.message || 'Không thể kết nối đến máy chủ.');
      setExtractedExpressions([]);
      setExtractedCount(null);
    } finally {
      setLoadingExtractor(false);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // Handlers for Tool 3: LaTeX Validator
  // ────────────────────────────────────────────────────────────────
  const handleValidateLatex = async (overrideText?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : validatorInput;
    if (!textToSend.trim()) {
      setErrorValidator('Vui lòng nhập mã LaTeX để kiểm tra.');
      return;
    }

    setLoadingValidator(true);
    setErrorValidator(null);

    try {
      const res = await fetch('/api/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate-latex',
          latex: textToSend,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi kiểm tra mã LaTeX.');
      }

      setValidationResult({
        valid: data.valid,
        issues: data.issues || [],
        errors: data.errors || (data.valid ? [] : (data.issues || [])),
        warnings: data.warnings || [],
      });
    } catch (err: any) {
      setErrorValidator(err.message || 'Không thể kết nối đến máy chủ.');
      setValidationResult(null);
    } finally {
      setLoadingValidator(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto text-[#1a0a0a]">
      {/* ── TOP HEADER / TOOLBAR ─────────────────────────────────── */}
      <div className="bg-white rounded-lg p-3.5 border border-[#e8ddd6] shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#59080b] flex items-center justify-center text-white font-bold shadow-sm">
            <svg className="w-4 h-4 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#59080b] uppercase tracking-wide">
                MODULE 6 — TIỆN ÍCH BIÊN SOẠN & XỬ LÝ TOÁN VẬT LÝ
              </h1>
              <span className="bg-[#fff8eb] text-[#59080b] border border-[#f0a500]/50 font-bold px-2 py-0.5 rounded text-[10px]">
                3 CÔNG CỤ TÍCH HỢP
              </span>
            </div>
            <p className="text-[11px] text-stone-600">
              Bộ công cụ hỗ trợ chuyển đổi LaTeX sang Unicode, trích xuất biểu thức toán học và kiểm tra cú pháp công thức chuẩn GDPT 2018.
            </p>
          </div>
        </div>

        {/* Quick Toolbar Badges */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#faf8f6] border border-[#e8ddd6] text-stone-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-[11px]">Sẵn sàng kết nối /api/utilities</span>
          </div>

          <button
            onClick={() => {
              setLatexInput('');
              setUnicodeResult('');
              setExtractorInput('');
              setExtractedExpressions([]);
              setValidatorInput('');
              setValidationResult(null);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#e8ddd6] hover:bg-stone-50 font-bold text-stone-700 text-xs transition"
            title="Làm mới toàn bộ dữ liệu"
          >
            <svg className="w-3.5 h-3.5 text-[#59080b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 2v6h6" />
              <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
              <path d="M21 22v-6h-6" />
              <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
            </svg>
            <span>LÀM MỚI TẤT CẢ</span>
          </button>
        </div>
      </div>

      {/* ── 3 TOOL CARDS GRID (1 col mobile, 3 cols desktop) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        
        {/* ═════════════════════════════════════════════════════════ */}
        {/* TOOL 1: LaTeX → Unicode Converter                         */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-lg border border-[#e8ddd6] shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
          {/* Card Header */}
          <div className="bg-[#59080b] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" y1="20" x2="15" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
              <h2 className="text-sm font-bold tracking-wide">CHUYỂN ĐỔI LATEX → UNICODE</h2>
            </div>
            <span className="bg-[#f0a500] text-stone-950 font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
              Công cụ 1
            </span>
          </div>

          {/* Card Body */}
          <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <span>Mã LaTeX nguồn:</span>
                  <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] text-stone-500 font-mono">
                  {latexInput.length} ký tự
                </span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-stone-500">Mẫu nhanh:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = '\\vec{F} = m \\cdot \\vec{a}';
                    setLatexInput(sample);
                    handleConvertLatex(sample);
                  }}
                  className="text-[10px] bg-[#fff8eb] border border-[#f0a500]/40 text-[#59080b] hover:bg-[#f0a500]/20 px-1.5 py-0.5 rounded transition"
                >
                  Lực F=ma
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = '\\omega = 2\\pi f = \\sqrt{\\frac{k}{m}}';
                    setLatexInput(sample);
                    handleConvertLatex(sample);
                  }}
                  className="text-[10px] bg-[#fff8eb] border border-[#f0a500]/40 text-[#59080b] hover:bg-[#f0a500]/20 px-1.5 py-0.5 rounded transition"
                >
                  Tần số ω
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'E = \\frac{1}{2}mv^2 + mgh';
                    setLatexInput(sample);
                    handleConvertLatex(sample);
                  }}
                  className="text-[10px] bg-[#fff8eb] border border-[#f0a500]/40 text-[#59080b] hover:bg-[#f0a500]/20 px-1.5 py-0.5 rounded transition"
                >
                  Cơ năng
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={latexInput}
                  onChange={(e) => setLatexInput(e.target.value)}
                  placeholder="Nhập mã công thức LaTeX (ví dụ: \vec{F} = m \cdot \vec{a}, \alpha + \beta = 90^\circ)..."
                  className="w-full p-2.5 text-xs font-mono border border-[#e8ddd6] rounded-md focus:outline-none focus:border-[#59080b] focus:ring-1 focus:ring-[#59080b] bg-[#faf8f6]/50 text-stone-900 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loadingUnicode || !latexInput.trim()}
                  onClick={() => handleConvertLatex()}
                  className="flex-1 bg-[#59080b] hover:bg-[#6e0b10] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs py-2 px-3 rounded shadow-sm flex items-center justify-center gap-1.5 transition"
                >
                  {loadingUnicode ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                      </svg>
                      <span>Đang chuyển...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      <span>Chuyển đổi</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLatexInput('');
                    setUnicodeResult('');
                    setErrorUnicode(null);
                    setCharCount(null);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-[#e8ddd6] rounded transition"
                  title="Xóa nội dung"
                >
                  Xóa
                </button>
              </div>

              {/* Error Message */}
              {errorUnicode && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorUnicode}</span>
                </div>
              )}

              {/* KaTeX Preview Box */}
              {latexInput.trim() && (
                <div className="border border-[#e8ddd6] rounded p-2.5 bg-[#faf8f6]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wide flex items-center gap-1">
                      <svg className="w-3 h-3 text-[#59080b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Xem trước hiển thị KaTeX:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLatexPreview1(!showLatexPreview1)}
                      className="text-[10px] text-stone-500 hover:text-stone-800 underline"
                    >
                      {showLatexPreview1 ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                  {showLatexPreview1 && (
                    <div className="p-2 bg-white rounded border border-[#f0e8e2] overflow-x-auto text-xs text-stone-900 text-center">
                      <MathRenderer content={`$$${latexInput.replace(/^\$\$|\$\$$/g, '')}$$`} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Unicode Result Display Area */}
            <div className="pt-2 border-t border-[#e8ddd6] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#59080b]">KẾT QUẢ UNICODE:</span>
                  {charCount !== null && (
                    <span className="bg-[#fff8eb] text-[#59080b] font-mono text-[10px] px-1.5 py-0.2 rounded border border-[#f0a500]/30 font-bold">
                      {charCount} ký tự
                    </span>
                  )}
                </div>

                {unicodeResult && (
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(unicodeResult, () => {
                        setCopiedUnicode(true);
                        setTimeout(() => setCopiedUnicode(false), 2000);
                      })
                    }
                    className="flex items-center gap-1 text-[11px] font-bold text-[#59080b] hover:text-[#3a0002] bg-[#faf8f6] hover:bg-[#f0e8e2] px-2 py-1 rounded border border-[#e8ddd6] transition"
                  >
                    {copiedUnicode ? (
                      <>
                        <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-emerald-700">Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {unicodeResult ? (
                <div className="p-3 bg-[#faf8f6] rounded border border-[#e8ddd6] font-mono text-xs text-stone-900 break-words select-all min-h-[60px] flex items-center">
                  {unicodeResult}
                </div>
              ) : (
                <div className="p-3 bg-[#faf8f6] rounded border border-dashed border-[#e8ddd6] text-center text-xs text-stone-400 min-h-[60px] flex items-center justify-center italic">
                  Chưa có kết quả. Nhấn &apos;Chuyển đổi&apos; để nhận văn bản Unicode.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* TOOL 2: Math Expression Extractor                         */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-lg border border-[#e8ddd6] shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
          {/* Card Header */}
          <div className="bg-[#59080b] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
                <path d="M12 8v8" />
              </svg>
              <h2 className="text-sm font-bold tracking-wide">TRÍCH XUẤT CÔNG THỨC TOÁN</h2>
            </div>
            <span className="bg-[#f0a500] text-stone-950 font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
              Công cụ 2
            </span>
          </div>

          {/* Card Body */}
          <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <span>Văn bản chứa công thức ($ hoặc $$):</span>
                  <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] text-stone-500 font-mono">
                  {extractorInput.length} ký tự
                </span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-stone-500">Mẫu nhanh:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'Một con lắc dao động theo $x = 5\\cos(4\\pi t)$ cm. Cơ năng $W = 0{,}02\\text{ J}$.';
                    setExtractorInput(sample);
                    handleExtractMath(sample);
                  }}
                  className="text-[10px] bg-[#fff8eb] border border-[#f0a500]/40 text-[#59080b] hover:bg-[#f0a500]/20 px-1.5 py-0.5 rounded transition"
                >
                  Con lắc đơn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'Tần số góc $\\omega = \\sqrt{\\frac{k}{m}}$ và chu kì dao động $$T = 2\\pi \\sqrt{\\frac{m}{k}}$$.';
                    setExtractorInput(sample);
                    handleExtractMath(sample);
                  }}
                  className="text-[10px] bg-[#fff8eb] border border-[#f0a500]/40 text-[#59080b] hover:bg-[#f0a500]/20 px-1.5 py-0.5 rounded transition"
                >
                  Công thức T & ω
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={extractorInput}
                  onChange={(e) => setExtractorInput(e.target.value)}
                  placeholder="Nhập đoạn văn bản hoặc đề bài có chứa công thức $...$ hoặc $$...$$..."
                  className="w-full p-2.5 text-xs font-mono border border-[#e8ddd6] rounded-md focus:outline-none focus:border-[#59080b] focus:ring-1 focus:ring-[#59080b] bg-[#faf8f6]/50 text-stone-900 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loadingExtractor || !extractorInput.trim()}
                  onClick={() => handleExtractMath()}
                  className="flex-1 bg-[#59080b] hover:bg-[#6e0b10] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs py-2 px-3 rounded shadow-sm flex items-center justify-center gap-1.5 transition"
                >
                  {loadingExtractor ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                      </svg>
                      <span>Đang bóc tách...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span>Trích xuất</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExtractorInput('');
                    setExtractedExpressions([]);
                    setExtractedCount(null);
                    setErrorExtractor(null);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-[#e8ddd6] rounded transition"
                  title="Xóa nội dung"
                >
                  Xóa
                </button>
              </div>

              {/* Error Message */}
              {errorExtractor && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorExtractor}</span>
                </div>
              )}
            </div>

            {/* Extracted Expressions List */}
            <div className="pt-2 border-t border-[#e8ddd6] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#59080b]">DANH SÁCH BIỂU THỨC:</span>
                {extractedCount !== null && (
                  <span className="bg-[#fff8eb] text-[#59080b] font-mono text-[10px] px-2 py-0.5 rounded border border-[#f0a500]/30 font-bold">
                    Tìm thấy: {extractedCount}
                  </span>
                )}
              </div>

              {extractedExpressions.length > 0 ? (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {extractedExpressions.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded border border-[#e8ddd6] bg-[#faf8f6] hover:border-[#f0a500]/60 transition text-xs space-y-1.5"
                    >
                      {/* Badge header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.type === 'display'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {item.type === 'display' ? 'Khối ($$)' : 'Nội dòng ($)'} #{idx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(item.raw, () => {
                                setCopiedIndex({ idx, kind: 'raw' });
                                setTimeout(() => setCopiedIndex(null), 2000);
                              })
                            }
                            className="text-[10px] text-stone-600 hover:text-[#59080b] bg-white px-1.5 py-0.5 rounded border border-[#e8ddd6] transition font-medium"
                            title="Sao chép LaTeX thô"
                          >
                            {copiedIndex?.idx === idx && copiedIndex.kind === 'raw' ? '✓ Đã chép' : 'Chép LaTeX'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(item.converted, () => {
                                setCopiedIndex({ idx, kind: 'unicode' });
                                setTimeout(() => setCopiedIndex(null), 2000);
                              })
                            }
                            className="text-[10px] text-[#59080b] hover:text-[#3a0002] bg-[#fff8eb] px-1.5 py-0.5 rounded border border-[#f0a500]/40 transition font-bold"
                            title="Sao chép Unicode"
                          >
                            {copiedIndex?.idx === idx && copiedIndex.kind === 'unicode' ? '✓ Đã chép' : 'Chép Unicode'}
                          </button>
                        </div>
                      </div>

                      {/* Raw LaTeX code */}
                      <div className="font-mono text-[11px] bg-white p-1.5 rounded border border-[#e8ddd6] text-stone-700 break-all">
                        {item.raw}
                      </div>

                      {/* Unicode result */}
                      <div className="text-[11px] text-stone-800 font-mono flex items-center gap-1">
                        <span className="text-stone-400 font-sans text-[10px]">Unicode:</span>
                        <span className="font-semibold text-[#59080b]">{item.converted}</span>
                      </div>

                      {/* KaTeX visual rendering */}
                      <div className="bg-white p-1 rounded border border-[#f0e8e2] text-center text-xs overflow-x-auto">
                        <MathRenderer content={item.raw} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-[#faf8f6] rounded border border-dashed border-[#e8ddd6] text-center text-xs text-stone-400 min-h-[60px] flex items-center justify-center italic">
                  Chưa có công thức nào. Nhấn &apos;Trích xuất&apos; để phân tách biểu thức.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* TOOL 3: LaTeX Validator                                   */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-lg border border-[#e8ddd6] shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
          {/* Card Header */}
          <div className="bg-[#59080b] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h2 className="text-sm font-bold tracking-wide">KIỂM TRA CÚ PHÁP LATEX</h2>
            </div>
            <span className="bg-[#f0a500] text-stone-950 font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
              Công cụ 3
            </span>
          </div>

          {/* Card Body */}
          <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <span>Mã LaTeX cần kiểm tra:</span>
                  <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] text-stone-500 font-mono">
                  {validatorInput.length} ký tự
                </span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-stone-500">Mẫu test:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'T = 2\\pi \\sqrt{\\frac{l}{g}}';
                    setValidatorInput(sample);
                    handleValidateLatex(sample);
                  }}
                  className="text-[10px] bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition"
                >
                  ✓ Mẫu hợp lệ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = '\\frac{2\\pi}{\\lambda';
                    setValidatorInput(sample);
                    handleValidateLatex(sample);
                  }}
                  className="text-[10px] bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-100 px-1.5 py-0.5 rounded transition"
                >
                  ✗ Thiếu ngoặc {'}'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = '$E = mc^2';
                    setValidatorInput(sample);
                    handleValidateLatex(sample);
                  }}
                  className="text-[10px] bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-100 px-1.5 py-0.5 rounded transition"
                >
                  ✗ Lẻ dấu $
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = '\\begin{circuitikz} \\draw (0,0) to[R] (2,0); \\end{circuitikz}';
                    setValidatorInput(sample);
                    handleValidateLatex(sample);
                  }}
                  className="text-[10px] bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 px-1.5 py-0.5 rounded transition"
                >
                  ⚠️ Gói TikZ cảnh báo
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={validatorInput}
                  onChange={(e) => setValidatorInput(e.target.value)}
                  placeholder="Nhập mã LaTeX để kiểm tra cú pháp đóng mở {}, dấu $, lệnh phân số..."
                  className="w-full p-2.5 text-xs font-mono border border-[#e8ddd6] rounded-md focus:outline-none focus:border-[#59080b] focus:ring-1 focus:ring-[#59080b] bg-[#faf8f6]/50 text-stone-900 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loadingValidator || !validatorInput.trim()}
                  onClick={() => handleValidateLatex()}
                  className="flex-1 bg-[#59080b] hover:bg-[#6e0b10] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs py-2 px-3 rounded shadow-sm flex items-center justify-center gap-1.5 transition"
                >
                  {loadingValidator ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                      </svg>
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Kiểm tra cú pháp</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setValidatorInput('');
                    setValidationResult(null);
                    setErrorValidator(null);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-[#e8ddd6] rounded transition"
                  title="Xóa nội dung"
                >
                  Xóa
                </button>
              </div>

              {/* Error Alert from Server */}
              {errorValidator && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorValidator}</span>
                </div>
              )}
            </div>

            {/* Validation Result Display Area */}
            <div className="pt-2 border-t border-[#e8ddd6] space-y-2">
              <span className="text-xs font-bold text-[#59080b]">KẾT QUẢ KIỂM ĐỊNH:</span>

              {validationResult ? (
                <div className="space-y-2.5">
                  {/* Status Banner */}
                  {validationResult.valid ? (
                    <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-emerald-800">Cú pháp hợp lệ (Valid)</div>
                        <div className="text-[11px] text-emerald-700">
                          Không phát hiện lỗi cấu trúc ngoặc hay phân số.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-md bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-rose-800">Phát hiện lỗi cú pháp (Invalid)</div>
                        <div className="text-[11px] text-rose-700">
                          Vui lòng kiểm tra và sửa các lỗi bên dưới trước khi biên dịch.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Errors List (Red) */}
                  {validationResult.errors && validationResult.errors.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                        <span>Danh sách lỗi ({validationResult.errors.length}):</span>
                      </div>
                      <div className="space-y-1">
                        {validationResult.errors.map((errItem, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-1.5"
                          >
                            <span className="text-rose-500 font-bold shrink-0">#{idx + 1}</span>
                            <span className="font-mono text-[11px]">{errItem}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings List (Amber) */}
                  {validationResult.warnings && validationResult.warnings.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        <span>Cảnh báo tương thích ({validationResult.warnings.length}):</span>
                      </div>
                      <div className="space-y-1">
                        {validationResult.warnings.map((warnItem, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-1.5"
                          >
                            <span className="text-amber-600 font-bold shrink-0">⚠️</span>
                            <span className="text-[11px]">{warnItem}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rendered Preview if Valid */}
                  {validationResult.valid && (
                    <div className="p-2.5 bg-white rounded border border-[#e8ddd6] space-y-1">
                      <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                        Hiển thị KaTeX tương ứng:
                      </div>
                      <div className="p-2 bg-[#faf8f6] rounded border border-[#f0e8e2] text-center text-xs overflow-x-auto">
                        <MathRenderer content={`$$${validatorInput.replace(/^\$\$|\$\$$/g, '')}$$`} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-[#faf8f6] rounded border border-dashed border-[#e8ddd6] text-center text-xs text-stone-400 min-h-[60px] flex items-center justify-center italic">
                  Chưa có dữ liệu kiểm định. Nhấn &apos;Kiểm tra cú pháp&apos; để phân tích.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── FOOTER GUIDE / TIPS ──────────────────────────────────── */}
      <div className="bg-[#fff8eb] border border-[#f0a500]/40 rounded-lg p-3.5 text-xs text-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#f0a500] text-stone-900 flex items-center justify-center font-bold text-xs shrink-0">
            ℹ
          </div>
          <div>
            <span className="font-bold text-[#59080b]">Gợi ý quy chuẩn soạn thảo đề:</span>{' '}
            <span className="text-[11px] text-stone-700">
              Sử dụng dấu $ cho công thức nội dòng và $$ cho công thức hiển thị riêng biệt theo chuẩn KaTeX. Ký hiệu vectơ nên dùng &apos;\vec&#123;...&#125;&apos; và phân số dùng &apos;\frac&#123;...&#125;&#123;...&#125;&apos;.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#59080b]">
          <span>Phiên bản: ScisPhy 1.0 (GDPT 2018)</span>
        </div>
      </div>
    </div>
  );
}
