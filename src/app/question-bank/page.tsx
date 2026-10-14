'use client';

import React, { useState, useEffect } from 'react';
import MathRenderer from '@/components/MathRenderer';

interface Topic {
  id: string;
  name: string;
  order: number;
  _count?: { questions: number };
}

interface Chapter {
  id: string;
  name: string;
  order: number;
  topics: Topic[];
  _count?: { questions: number };
}

interface GradeTree {
  id: string;
  code: number;
  name: string;
  chapters: Chapter[];
  _count?: { questions: number };
}

interface Question {
  id: string;
  code: string;
  grade: number;
  subject: string;
  format: string;
  difficulty: number;
  content: string;
  options: any;
  correctAnswer?: string;
  explanation?: string;
  tikzCode?: string;
  topic?: {
    id: string;
    name: string;
    chapter?: {
      id: string;
      name: string;
    };
  };
}

export default function QuestionBankPage() {
  // Tree & Taxonomy State
  const [tree, setTree] = useState<GradeTree[]>([]);
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({ '12': true });
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [treeSearch, setTreeSearch] = useState('');

  // Filter State
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Data State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    byDifficulty: { 1: 0, 2: 0, 3: 0, 4: 0 },
    byFormat: { multipleChoice: 0, trueFalse: 0, shortAnswer: 0, essay: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Cart / Selection State (Chon tat ca toi da 22 cau cho ma tran)
  const [selectedQuestions, setSelectedQuestions] = useState<Record<string, boolean>>({});
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [expandedTikz, setExpandedTikz] = useState<Record<string, boolean>>({});

  // 1. Fetch Taxonomy Tree
  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const res = await fetch('/api/taxonomy');
        const data = await res.json();
        if (data.success && data.tree) {
          setTree(data.tree);
        }
      } catch (err) {
        console.error('Failed to load taxonomy', err);
      }
    }
    loadTaxonomy();
  }, []);

  // 2. Fetch Questions
  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedGrade) params.set('grade', selectedGrade.toString());
        if (selectedChapterId) params.set('chapterId', selectedChapterId);
        if (selectedTopicId) params.set('topicId', selectedTopicId);
        if (selectedDifficulty) params.set('difficulty', selectedDifficulty.toString());
        if (selectedFormat) params.set('format', selectedFormat);
        if (searchQuery) params.set('q', searchQuery);
        params.set('page', page.toString());
        params.set('limit', '20');

        const res = await fetch(`/api/questions?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setQuestions(data.data || []);
          setTotal(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 1);
          if (data.stats) {
            // API returns byDifficulty.level1/2/3/4 — normalize to {1,2,3,4}
            setStats({
              byDifficulty: {
                1: data.stats.byDifficulty?.level1 || 0,
                2: data.stats.byDifficulty?.level2 || 0,
                3: data.stats.byDifficulty?.level3 || 0,
                4: data.stats.byDifficulty?.level4 || 0,
              },
              byFormat: data.stats.byFormat || {
                multipleChoice: 0, trueFalse: 0, shortAnswer: 0, essay: 0,
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [selectedGrade, selectedChapterId, selectedTopicId, selectedDifficulty, selectedFormat, searchQuery, page]);

  const toggleGrade = (gradeId: string) => {
    setExpandedGrades(prev => ({ ...prev, [gradeId]: !prev[gradeId] }));
  };

  const toggleChapter = (chapId: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapId]: !prev[chapId] }));
  };

  const toggleSelectQuestion = (qId: string) => {
    setSelectedQuestions(prev => {
      const currentCount = Object.values(prev).filter(Boolean).length;
      if (!prev[qId] && currentCount >= 22) {
        alert('Tối đa 22 câu theo cấu trúc ma trận chuẩn Bộ GD&ĐT 2025!');
        return prev;
      }
      return { ...prev, [qId]: !prev[qId] };
    });
  };

  const formatBadgeText = (fmt: string) => {
    switch (fmt) {
      case 'MULTIPLE_CHOICE':
        return 'Trắc nghiệm';
      case 'TRUE_FALSE':
        return 'Đúng/Sai';
      case 'SHORT_ANSWER':
        return 'Trả lời ngắn';
      case 'ESSAY':
        return 'Tự luận';
      default:
        return fmt;
    }
  };

  return (
    <div className="p-4 space-y-3 max-w-[1600px] mx-auto text-[#1a0a0a]">
      {/* 1. TOP TOOLBAR matching MathTIAD */}
      <div className="bg-white rounded-lg p-2.5 border border-[#e8ddd6] shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left search */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-8 pr-8 py-1.5 w-64 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
            />
            <svg className="w-3.5 h-3.5 text-stone-400 absolute left-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <button className="absolute right-2 text-stone-400 hover:text-stone-600" title="Tìm bằng hình ảnh">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
          </div>

          {/* Pagination badge */}
          <div className="flex items-center gap-1 bg-[#59080b] text-white px-3 py-1.5 rounded font-bold">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="disabled:opacity-40 hover:text-[#f0a500]"
            >
              &lt;
            </button>
            <span className="mx-1">Trang {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="disabled:opacity-40 hover:text-[#f0a500]"
            >
              &gt;
            </button>
          </div>
        </div>

        {/* Right toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#e8ddd6] hover:bg-stone-50 font-bold text-stone-700">
            <svg className="w-3.5 h-3.5 text-[#59080b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            <span>SẮP XẾP</span>
          </button>

          <button
            onClick={() => {
              const all: Record<string, boolean> = {};
              questions.slice(0, 22).forEach(q => { all[q.id] = true; });
              setSelectedQuestions(all);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#59080b] text-[#59080b] hover:bg-[#59080b] hover:text-white transition font-bold"
          >
            <span>CHỌN TẤT CẢ (TỐI ĐA 22)</span>
            <span className="ml-1 bg-[#f0a500] text-stone-900 rounded-full px-1.5 py-0.2 text-[10px]">
              {Object.values(selectedQuestions).filter(Boolean).length}
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedGrade(null);
              setSelectedChapterId(null);
              setSelectedTopicId(null);
              setSelectedDifficulty(null);
              setSelectedFormat(null);
              setSearchQuery('');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#e8ddd6] hover:bg-stone-50 font-bold text-stone-700"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>XÓA BỘ LỌC</span>
          </button>

          <button className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#e8ddd6] hover:bg-stone-50 font-bold text-stone-700">
            <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>XUẤT FILE ▾</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* LEFT COLUMN: CÂY MỤC LỤC */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-[#e8ddd6] overflow-hidden shadow-sm">
          {/* Burgundy Header */}
          <div className="bg-[#59080b] text-white px-4 py-2.5 font-bold text-sm tracking-wide flex items-center justify-between">
            <span>Cây mục lục</span>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-amber-200">
              Vật lý GDPT 2018
            </span>
          </div>

          <div className="p-2.5 space-y-2">
            {/* Tree search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm thư mục..."
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
              />
              <svg className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Tree root: Tất cả */}
            <div
              onClick={() => {
                setSelectedGrade(null);
                setSelectedChapterId(null);
                setSelectedTopicId(null);
              }}
              className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs font-bold transition ${
                selectedGrade === null && selectedChapterId === null && selectedTopicId === null
                  ? 'bg-[#fff8eb] text-[#59080b] border-l-4 border-[#59080b]'
                  : 'hover:bg-stone-50 text-stone-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#f0a500]">📁</span>
                <span>Tất cả</span>
              </div>
              <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px] text-stone-600 font-mono">
                {tree.reduce((acc, g) => acc + (g._count?.questions || 0), 0)}
              </span>
            </div>

            {/* Grades Tree */}
            <div className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {tree.map((grade) => (
                <div key={grade.id} className="space-y-0.5">
                  {/* Grade header */}
                  <div
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs font-bold transition ${
                      selectedGrade === grade.code && !selectedChapterId && !selectedTopicId
                        ? 'bg-[#fff8eb] text-[#59080b] border-l-4 border-[#59080b]'
                        : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div
                      className="flex items-center gap-1.5 flex-1"
                      onClick={() => toggleGrade(grade.code.toString())}
                    >
                      <span className="text-[10px] text-stone-400 font-mono">
                        {expandedGrades[grade.code.toString()] ? '▼' : '▶'}
                      </span>
                      <span className="text-[#f0a500]">📁</span>
                      <span onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGrade(grade.code);
                        setSelectedChapterId(null);
                        setSelectedTopicId(null);
                      }}>
                        {grade.name}
                      </span>
                    </div>
                    <span className="bg-stone-100 px-1.5 py-0.2 rounded text-[10px] text-stone-600 font-mono">
                      {grade._count?.questions || 0}
                    </span>
                  </div>

                  {/* Chapters */}
                  {expandedGrades[grade.code.toString()] && grade.chapters && (
                    <div className="pl-4 space-y-0.5 border-l border-stone-200 ml-2">
                      {grade.chapters.map((chap) => (
                        <div key={chap.id}>
                          <div
                            className={`flex items-center justify-between p-1 rounded cursor-pointer text-[11px] transition ${
                              selectedChapterId === chap.id && !selectedTopicId
                                ? 'bg-[#fff8eb] text-[#59080b] font-bold'
                                : 'hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <div
                              className="flex items-center gap-1 flex-1 truncate"
                              onClick={() => toggleChapter(chap.id)}
                            >
                              <span className="text-[9px] text-stone-400">
                                {expandedChapters[chap.id] ? '▼' : '▶'}
                              </span>
                              <span className="text-amber-500">📁</span>
                              <span
                                className="truncate"
                                title={chap.name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGrade(grade.code);
                                  setSelectedChapterId(chap.id);
                                  setSelectedTopicId(null);
                                }}
                              >
                                {chap.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-400 font-mono pl-1">
                              {chap._count?.questions || 0}
                            </span>
                          </div>

                          {/* Topics */}
                          {expandedChapters[chap.id] && chap.topics && (
                            <div className="pl-3 space-y-0.5 border-l border-stone-200 ml-2">
                              {chap.topics.map((topic) => (
                                <div
                                  key={topic.id}
                                  onClick={() => {
                                    setSelectedGrade(grade.code);
                                    setSelectedChapterId(chap.id);
                                    setSelectedTopicId(topic.id);
                                  }}
                                  className={`flex items-center justify-between p-1 rounded cursor-pointer text-[11px] transition ${
                                    selectedTopicId === topic.id
                                      ? 'bg-[#59080b] text-white font-bold'
                                      : 'hover:bg-stone-50 text-stone-600'
                                  }`}
                                >
                                  <span className="truncate" title={topic.name}>
                                    • {topic.name}
                                  </span>
                                  <span className="text-[10px] opacity-70 font-mono pl-1">
                                    {topic._count?.questions || 0}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STATS BAR + 2-COL QUESTION GRID */}
        <div className="lg:col-span-9 space-y-3">
          {/* STATS BAR (MathTIAD Header Style) */}
          <div className="bg-white rounded-lg border border-[#e8ddd6] overflow-hidden shadow-sm">
            <div className="bg-[#59080b] text-white px-4 py-1.5 font-bold text-xs tracking-wider uppercase flex items-center justify-between">
              <span>Bảng Thống kê Phân bổ</span>
              <span className="text-[10px] text-[#f0a500]">
                Bộ lọc hiện tại: {total} câu hỏi
              </span>
            </div>

            <div className="p-2.5 space-y-2 text-xs">
              {/* Row 1: MỨC ĐỘ NHẬN THỨC */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#59080b] w-12 text-[11px] uppercase">Mức:</span>
                {[
                  { level: 1, label: 'Nhận biết (M1)', count: stats.byDifficulty[1] },
                  { level: 2, label: 'Thông hiểu (M2)', count: stats.byDifficulty[2] },
                  { level: 3, label: 'Vận dụng (M3)', count: stats.byDifficulty[3] },
                  { level: 4, label: 'Vận dụng cao (M4)', count: stats.byDifficulty[4] },
                ].map(({ level, label, count }) => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === level ? null : level)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition border ${
                      selectedDifficulty === level
                        ? 'bg-[#59080b] text-white border-[#59080b]'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-[#e8ddd6]'
                    }`}
                  >
                    <span>Mức {level}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      selectedDifficulty === level ? 'bg-[#f0a500] text-stone-900' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Row 2: DẠNG THỨC GDPT 2025 */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
                <span className="font-bold text-[#59080b] w-12 text-[11px] uppercase">Kiểu:</span>
                {[
                  { key: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm', count: stats.byFormat.multipleChoice },
                  { key: 'TRUE_FALSE', label: 'Đúng sai', count: stats.byFormat.trueFalse },
                  { key: 'SHORT_ANSWER', label: 'Trả lời ngắn', count: stats.byFormat.shortAnswer },
                  { key: 'ESSAY', label: 'Tự luận', count: stats.byFormat.essay },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFormat(selectedFormat === key ? null : key)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition border ${
                      selectedFormat === key
                        ? 'bg-[#59080b] text-white border-[#59080b]'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-[#e8ddd6]'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      selectedFormat === key ? 'bg-[#f0a500] text-stone-900' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-1.5 font-bold text-stone-600">
                  <span>Tổng:</span>
                  <span className="bg-[#59080b] text-white px-2 py-0.5 rounded font-mono text-[11px]">
                    {total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. QUESTION CARDS GRID (2 COLUMNS matching MathTIAD!) */}
          {loading ? (
            <div className="bg-white rounded-lg p-12 text-center border border-[#e8ddd6]">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-[#59080b] border-t-transparent rounded-full mb-3" />
              <p className="text-xs text-stone-500 font-semibold">Đang tải câu hỏi từ hệ thống ScisPhy...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-[#e8ddd6]">
              <p className="text-sm font-bold text-stone-700">Không tìm thấy câu hỏi nào phù hợp với bộ lọc!</p>
              <p className="text-xs text-stone-500 mt-1">Hãy thử xóa bộ lọc hoặc chọn chuyên đề khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {questions.map((q, idx) => {
                const isSelected = !!selectedQuestions[q.id];
                const showSolution = !!expandedSolutions[q.id];
                const showTikz = !!expandedTikz[q.id];

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-lg border transition shadow-sm overflow-hidden flex flex-col justify-between ${
                      isSelected ? 'border-[#59080b] ring-1 ring-[#59080b]' : 'border-[#e8ddd6] hover:border-stone-400'
                    }`}
                  >
                    {/* Top MathTIAD Burgundy Header Bar */}
                    <div className="bg-[#59080b] text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-200">Câu {idx + 1 + (page - 1) * 20}</span>
                        <span className="bg-[#f0a500] text-stone-900 px-1.5 py-0.2 rounded text-[10px] uppercase font-extrabold">
                          {formatBadgeText(q.format)}
                        </span>
                        <span className="bg-black/30 text-stone-200 px-1 py-0.2 rounded text-[9px]">
                          CHƯA TẢI
                        </span>
                      </div>

                      {/* Difficulty level badges + Add Button */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4].map((lvl) => (
                          <span
                            key={lvl}
                            className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                              q.difficulty === lvl
                                ? 'bg-[#f0a500] text-stone-900 ring-1 ring-white'
                                : 'bg-black/20 text-stone-300 opacity-60'
                            }`}
                          >
                            MỨC {lvl}
                          </span>
                        ))}

                        <button
                          onClick={() => toggleSelectQuestion(q.id)}
                          className={`ml-1 px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
                            isSelected
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              : 'bg-[#f0a500] hover:bg-[#d99200] text-stone-900'
                          }`}
                        >
                          {isSelected ? '✓ ĐÃ CHỌN' : '+ THÊM'}
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3 space-y-2 flex-1 text-xs">
                      {/* Code and topic tags */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span className="font-mono font-bold text-[#59080b] bg-[#fff8eb] px-1.5 py-0.5 rounded border border-[#f0a500]/30">
                          {q.code}
                        </span>
                        <span className="truncate max-w-[200px]" title={q.topic?.name}>
                          {q.topic?.chapter?.name ? `${q.topic.chapter.name} › ` : ''}{q.topic?.name}
                        </span>
                      </div>

                      {/* Question Text with KaTeX */}
                      <div className="text-stone-800 leading-relaxed font-serif text-[13px] pt-1">
                        <MathRenderer content={q.content} />
                      </div>

                      {/* Multiple Choice Options (A, B, C, D) */}
                      {q.format === 'MULTIPLE_CHOICE' && q.options && (
                        <div className="grid grid-cols-1 gap-1 pt-1.5">
                          {Array.isArray(q.options) ? (
                            q.options.map((opt: any, optIdx: number) => {
                              const label = typeof opt === 'string' ? opt : opt.text || '';
                              const prefix = ['A.', 'B.', 'C.', 'D.'][optIdx] || `${optIdx + 1}.`;
                              return (
                                <div
                                  key={optIdx}
                                  className="flex items-start gap-1.5 p-1 rounded hover:bg-stone-50 border border-transparent hover:border-stone-200"
                                >
                                  <span className="font-bold text-[#59080b]">{prefix}</span>
                                  <div className="flex-1 font-serif">
                                    <MathRenderer content={label} />
                                  </div>
                                </div>
                              );
                            })
                          ) : null}
                        </div>
                      )}

                      {/* True/False Statements */}
                      {q.format === 'TRUE_FALSE' && q.options && Array.isArray(q.options) && (
                        <div className="space-y-1 pt-1.5">
                          {q.options.map((opt: any, optIdx: number) => {
                            const label = typeof opt === 'string' ? opt : opt.text || '';
                            const prefix = ['a)', 'b)', 'c)', 'd)'][optIdx] || `${optIdx + 1})`;
                            return (
                              <div
                                key={optIdx}
                                className="flex items-start gap-2 p-1.5 rounded bg-stone-50 border border-stone-200"
                              >
                                <span className="font-bold text-[#59080b]">{prefix}</span>
                                <div className="flex-1 font-serif text-[12px]">
                                  <MathRenderer content={label} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* TikZ diagram badge & drawer if question has TikZ */}
                      {q.tikzCode && (
                        <div className="pt-1">
                          <button
                            onClick={() => setExpandedTikz(p => ({ ...p, [q.id]: !p[q.id] }))}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#59080b] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded hover:bg-amber-100 transition"
                          >
                            <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <polygon points="12 2 2 7 12 12 22 7 12 2" />
                              <polyline points="2 17 12 22 22 17" />
                              <polyline points="2 12 12 17 22 12" />
                            </svg>
                            <span>Hình vẽ TikZ / Mạch điện ({showTikz ? 'Đóng' : 'Xem mã TikZ'})</span>
                          </button>
                          {showTikz && (
                            <pre className="mt-1 p-2 bg-stone-900 text-amber-300 rounded text-[10px] font-mono overflow-x-auto max-h-40">
                              {q.tikzCode}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: View Solution */}
                    <div className="border-t border-[#e8ddd6] bg-stone-50/70 p-2 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => setExpandedSolutions(p => ({ ...p, [q.id]: !p[q.id] }))}
                        className="font-bold text-[#59080b] hover:underline flex items-center gap-1"
                      >
                        <span>{showSolution ? '▲ Thu gọn lời giải' : '▼ Xem lời giải chi tiết'}</span>
                      </button>

                      {q.correctAnswer && (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Đáp án: {q.correctAnswer}
                        </span>
                      )}
                    </div>

                    {/* Collapsible Solution Body */}
                    {showSolution && (
                      <div className="p-3 bg-[#fff8eb] border-t border-[#f0a500]/30 text-xs text-stone-800 space-y-1">
                        <div className="font-bold text-[#59080b] flex items-center gap-1">
                          <span>💡 Hướng dẫn giải chi tiết:</span>
                        </div>
                        <div className="font-serif leading-relaxed text-[12px]">
                          <MathRenderer content={q.explanation || 'Chưa có lời giải chi tiết cho câu hỏi này.'} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Pagination */}
          <div className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-[#e8ddd6] text-xs">
            <span className="text-stone-500">
              Hiển thị {questions.length} / {total} câu hỏi
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded border border-[#e8ddd6] hover:bg-stone-50 disabled:opacity-40 font-bold"
              >
                Trước
              </button>
              <span className="px-3 py-1 bg-[#59080b] text-white rounded font-bold">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded border border-[#e8ddd6] hover:bg-stone-50 disabled:opacity-40 font-bold"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
