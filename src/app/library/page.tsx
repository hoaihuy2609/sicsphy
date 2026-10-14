'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface MatrixDistribution {
  multipleChoiceCount?: number;
  trueFalseCount?: number;
  shortAnswerCount?: number;
  examFormat?: string;
  slots?: any[];
  [key: string]: any;
}

interface ExamMatrixItem {
  id: string;
  name: string;
  grade: number;
  totalQuestions: number;
  distribution: MatrixDistribution;
  createdAt: string;
}

interface ExamItem {
  id: string;
  title: string;
  grade: number;
  schoolName?: string | null;
  duration: number;
  questionIds: string[];
  createdAt: string;
}

interface ExamPaperItem {
  id: string;
  title: string;
  grade: number;
  category: string;
  schoolName?: string | null;
  province?: string | null;
  year?: string | null;
  duration: number;
  questionIds: string[];
  totalMC: number;
  totalTF: number;
  totalSA: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface HistoryItem {
  id: string;
  action: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

interface LibraryStats {
  totalQuestions?: number;
  totalMatrices: number;
  totalExams: number;
  totalPapers: number;
  totalExamPapers?: number;
  totalHistory: number;
}

type TabType = 'matrices' | 'exams' | 'papers' | 'history';

export default function LibraryPage() {
  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('matrices');

  // Filters
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [matrices, setMatrices] = useState<ExamMatrixItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [papers, setPapers] = useState<ExamPaperItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<LibraryStats>({
    totalMatrices: 0,
    totalExams: 0,
    totalPapers: 0,
    totalHistory: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [viewItem, setViewItem] = useState<{ type: TabType; data: any } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'matrix' | 'exam' | 'paper' | 'history'; id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Pagination per tab
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Reset page when tab or filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedGrade, searchQuery]);

  // Load all library data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', 'all');
      if (selectedGrade) params.set('grade', selectedGrade.toString());

      const res = await fetch(`/api/library?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        // Extract matrices
        const matrixList = json.matrices?.data || json.data?.matrices || [];
        setMatrices(matrixList);

        // Extract exams
        const examList = json.exams?.data || json.data?.exams || [];
        setExams(examList);

        // Extract papers
        const paperList = json.papers?.data || json.examPapers?.data || json.data?.examPapers || json.data?.papers || [];
        setPapers(paperList);

        // Extract history
        const historyList = json.history?.data || json.data?.history || [];
        setHistory(historyList);

        // Extract stats
        if (json.stats) {
          setStats({
            totalQuestions: json.stats.totalQuestions || 0,
            totalMatrices: json.stats.totalMatrices ?? matrixList.length,
            totalExams: json.stats.totalExams ?? examList.length,
            totalPapers: json.stats.totalPapers ?? json.stats.totalExamPapers ?? paperList.length,
            totalHistory: json.stats.totalHistory ?? historyList.length,
          });
        } else {
          setStats({
            totalMatrices: matrixList.length,
            totalExams: examList.length,
            totalPapers: paperList.length,
            totalHistory: historyList.length,
          });
        }
      } else {
        showToast(json.error || 'Lỗi khi tải dữ liệu thư viện', 'error');
      }
    } catch (err: any) {
      console.error('Lỗi nạp dữ liệu quản lý:', err);
      showToast('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedGrade]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Delete action handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/library?type=${deleteTarget.type}&id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: deleteTarget.type, id: deleteTarget.id }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Đã xóa thành công "${deleteTarget.title}"`, 'success');
        setDeleteTarget(null);
        await fetchData();
      } else {
        showToast(data.error || 'Xóa thất bại. Vui lòng thử lại!', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Có lỗi xảy ra trong quá trình xóa.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper date formatter
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Action badge mapping
  const renderActionBadge = (action: string) => {
    let colorClass = 'bg-stone-100 text-stone-700 border-stone-200';
    let label = action;

    switch (action) {
      case 'create_matrix':
        colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        label = 'Tạo ma trận';
        break;
      case 'delete_matrix':
        colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
        label = 'Xóa ma trận';
        break;
      case 'shuffle_exam':
      case 'create_exam':
        colorClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
        label = 'Tạo / Tráo đề';
        break;
      case 'delete_exam':
        colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
        label = 'Xóa đề thi';
        break;
      case 'create_exam_paper':
        colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
        label = 'Thêm đề trường/sở';
        break;
      case 'delete_paper':
        colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
        label = 'Xóa đề trường/sở';
        break;
      case 'export_word':
        colorClass = 'bg-amber-50 text-amber-900 border-amber-300';
        label = 'Xuất file Word';
        break;
      case 'export_latex':
        colorClass = 'bg-cyan-50 text-cyan-900 border-cyan-300';
        label = 'Xuất LaTeX';
        break;
      case 'import_questions':
        colorClass = 'bg-teal-50 text-teal-800 border-teal-200';
        label = 'Nạp ngân hàng';
        break;
      default:
        if (action.startsWith('delete_')) {
          colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
          label = action.replace('delete_', 'Xóa ');
        }
        break;
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${colorClass}`}>
        {label}
      </span>
    );
  };

  // Grade badge helper
  const renderGradeBadge = (grade: number) => {
    let color = 'bg-[#fff8eb] text-[#59080b] border-[#e8ddd6]';
    if (grade === 12) color = 'bg-[#59080b]/10 text-[#59080b] border-[#59080b]/30';
    if (grade === 11) color = 'bg-[#f0a500]/15 text-[#8c5d00] border-[#f0a500]/40';
    if (grade === 10) color = 'bg-stone-100 text-stone-700 border-stone-200';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${color}`}>
        Lớp {grade}
      </span>
    );
  };

  // Filtered lists based on search
  const filteredMatrices = useMemo(() => {
    if (!searchQuery) return matrices;
    const q = searchQuery.toLowerCase();
    return matrices.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.grade.toString().includes(q)
    );
  }, [matrices, searchQuery]);

  const filteredExams = useMemo(() => {
    if (!searchQuery) return exams;
    const q = searchQuery.toLowerCase();
    return exams.filter(e => 
      e.title.toLowerCase().includes(q) || 
      (e.schoolName && e.schoolName.toLowerCase().includes(q)) ||
      e.grade.toString().includes(q)
    );
  }, [exams, searchQuery]);

  const filteredPapers = useMemo(() => {
    if (!searchQuery) return papers;
    const q = searchQuery.toLowerCase();
    return papers.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.schoolName && p.schoolName.toLowerCase().includes(q)) ||
      (p.province && p.province.toLowerCase().includes(q)) ||
      (p.year && p.year.toLowerCase().includes(q)) ||
      p.grade.toString().includes(q)
    );
  }, [papers, searchQuery]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery) return history;
    const q = searchQuery.toLowerCase();
    return history.filter(h => 
      h.description.toLowerCase().includes(q) || 
      h.action.toLowerCase().includes(q)
    );
  }, [history, searchQuery]);

  // Current tab items & pagination
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'matrices': return filteredMatrices;
      case 'exams': return filteredExams;
      case 'papers': return filteredPapers;
      case 'history': return filteredHistory;
      default: return [];
    }
  };

  const totalCurrentItems = getCurrentItems().length;
  const totalPages = Math.max(1, Math.ceil(totalCurrentItems / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return getCurrentItems().slice(start, start + pageSize);
  }, [activeTab, filteredMatrices, filteredExams, filteredPapers, filteredHistory, page]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto text-[#1a0a0a]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-xs font-bold transition-all transform duration-200 border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-700 text-white border-emerald-800'
              : 'bg-rose-700 text-white border-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-rose-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <div className="bg-white rounded-xl p-4 border border-[#e8ddd6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#59080b] text-[#f0a500] flex items-center justify-center shadow-inner">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-extrabold uppercase text-[#59080b] tracking-wide">
                HỆ THỐNG QUẢN LÝ TẬP TRUNG (MODULE 5)
              </h1>
              <span className="bg-[#fff8eb] text-[#8c5d00] border border-[#f0a500]/30 px-2 py-0.5 rounded text-[10px] font-bold">
                GDPT 2018
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Quản lý danh sách ma trận đề, bộ đề thi đã tạo, đề khảo sát trường/sở và nhật ký biên soạn
            </p>
          </div>
        </div>

        {/* Grade Filter & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grade selection pills */}
          <div className="inline-flex bg-stone-100 p-1 rounded-lg border border-[#e8ddd6] text-xs">
            <button
              onClick={() => setSelectedGrade(null)}
              className={`px-3 py-1 rounded font-bold transition text-xs ${
                selectedGrade === null
                  ? 'bg-[#59080b] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tất cả khối
            </button>
            <button
              onClick={() => setSelectedGrade(10)}
              className={`px-2.5 py-1 rounded font-bold transition text-xs ${
                selectedGrade === 10
                  ? 'bg-[#59080b] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Lớp 10
            </button>
            <button
              onClick={() => setSelectedGrade(11)}
              className={`px-2.5 py-1 rounded font-bold transition text-xs ${
                selectedGrade === 11
                  ? 'bg-[#59080b] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Lớp 11
            </button>
            <button
              onClick={() => setSelectedGrade(12)}
              className={`px-2.5 py-1 rounded font-bold transition text-xs ${
                selectedGrade === 12
                  ? 'bg-[#59080b] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Lớp 12
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8ddd6] bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition shadow-sm active:scale-95 disabled:opacity-50"
            title="Tải lại dữ liệu"
          >
            <svg
              className={`w-3.5 h-3.5 text-[#59080b] ${loading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>LÀM MỚI</span>
          </button>
        </div>
      </div>

      {/* 1. TOP STATS ROW (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Ma trận */}
        <div
          onClick={() => setActiveTab('matrices')}
          className={`cursor-pointer group relative overflow-hidden rounded-xl p-4 transition-all duration-200 transform hover:-translate-y-0.5 border ${
            activeTab === 'matrices'
              ? 'bg-gradient-to-br from-[#59080b] to-[#3a0002] text-white border-[#f0a500] ring-2 ring-[#f0a500]/50 shadow-md'
              : 'bg-gradient-to-br from-[#59080b] to-[#430608] text-white border-[#59080b] shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#f0a500] uppercase tracking-wider block">
                Ma trận đề thi
              </span>
              <h2 className="text-2xl font-black mt-1 text-white group-hover:scale-105 transition-transform origin-left">
                {stats.totalMatrices}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#f0a500] border border-white/15">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-300">
            <span>Cấu trúc chuẩn 2025 & tùy chỉnh</span>
            <span className="font-bold text-[#f0a500] group-hover:underline flex items-center gap-0.5">
              Xem &rarr;
            </span>
          </div>
        </div>

        {/* Card 2: Đề thi đã tạo */}
        <div
          onClick={() => setActiveTab('exams')}
          className={`cursor-pointer group relative overflow-hidden rounded-xl p-4 transition-all duration-200 transform hover:-translate-y-0.5 border ${
            activeTab === 'exams'
              ? 'bg-gradient-to-br from-[#59080b] to-[#3a0002] text-white border-[#f0a500] ring-2 ring-[#f0a500]/50 shadow-md'
              : 'bg-gradient-to-br from-[#59080b] to-[#430608] text-white border-[#59080b] shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#f0a500] uppercase tracking-wider block">
                Đề thi đã tạo
              </span>
              <h2 className="text-2xl font-black mt-1 text-white group-hover:scale-105 transition-transform origin-left">
                {stats.totalExams}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#f0a500] border border-white/15">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-300">
            <span>Đề sinh tự động & xáo trộn câu</span>
            <span className="font-bold text-[#f0a500] group-hover:underline flex items-center gap-0.5">
              Xem &rarr;
            </span>
          </div>
        </div>

        {/* Card 3: Đề trường/sở */}
        <div
          onClick={() => setActiveTab('papers')}
          className={`cursor-pointer group relative overflow-hidden rounded-xl p-4 transition-all duration-200 transform hover:-translate-y-0.5 border ${
            activeTab === 'papers'
              ? 'bg-gradient-to-br from-[#59080b] to-[#3a0002] text-white border-[#f0a500] ring-2 ring-[#f0a500]/50 shadow-md'
              : 'bg-gradient-to-br from-[#59080b] to-[#430608] text-white border-[#59080b] shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#f0a500] uppercase tracking-wider block">
                Đề trường / Sở GD
              </span>
              <h2 className="text-2xl font-black mt-1 text-white group-hover:scale-105 transition-transform origin-left">
                {stats.totalPapers}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#f0a500] border border-white/15">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-300">
            <span>Đề khảo sát & thi thử các tỉnh</span>
            <span className="font-bold text-[#f0a500] group-hover:underline flex items-center gap-0.5">
              Xem &rarr;
            </span>
          </div>
        </div>

        {/* Card 4: Lịch sử làm việc */}
        <div
          onClick={() => setActiveTab('history')}
          className={`cursor-pointer group relative overflow-hidden rounded-xl p-4 transition-all duration-200 transform hover:-translate-y-0.5 border ${
            activeTab === 'history'
              ? 'bg-gradient-to-br from-[#59080b] to-[#3a0002] text-white border-[#f0a500] ring-2 ring-[#f0a500]/50 shadow-md'
              : 'bg-gradient-to-br from-[#59080b] to-[#430608] text-white border-[#59080b] shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#f0a500] uppercase tracking-wider block">
                Nhật ký thao tác
              </span>
              <h2 className="text-2xl font-black mt-1 text-white group-hover:scale-105 transition-transform origin-left">
                {stats.totalHistory}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#f0a500] border border-white/15">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-300">
            <span>Lịch sử hoạt động biên soạn</span>
            <span className="font-bold text-[#f0a500] group-hover:underline flex items-center gap-0.5">
              Xem &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION & SEARCH TOOLBAR */}
      <div className="bg-white rounded-xl border border-[#e8ddd6] p-2.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('matrices')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'matrices'
                ? 'bg-[#59080b] text-white shadow-sm'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <svg className="w-4 h-4 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Ma trận</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'matrices'
                  ? 'bg-[#f0a500] text-stone-900 font-extrabold'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              {filteredMatrices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'exams'
                ? 'bg-[#59080b] text-white shadow-sm'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <svg className="w-4 h-4 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Đề thi</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'exams'
                  ? 'bg-[#f0a500] text-stone-900 font-extrabold'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              {filteredExams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('papers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'papers'
                ? 'bg-[#59080b] text-white shadow-sm'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <svg className="w-4 h-4 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <span>Đề trường/sở</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'papers'
                  ? 'bg-[#f0a500] text-stone-900 font-extrabold'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              {filteredPapers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-[#59080b] text-white shadow-sm'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <svg className="w-4 h-4 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Lịch sử</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'history'
                  ? 'bg-[#f0a500] text-stone-900 font-extrabold'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              {filteredHistory.length}
            </span>
          </button>
        </div>

        {/* Search input inside active tab */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={`Tìm trong ${
                activeTab === 'matrices'
                  ? 'ma trận...'
                  : activeTab === 'exams'
                  ? 'đề thi...'
                  : activeTab === 'papers'
                  ? 'đề trường/sở...'
                  : 'nhật ký...'
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1.5 w-60 sm:w-72 border border-[#e8ddd6] rounded-lg text-xs focus:outline-none focus:border-[#59080b] bg-[#faf8f6] focus:bg-white transition"
            />
            <svg className="w-3.5 h-3.5 text-stone-400 absolute left-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick link button to create corresponding content */}
          {activeTab === 'matrices' && (
            <Link
              href="/matrix"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#59080b] hover:bg-[#430608] text-white text-xs font-bold transition shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tạo ma trận</span>
            </Link>
          )}

          {activeTab === 'exams' && (
            <Link
              href="/principal-exam"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#59080b] hover:bg-[#430608] text-white text-xs font-bold transition shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Soạn đề thi</span>
            </Link>
          )}

          {activeTab === 'papers' && (
            <Link
              href="/question-bank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#59080b] hover:bg-[#430608] text-white text-xs font-bold transition shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Xem ngân hàng</span>
            </Link>
          )}
        </div>
      </div>

      {/* 3. TAB CONTENT TABLES */}
      <div className="bg-white rounded-xl border border-[#e8ddd6] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#59080b] border-t-[#f0a500] rounded-full animate-spin" />
            <p className="text-xs text-stone-500 font-medium">Đang tải dữ liệu từ máy chủ...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: MA TRẬN */}
            {activeTab === 'matrices' && (
              <div className="overflow-x-auto">
                {filteredMatrices.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#fff8eb] text-[#8c5d00] flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-stone-600">
                      Chưa có ma trận đề thi nào trong hệ thống.
                    </p>
                    <Link
                      href="/matrix"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#59080b] hover:bg-[#430608] text-white text-xs font-bold transition shadow-sm"
                    >
                      <span>Tạo Ma Trận Mới Chuẩn 2025</span>
                      <span className="text-[#f0a500]">&rarr;</span>
                    </Link>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#59080b] text-white text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-3">Tên ma trận</th>
                        <th className="py-3 px-3 w-28 text-center">Khối lớp</th>
                        <th className="py-3 px-3 w-28 text-center">Số lượng câu</th>
                        <th className="py-3 px-3">Cấu trúc phân bổ</th>
                        <th className="py-3 px-3 w-36 text-center">Ngày tạo</th>
                        <th className="py-3 px-3 w-28 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8ddd6]">
                      {paginatedItems.map((item: any, idx) => {
                        const dist = item.distribution || {};
                        const mc = dist.multipleChoiceCount ?? (dist.slots ? dist.slots.filter((s: any) => s.format === 'MULTIPLE_CHOICE').length : '-');
                        const tf = dist.trueFalseCount ?? (dist.slots ? dist.slots.filter((s: any) => s.format === 'TRUE_FALSE').length : '-');
                        const sa = dist.shortAnswerCount ?? (dist.slots ? dist.slots.filter((s: any) => s.format === 'SHORT_ANSWER').length : '-');

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-[#fff8eb]/50 transition-colors even:bg-[#faf8f6]"
                          >
                            <td className="py-3 px-3 text-center text-stone-400 font-mono text-[11px]">
                              {(page - 1) * pageSize + idx + 1}
                            </td>
                            <td className="py-3 px-3">
                              <div
                                onClick={() => setViewItem({ type: 'matrices', data: item })}
                                className="font-bold text-[#59080b] hover:text-[#8c0c11] hover:underline cursor-pointer flex items-center gap-1.5"
                              >
                                <span>{item.name}</span>
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                                ID: {item.id}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {renderGradeBadge(item.grade)}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-stone-800">
                              <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px] border border-stone-200">
                                {item.totalQuestions || 22} câu
                              </span>
                            </td>
                            <td className="py-3 px-3 text-stone-600">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                  TN: {mc}
                                </span>
                                <span className="bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                  Đ/S: {tf}
                                </span>
                                <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                  TLN: {sa}
                                </span>
                                {dist.examFormat && (
                                  <span className="text-[10px] text-stone-400">
                                    ({dist.examFormat})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center text-stone-500 text-[11px]">
                              {formatDate(item.createdAt)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setViewItem({ type: 'matrices', data: item })}
                                  className="p-1 rounded text-stone-600 hover:text-[#59080b] hover:bg-stone-100 transition"
                                  title="Xem chi tiết"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDeleteTarget({ type: 'matrix', id: item.id, title: item.name })}
                                  className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Xóa ma trận"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 2: ĐỀ THI */}
            {activeTab === 'exams' && (
              <div className="overflow-x-auto">
                {filteredExams.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#fff8eb] text-[#8c5d00] flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="16 3 21 3 21 8" />
                        <line x1="4" y1="20" x2="21" y2="3" />
                        <polyline points="21 16 21 21 16 21" />
                        <line x1="15" y1="15" x2="21" y2="21" />
                        <line x1="4" y1="4" x2="9" y2="9" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-stone-600">
                      Chưa có đề thi nào được tạo từ tính năng tráo đề.
                    </p>
                    <Link
                      href="/principal-exam"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#59080b] hover:bg-[#430608] text-white text-xs font-bold transition shadow-sm"
                    >
                      <span>Tạo Đề Thi Mới Ngay</span>
                      <span className="text-[#f0a500]">&rarr;</span>
                    </Link>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#59080b] text-white text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-3">Tiêu đề đề thi</th>
                        <th className="py-3 px-3 w-28 text-center">Khối lớp</th>
                        <th className="py-3 px-3">Trường / Đơn vị</th>
                        <th className="py-3 px-3 w-28 text-center">Thời gian</th>
                        <th className="py-3 px-3 w-28 text-center">Số câu hỏi</th>
                        <th className="py-3 px-3 w-36 text-center">Ngày tạo</th>
                        <th className="py-3 px-3 w-28 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8ddd6]">
                      {paginatedItems.map((item: any, idx) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#fff8eb]/50 transition-colors even:bg-[#faf8f6]"
                        >
                          <td className="py-3 px-3 text-center text-stone-400 font-mono text-[11px]">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div
                              onClick={() => setViewItem({ type: 'exams', data: item })}
                              className="font-bold text-[#59080b] hover:text-[#8c0c11] hover:underline cursor-pointer"
                            >
                              {item.title}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                              ID: {item.id}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {renderGradeBadge(item.grade)}
                          </td>
                          <td className="py-3 px-3 text-stone-700">
                            {item.schoolName ? (
                              <span className="inline-flex items-center gap-1 font-medium">
                                <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                                </svg>
                                {item.schoolName}
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">Chung</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px] font-medium border border-stone-200">
                              {item.duration || 50} phút
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-stone-800">
                            <span className="bg-[#fff8eb] text-[#8c5d00] border border-[#f0a500]/40 px-2 py-0.5 rounded text-[11px]">
                              {Array.isArray(item.questionIds) ? item.questionIds.length : 0} câu
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-stone-500 text-[11px]">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setViewItem({ type: 'exams', data: item })}
                                className="p-1 rounded text-stone-600 hover:text-[#59080b] hover:bg-stone-100 transition"
                                title="Xem chi tiết"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'exam', id: item.id, title: item.title })}
                                className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Xóa đề thi"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 3: ĐỀ TRƯỜNG/SỞ */}
            {activeTab === 'papers' && (
              <div className="overflow-x-auto">
                {filteredPapers.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#fff8eb] text-[#8c5d00] flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-stone-600">
                      Chưa có đề trường/sở nào được lưu trong hệ thống.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#59080b] text-white text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-3">Tên đề thi</th>
                        <th className="py-3 px-3 w-28 text-center">Phân loại</th>
                        <th className="py-3 px-3 w-24 text-center">Khối lớp</th>
                        <th className="py-3 px-3">Trường</th>
                        <th className="py-3 px-3 w-28">Tỉnh / TP</th>
                        <th className="py-3 px-3 w-24 text-center">Năm học</th>
                        <th className="py-3 px-3">Cấu trúc</th>
                        <th className="py-3 px-3 w-28 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8ddd6]">
                      {paginatedItems.map((item: any, idx) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#fff8eb]/50 transition-colors even:bg-[#faf8f6]"
                        >
                          <td className="py-3 px-3 text-center text-stone-400 font-mono text-[11px]">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div
                              onClick={() => setViewItem({ type: 'papers', data: item })}
                              className="font-bold text-[#59080b] hover:text-[#8c0c11] hover:underline cursor-pointer"
                            >
                              {item.title}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                              {item.duration || 50} phút • {Array.isArray(item.questionIds) ? item.questionIds.length : 0} câu
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-[#59080b]/10 text-[#59080b] border border-[#59080b]/30 px-2 py-0.5 rounded text-[10px] font-bold">
                              {item.category || 'Trường'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {renderGradeBadge(item.grade)}
                          </td>
                          <td className="py-3 px-3 text-stone-700 font-medium">
                            {item.schoolName || '-'}
                          </td>
                          <td className="py-3 px-3 text-stone-600">
                            {item.province || '-'}
                          </td>
                          <td className="py-3 px-3 text-center text-stone-600 font-mono">
                            {item.year || '-'}
                          </td>
                          <td className="py-3 px-3 text-stone-600">
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.2 rounded font-semibold">
                                TN:{item.totalMC ?? 0}
                              </span>
                              <span className="bg-blue-50 text-blue-900 border border-blue-200 px-1 py-0.2 rounded font-semibold">
                                ĐS:{item.totalTF ?? 0}
                              </span>
                              <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-1 py-0.2 rounded font-semibold">
                                TLN:{item.totalSA ?? 0}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setViewItem({ type: 'papers', data: item })}
                                className="p-1 rounded text-stone-600 hover:text-[#59080b] hover:bg-stone-100 transition"
                                title="Xem chi tiết"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'paper', id: item.id, title: item.title })}
                                className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Xóa đề thi này"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 4: LỊCH SỬ */}
            {activeTab === 'history' && (
              <div className="overflow-x-auto">
                {filteredHistory.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#fff8eb] text-[#8c5d00] flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-stone-600">
                      Chưa có nhật ký hoạt động nào được ghi lại.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#59080b] text-white text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-3 w-40">Loại hành động</th>
                        <th className="py-3 px-3">Mô tả hành động</th>
                        <th className="py-3 px-3 w-48">Chi tiết bổ sung</th>
                        <th className="py-3 px-3 w-40 text-center">Thời gian</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8ddd6]">
                      {paginatedItems.map((item: any, idx) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#fff8eb]/50 transition-colors even:bg-[#faf8f6]"
                        >
                          <td className="py-3 px-3 text-center text-stone-400 font-mono text-[11px]">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            {renderActionBadge(item.action)}
                          </td>
                          <td className="py-3 px-3 font-medium text-stone-800">
                            {item.description}
                          </td>
                          <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">
                            {item.metadata ? (
                              <button
                                onClick={() => setViewItem({ type: 'history', data: item })}
                                className="text-[#59080b] hover:underline flex items-center gap-1 font-sans text-xs"
                              >
                                <span>Xem siêu dữ liệu</span>
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-stone-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center text-stone-500 text-[11px]">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setDeleteTarget({ type: 'history', id: item.id, title: item.description })}
                              className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Xóa bản ghi nhật ký này"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Pagination footer */}
            <div className="bg-[#faf8f6] px-4 py-3 border-t border-[#e8ddd6] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-stone-500 text-[11px]">
                Hiển thị <span className="font-bold text-stone-800">{paginatedItems.length}</span> trên tổng số{' '}
                <span className="font-bold text-stone-800">{totalCurrentItems}</span> mục
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-2.5 py-1 rounded border border-[#e8ddd6] bg-white hover:bg-stone-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed text-[#59080b]"
                  >
                    &laquo; Trước
                  </button>

                  <div className="bg-[#59080b] text-white px-3 py-1 rounded font-bold text-[11px]">
                    Trang {page} / {totalPages}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-2.5 py-1 rounded border border-[#e8ddd6] bg-white hover:bg-stone-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed text-[#59080b]"
                  >
                    Sau &raquo;
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: VIEW DETAIL */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#e8ddd6] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-[#59080b] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#f0a500] text-stone-900 flex items-center justify-center font-bold text-xs">
                  i
                </div>
                <h3 className="font-bold text-xs md:text-sm uppercase tracking-wide">
                  Chi Tiết {viewItem.type === 'matrices' ? 'Ma Trận' : viewItem.type === 'exams' ? 'Đề Thi' : viewItem.type === 'papers' ? 'Đề Trường/Sở' : 'Nhật Ký Thao Tác'}
                </h3>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="text-stone-300 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Type: Matrix */}
              {viewItem.type === 'matrices' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 bg-[#faf8f6] p-3 rounded-lg border border-[#e8ddd6]">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Tên ma trận</span>
                      <span className="font-bold text-sm text-[#59080b]">{viewItem.data.name}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Khối lớp</span>
                      <span className="font-bold text-stone-800">Lớp {viewItem.data.grade}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Tổng số câu</span>
                      <span className="font-bold text-stone-800">{viewItem.data.totalQuestions} câu</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Ngày tạo</span>
                      <span className="font-mono text-stone-600">{formatDate(viewItem.data.createdAt)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-stone-800 uppercase text-[11px] mb-2">
                      Cấu trúc phân bổ câu hỏi
                    </h4>
                    <div className="border border-[#e8ddd6] rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#faf8f6] border-b border-[#e8ddd6] text-stone-600 font-bold text-[11px]">
                          <tr>
                            <th className="py-2 px-3">Phần</th>
                            <th className="py-2 px-3">Dạng câu hỏi</th>
                            <th className="py-2 px-3 text-center">Số câu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8ddd6]">
                          <tr>
                            <td className="py-2 px-3 font-semibold text-[#59080b]">Phần I</td>
                            <td className="py-2 px-3">Trắc nghiệm nhiều lựa chọn (4 phương án A,B,C,D)</td>
                            <td className="py-2 px-3 text-center font-bold">
                              {viewItem.data.distribution?.multipleChoiceCount ?? 18}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-[#59080b]">Phần II</td>
                            <td className="py-2 px-3">Trắc nghiệm Đúng/Sai (4 lệnh hỏi a,b,c,d)</td>
                            <td className="py-2 px-3 text-center font-bold">
                              {viewItem.data.distribution?.trueFalseCount ?? 4}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-[#59080b]">Phần III</td>
                            <td className="py-2 px-3">Trắc nghiệm trả lời ngắn (Điền số)</td>
                            <td className="py-2 px-3 text-center font-bold">
                              {viewItem.data.distribution?.shortAnswerCount ?? 6}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {viewItem.data.distribution?.slots && (
                    <div>
                      <h4 className="font-bold text-stone-800 uppercase text-[11px] mb-1">
                        Danh sách các vị trí câu ({viewItem.data.distribution.slots.length} vị trí)
                      </h4>
                      <div className="max-h-40 overflow-y-auto border border-[#e8ddd6] rounded-lg p-2 bg-[#faf8f6] text-[11px] space-y-1">
                        {viewItem.data.distribution.slots.map((s: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between py-0.5 border-b border-stone-200/60 last:border-0">
                            <span className="font-bold text-[#59080b]">Câu {s.position || idx + 1}:</span>
                            <span className="text-stone-600">{s.format}</span>
                            <span className="bg-stone-200/60 px-1.5 py-0.2 rounded text-[10px]">
                              {s.difficulty ? `Mức độ ${s.difficulty}` : 'Tự do'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Type: Exam */}
              {viewItem.type === 'exams' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 bg-[#faf8f6] p-3 rounded-lg border border-[#e8ddd6]">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Tiêu đề đề thi</span>
                      <span className="font-bold text-sm text-[#59080b]">{viewItem.data.title}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Khối lớp</span>
                      <span className="font-bold text-stone-800">Lớp {viewItem.data.grade}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Thời gian làm bài</span>
                      <span className="font-bold text-stone-800">{viewItem.data.duration || 50} phút</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Trường / Đơn vị</span>
                      <span className="font-bold text-stone-800">{viewItem.data.schoolName || 'Chung'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Số lượng câu hỏi</span>
                      <span className="font-bold text-stone-800">
                        {Array.isArray(viewItem.data.questionIds) ? viewItem.data.questionIds.length : 0} câu
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Ngày tạo</span>
                      <span className="font-mono text-stone-600">{formatDate(viewItem.data.createdAt)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-stone-800 uppercase text-[11px] mb-1">
                      Danh sách ID câu hỏi ({Array.isArray(viewItem.data.questionIds) ? viewItem.data.questionIds.length : 0})
                    </h4>
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-[#faf8f6] border border-[#e8ddd6] rounded-lg">
                      {Array.isArray(viewItem.data.questionIds) && viewItem.data.questionIds.map((qid: string, i: number) => (
                        <span key={i} className="bg-white border border-[#e8ddd6] px-2 py-0.5 rounded font-mono text-[10px] text-stone-700">
                          {i + 1}. {qid}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Type: Papers */}
              {viewItem.type === 'papers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 bg-[#faf8f6] p-3 rounded-lg border border-[#e8ddd6]">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Tên đề thi</span>
                      <span className="font-bold text-sm text-[#59080b]">{viewItem.data.title}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Phân loại</span>
                      <span className="font-bold text-stone-800">{viewItem.data.category}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Trường / Sở GD</span>
                      <span className="font-bold text-stone-800">{viewItem.data.schoolName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Tỉnh / Thành phố</span>
                      <span className="font-bold text-stone-800">{viewItem.data.province || '-'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Năm học</span>
                      <span className="font-mono text-stone-800">{viewItem.data.year || '-'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Thời lượng</span>
                      <span className="font-bold text-stone-800">{viewItem.data.duration || 50} phút</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#fff8eb] border border-[#f0a500]/30 rounded-lg flex items-center justify-around text-center">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Trắc nghiệm</span>
                      <span className="text-base font-extrabold text-[#59080b]">{viewItem.data.totalMC || 0}</span>
                    </div>
                    <div className="border-r border-[#e8ddd6] h-8" />
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Đúng / Sai</span>
                      <span className="text-base font-extrabold text-[#59080b]">{viewItem.data.totalTF || 0}</span>
                    </div>
                    <div className="border-r border-[#e8ddd6] h-8" />
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Trả lời ngắn</span>
                      <span className="text-base font-extrabold text-[#59080b]">{viewItem.data.totalSA || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Type: History */}
              {viewItem.type === 'history' && (
                <div className="space-y-4">
                  <div className="bg-[#faf8f6] p-3 rounded-lg border border-[#e8ddd6] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 text-[10px] uppercase font-bold">Hành động</span>
                      {renderActionBadge(viewItem.data.action)}
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Mô tả</span>
                      <span className="font-bold text-stone-800">{viewItem.data.description}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Thời gian ghi nhận</span>
                      <span className="font-mono text-stone-600">{formatDate(viewItem.data.createdAt)}</span>
                    </div>
                  </div>

                  {viewItem.data.metadata && (
                    <div>
                      <h4 className="font-bold text-stone-800 uppercase text-[11px] mb-1">
                        Siêu dữ liệu JSON (Metadata)
                      </h4>
                      <pre className="p-3 bg-stone-900 text-stone-200 rounded-lg text-[11px] font-mono overflow-x-auto max-h-60">
                        {JSON.stringify(viewItem.data.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#faf8f6] px-4 py-3 border-t border-[#e8ddd6] flex items-center justify-end gap-2">
              <button
                onClick={() => setViewItem(null)}
                className="px-4 py-1.5 rounded-lg border border-[#e8ddd6] bg-white hover:bg-stone-50 font-bold text-stone-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#e8ddd6] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-rose-800 text-white px-4 py-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3 className="font-bold text-sm uppercase">Xác nhận xóa vĩnh viễn</h3>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-stone-700">
                Bạn có chắc chắn muốn xóa mục này khỏi cơ sở dữ liệu?
              </p>

              <div className="p-3 bg-[#faf8f6] border border-[#e8ddd6] rounded-lg">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Đối tượng xóa</span>
                <span className="font-bold text-sm text-[#59080b] block mt-0.5">{deleteTarget.title}</span>
                <span className="text-[10px] font-mono text-stone-400 mt-1 block">ID: {deleteTarget.id}</span>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
                <span className="text-amber-600 font-bold">&bull;</span>
                <span>Hành động này không thể hoàn tác. Bản ghi sẽ bị gỡ bỏ hoàn toàn khỏi hệ thống.</span>
              </div>
            </div>

            <div className="bg-[#faf8f6] px-4 py-3 border-t border-[#e8ddd6] flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg border border-[#e8ddd6] bg-white hover:bg-stone-50 font-bold text-stone-700 transition disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold transition shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
