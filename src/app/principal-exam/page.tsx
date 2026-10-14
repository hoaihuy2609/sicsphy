'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MathRenderer from '@/components/MathRenderer';

interface ExamPaper {
  id: string;
  title: string;
  grade: number;
  category: string;
  schoolName: string | null;
  province: string | null;
  year: string | null;
  duration: number;
  questionIds: string[];
  totalMC: number;
  totalTF: number;
  totalSA: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ExamPaperDetail extends ExamPaper {
  questions?: Array<{
    id: string;
    code: string;
    content: string;
    format: string;
    difficulty: number;
    options?: any;
    correctAnswer?: string;
    explanation?: string;
    topic?: {
      name: string;
      chapter?: { name: string };
    };
  }>;
}

interface CategoryCount {
  category: string;
  count: number;
}

const CATEGORIES = ['Tất cả', 'Trường', 'Sở', 'Đề Vip', 'Đề HSG'];
const GRADES = [
  { label: 'Tất cả khối', value: 0 },
  { label: 'Lớp 10', value: 10 },
  { label: 'Lớp 11', value: 11 },
  { label: 'Lớp 12', value: 12 },
];

export default function PrincipalExamPage() {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Data states
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Detail Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailPaper, setDetailPaper] = useState<ExamPaperDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete Confirmation Modal states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletePaperTitle, setDeletePaperTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    grade: 12,
    category: 'Trường',
    schoolName: '',
    province: '',
    year: '2024-2025',
    duration: 50,
    totalMC: 18,
    totalTF: 4,
    totalSA: 6,
    questionIdsText: '',
    tagsText: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch papers from API
  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGrade && selectedGrade > 0) {
        params.set('grade', selectedGrade.toString());
      }
      if (selectedCategory && selectedCategory !== 'Tất cả') {
        params.set('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const res = await fetch(`/api/exam-papers?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setPapers(json.data || []);
        setTotal(json.pagination?.total || 0);
        setTotalPages(json.pagination?.totalPages || 1);
        if (json.categories) {
          setCategoryCounts(json.categories);
        }
      } else {
        showToast(json.error || 'Không thể tải danh sách đề thi', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối khi tải danh sách đề thi: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, selectedCategory, searchQuery, page, limit]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  // Overall Statistics from loaded papers & categories
  const stats = useMemo(() => {
    const totalAll = total;
    const catMap: Record<string, number> = {};
    categoryCounts.forEach((c) => {
      catMap[c.category] = c.count;
    });

    return {
      total: totalAll,
      truong: catMap['Trường'] || 0,
      so: catMap['Sở'] || 0,
      vip: catMap['Đề Vip'] || 0,
      hsg: catMap['Đề HSG'] || 0,
    };
  }, [total, categoryCounts]);

  // Reset and open Add Form
  const handleOpenAdd = () => {
    setFormMode('create');
    setEditingId(null);
    setFormError('');
    setFormData({
      title: '',
      grade: selectedGrade > 0 ? selectedGrade : 12,
      category: selectedCategory !== 'Tất cả' ? selectedCategory : 'Trường',
      schoolName: '',
      province: '',
      year: '2024-2025',
      duration: 50,
      totalMC: 18,
      totalTF: 4,
      totalSA: 6,
      questionIdsText: '',
      tagsText: '',
    });
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (paper: ExamPaper) => {
    setFormMode('edit');
    setEditingId(paper.id);
    setFormError('');
    setFormData({
      title: paper.title || '',
      grade: paper.grade || 12,
      category: paper.category || 'Trường',
      schoolName: paper.schoolName || '',
      province: paper.province || '',
      year: paper.year || '2024-2025',
      duration: paper.duration || 50,
      totalMC: paper.totalMC ?? 18,
      totalTF: paper.totalTF ?? 4,
      totalSA: paper.totalSA ?? 6,
      questionIdsText: Array.isArray(paper.questionIds) ? paper.questionIds.join(', ') : '',
      tagsText: Array.isArray(paper.tags) ? paper.tags.join(', ') : '',
    });
    setIsFormOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tên đề thi');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    // Parse questionIds
    let parsedQuestionIds: string[] = [];
    if (formData.questionIdsText.trim()) {
      try {
        const jsonParsed = JSON.parse(formData.questionIdsText.trim());
        if (Array.isArray(jsonParsed)) {
          parsedQuestionIds = jsonParsed.map((item) => String(item).trim()).filter(Boolean);
        } else {
          parsedQuestionIds = formData.questionIdsText
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        }
      } catch {
        parsedQuestionIds = formData.questionIdsText
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Parse tags
    const parsedTags = formData.tagsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      id: editingId,
      title: formData.title.trim(),
      grade: Number(formData.grade),
      category: formData.category,
      schoolName: formData.schoolName.trim() || null,
      province: formData.province.trim() || null,
      year: formData.year.trim() || null,
      duration: Number(formData.duration) || 50,
      questionIds: parsedQuestionIds,
      totalMC: Number(formData.totalMC) || 0,
      totalTF: Number(formData.totalTF) || 0,
      totalSA: Number(formData.totalSA) || 0,
      tags: parsedTags,
    };

    try {
      const url = '/api/exam-papers';
      const method = formMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          formMode === 'create' ? 'Đã tạo đề thi mới thành công!' : 'Đã cập nhật đề thi thành công!',
          'success'
        );
        setIsFormOpen(false);
        fetchPapers();
      } else {
        setFormError(json.error || 'Có lỗi xảy ra khi lưu đề thi');
      }
    } catch (err: any) {
      setFormError('Lỗi kết nối: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Detail View
  const handleOpenDetail = async (paper: ExamPaper) => {
    setDetailPaper(paper);
    setIsDetailOpen(true);
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/exam-papers?id=${paper.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDetailPaper(json.data);
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết đề thi:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Confirm Delete
  const handleRequestDelete = (paper: ExamPaper) => {
    setDeleteConfirmId(paper.id);
    setDeletePaperTitle(paper.title);
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/exam-papers?id=${deleteConfirmId}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.success) {
        showToast(`Đã xóa đề thi "${deletePaperTitle}" thành công!`, 'success');
        setDeleteConfirmId(null);
        fetchPapers();
      } else {
        showToast(json.error || 'Không thể xóa đề thi', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper badge styles for categories
  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Sở':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Đề Vip':
        return 'bg-[#fff8eb] text-[#b37400] border-[#f0a500]/40 font-bold';
      case 'Đề HSG':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
      case 'Trường':
      default:
        return 'bg-rose-50 text-[#59080b] border-rose-200 font-semibold';
    }
  };

  // Helper badge for format breakdown
  const totalQuestions = (p: ExamPaper) => {
    const sum = (p.totalMC || 0) + (p.totalTF || 0) + (p.totalSA || 0);
    if (sum > 0) return sum;
    return p.questionIds?.length || 0;
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-[#1a0a0a]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-[#fff8eb] text-[#59080b] border-[#f0a500]'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <svg className="w-4 h-4 text-[#f0a500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner / Breadcrumb Bar */}
      <div className="bg-[#59080b] text-white rounded-lg p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#f0a500] text-[#59080b] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
              Module 3
            </span>
            <h1 className="text-sm md:text-base font-bold tracking-wide">
              KHO ĐỀ THI TRƯỜNG & SỞ GIÁO DỤC
            </h1>
          </div>
          <p className="text-[11px] text-[#f0e8e2] mt-0.5">
            Quản lý các bộ đề thi học kỳ, khảo sát chất lượng, thi thử tốt nghiệp THPT chuẩn cấu trúc Bộ GD&ĐT 2025
          </p>
        </div>

        {/* Quick KPI stats in header */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="bg-black/20 border border-white/10 rounded px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-[11px] text-white/80">Tổng đề:</span>
            <span className="font-extrabold text-[#f0a500] text-sm">{stats.total}</span>
          </div>
          <div className="bg-black/20 border border-white/10 rounded px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-[11px] text-white/80">Trường:</span>
            <span className="font-bold text-white">{stats.truong}</span>
          </div>
          <div className="bg-black/20 border border-white/10 rounded px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-[11px] text-white/80">Sở:</span>
            <span className="font-bold text-white">{stats.so}</span>
          </div>
          <div className="bg-black/20 border border-white/10 rounded px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-[11px] text-white/80">VIP / HSG:</span>
            <span className="font-bold text-[#f0a500]">{stats.vip + stats.hsg}</span>
          </div>
        </div>
      </div>

      {/* 1. TOP TOOLBAR matching MathTIAD specs */}
      <div className="bg-white rounded-lg p-3 border border-[#e8ddd6] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Left section: Search & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex items-center flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              placeholder="Tìm theo tên đề, trường, tỉnh thành..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-7 py-1.5 w-full border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b] bg-white transition"
            />
            <svg
              className="w-3.5 h-3.5 text-stone-400 absolute left-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-2 text-stone-400 hover:text-stone-600"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-medium hidden sm:inline text-[11px]">Phân loại:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-2.5 border border-[#e8ddd6] rounded text-xs bg-white focus:outline-none focus:border-[#59080b] font-medium text-stone-800"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div className="flex items-center gap-1 bg-[#faf8f6] p-0.5 border border-[#e8ddd6] rounded">
            {GRADES.map((g) => (
              <button
                key={g.value}
                onClick={() => {
                  setSelectedGrade(g.value);
                  setPage(1);
                }}
                className={`px-2 py-1 rounded text-xs font-semibold transition ${
                  selectedGrade === g.value
                    ? 'bg-[#59080b] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#59080b] hover:bg-stone-200/50'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Reset Filters button */}
          {(searchQuery || selectedCategory !== 'Tất cả' || selectedGrade !== 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Tất cả');
                setSelectedGrade(0);
                setPage(1);
              }}
              className="px-2 py-1 text-stone-500 hover:text-[#59080b] text-[11px] font-semibold flex items-center gap-1 hover:underline"
              title="Đặt lại bộ lọc"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Bỏ lọc</span>
            </button>
          )}
        </div>

        {/* Right section: Pagination & Add Button */}
        <div className="flex items-center justify-between md:justify-end gap-2">
          {/* Pagination badge */}
          <div className="flex items-center gap-1 bg-[#59080b] text-white px-2.5 py-1.5 rounded font-bold text-xs shadow-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="disabled:opacity-30 hover:text-[#f0a500] px-1 font-mono transition"
              title="Trang trước"
            >
              &lt;
            </button>
            <span className="mx-1 text-[11px]">
              Trang {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="disabled:opacity-30 hover:text-[#f0a500] px-1 font-mono transition"
              title="Trang sau"
            >
              &gt;
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchPapers()}
            className="p-1.5 border border-[#e8ddd6] rounded text-stone-600 hover:text-[#59080b] hover:bg-stone-50 transition"
            title="Làm mới danh sách"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin text-[#59080b]' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>

          {/* 'Thêm đề mới' Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#59080b] hover:bg-[#6e0b10] text-[#fff8eb] font-bold text-xs transition shadow-sm border border-[#3a0002]"
          >
            <svg className="w-3.5 h-3.5 text-[#f0a500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>THÊM ĐỀ MỚI</span>
          </button>
        </div>
      </div>

      {/* 2. CARDS GRID showing exam papers */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg p-4 border border-[#e8ddd6] shadow-sm animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-20 bg-stone-200 rounded" />
                <div className="h-5 w-14 bg-stone-200 rounded" />
              </div>
              <div className="h-4 bg-stone-200 rounded w-3/4" />
              <div className="h-3 bg-stone-200 rounded w-1/2" />
              <div className="h-10 bg-stone-100 rounded" />
              <div className="h-8 bg-stone-100 rounded flex justify-end gap-2" />
            </div>
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-lg p-10 border border-[#e8ddd6] text-center shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#fff8eb] border border-[#f0a500]/30 flex items-center justify-center text-[#59080b]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-stone-800">Không tìm thấy đề thi phù hợp</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Chưa có đề thi nào trong danh mục hoặc từ khóa đã chọn. Bạn có thể thêm đề thi mới ngay bây giờ.
          </p>
          <div>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#59080b] hover:bg-[#6e0b10] text-white font-bold text-xs transition"
            >
              <svg className="w-4 h-4 text-[#f0a500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tạo đề thi đầu tiên</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper) => {
            const sumQuestions = totalQuestions(paper);
            return (
              <div
                key={paper.id}
                className="bg-white rounded-lg border border-[#e8ddd6] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header & Badges */}
                <div className="p-3.5 space-y-2.5 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Category Badge */}
                      <span
                        className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                          paper.category
                        )}`}
                      >
                        {paper.category || 'Trường'}
                      </span>

                      {/* Grade Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#59080b] text-white">
                        Lớp {paper.grade}
                      </span>

                      {/* Year Badge */}
                      {paper.year && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                          {paper.year}
                        </span>
                      )}
                    </div>

                    {/* Duration badge */}
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-500" title="Thời gian làm bài">
                      <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        <polyline points="12 6 12 12 16 14" strokeWidth={2} />
                      </svg>
                      <span>{paper.duration || 50}&apos;</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2
                    onClick={() => handleOpenDetail(paper)}
                    className="text-sm font-bold text-stone-900 group-hover:text-[#59080b] transition cursor-pointer line-clamp-2 leading-snug"
                    title={paper.title}
                  >
                    {paper.title}
                  </h2>

                  {/* School & Province info */}
                  <div className="space-y-1 text-xs text-stone-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <svg
                        className="w-3.5 h-3.5 text-stone-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium text-stone-800 truncate">
                        {paper.schoolName || 'Chưa cập nhật trường'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <div className="flex items-center gap-1.5 truncate">
                        <svg
                          className="w-3.5 h-3.5 text-stone-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{paper.province || 'Toàn quốc'}</span>
                      </div>

                      {/* Created date */}
                      <span className="text-[10px] text-stone-400">
                        {formatDate(paper.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Question Count & Formats */}
                  <div className="pt-2 border-t border-[#f0e8e2] bg-[#faf8f6] -mx-3.5 px-3.5 pb-1 rounded-b">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-stone-500 font-medium text-[11px]">Cấu trúc đề thi:</span>
                      <span className="font-extrabold text-[#59080b] bg-[#fff8eb] px-1.5 py-0.2 rounded border border-[#f0a500]/30 text-[11px]">
                        {sumQuestions} câu
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-semibold">
                      <div className="bg-white border border-[#e8ddd6] rounded py-1 px-1 text-stone-700">
                        <span className="text-stone-400 block text-[9px] font-normal">Trắc nghiệm</span>
                        <span className="font-bold text-[#59080b]">{paper.totalMC ?? 0}</span> câu
                      </div>
                      <div className="bg-white border border-[#e8ddd6] rounded py-1 px-1 text-stone-700">
                        <span className="text-stone-400 block text-[9px] font-normal">Đúng / Sai</span>
                        <span className="font-bold text-blue-700">{paper.totalTF ?? 0}</span> câu
                      </div>
                      <div className="bg-white border border-[#e8ddd6] rounded py-1 px-1 text-stone-700">
                        <span className="text-stone-400 block text-[9px] font-normal">Điền số</span>
                        <span className="font-bold text-amber-600">{paper.totalSA ?? 0}</span> câu
                      </div>
                    </div>

                    {/* Tags row */}
                    {paper.tags && paper.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {paper.tags.slice(0, 3).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-stone-200/60 text-stone-600"
                          >
                            #{tag}
                          </span>
                        ))}
                        {paper.tags.length > 3 && (
                          <span className="text-[9px] text-stone-400">+{paper.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="bg-stone-50 border-t border-[#e8ddd6] px-3 py-2 flex items-center justify-between text-xs">
                  {/* View Button */}
                  <button
                    onClick={() => handleOpenDetail(paper)}
                    className="flex items-center gap-1 font-bold text-[#59080b] hover:text-[#6e0b10] hover:bg-rose-50 px-2 py-1 rounded transition text-[11px]"
                  >
                    <svg className="w-3.5 h-3.5 text-[#59080b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Xem chi tiết</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEdit(paper)}
                      className="p-1 rounded text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition"
                      title="Chỉnh sửa đề thi"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleRequestDelete(paper)}
                      className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                      title="Xóa đề thi"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. ADD / EDIT MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-lg border border-[#e8ddd6] shadow-xl w-full max-w-2xl my-6 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#59080b] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#f0a500] text-[#59080b] flex items-center justify-center font-bold text-xs">
                  {formMode === 'create' ? '+' : '✎'}
                </div>
                <h3 className="text-sm font-bold tracking-wide">
                  {formMode === 'create' ? 'THÊM ĐỀ THI MỚI (TRƯỜNG / SỞ)' : 'CHỈNH SỬA THÔNG TIN ĐỀ THI'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-stone-300 hover:text-white transition p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Tên đề thi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đề khảo sát chất lượng HK1 môn Vật lý 12 năm 2024 - 2025"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
                />
              </div>

              {/* Row: Grade, Category, Duration, Year */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Khối lớp <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-[#e8ddd6] rounded text-xs bg-white focus:outline-none focus:border-[#59080b]"
                  >
                    <option value={10}>Lớp 10</option>
                    <option value={11}>Lớp 11</option>
                    <option value={12}>Lớp 12</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Phân loại <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#e8ddd6] rounded text-xs bg-white focus:outline-none focus:border-[#59080b]"
                  >
                    <option value="Trường">Trường</option>
                    <option value="Sở">Sở</option>
                    <option value="Đề Vip">Đề Vip</option>
                    <option value="Đề HSG">Đề HSG</option>
                    <option value="Đề vào 10">Đề vào 10</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    placeholder="2024-2025"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
                  />
                </div>
              </div>

              {/* Row: School Name & Province */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tên Trường / Đơn vị tổ chức</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: THPT Chuyên KHTN, THPT Chu Văn An..."
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hà Nội, TP.HCM, Nghệ An..."
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
                  />
                </div>
              </div>

              {/* Breakdown count fields: totalMC, totalTF, totalSA */}
              <div className="p-3 bg-[#faf8f6] rounded border border-[#e8ddd6] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 text-xs">Cấu trúc số lượng câu hỏi</span>
                  <span className="text-[11px] font-bold text-[#59080b]">
                    Tổng cộng: {Number(formData.totalMC || 0) + Number(formData.totalTF || 0) + Number(formData.totalSA || 0)} câu
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-stone-600 text-[11px] mb-1">
                      Phần I - Trắc nghiệm (4 LC)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.totalMC}
                      onChange={(e) => setFormData({ ...formData, totalMC: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-[#e8ddd6] rounded text-xs font-bold text-stone-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-[11px] mb-1">
                      Phần II - Đúng / Sai (4 ý)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.totalTF}
                      onChange={(e) => setFormData({ ...formData, totalTF: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-[#e8ddd6] rounded text-xs font-bold text-blue-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-[11px] mb-1">
                      Phần III - Trả lời ngắn
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.totalSA}
                      onChange={(e) => setFormData({ ...formData, totalSA: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-[#e8ddd6] rounded text-xs font-bold text-amber-800 bg-white"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-stone-500 italic">
                  * Khuyến nghị chuẩn cấu trúc đề Bộ GD&ĐT 2025: 18 câu Trắc nghiệm + 4 câu Đúng/Sai + 6 câu Trả lời ngắn = 28 câu.
                </p>
              </div>

              {/* Question IDs field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-800">
                    Danh sách ID câu hỏi (questionIds)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const sampleIds = Array.from({ length: 28 }, (_, i) => `q_phy12_${i + 1}`);
                      setFormData({ ...formData, questionIdsText: sampleIds.join(', ') });
                    }}
                    className="text-[10px] text-[#59080b] hover:underline font-semibold"
                  >
                    + Nạp 28 ID mẫu
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder='Nhập danh sách ID câu hỏi cách nhau bởi dấu phẩy hoặc mảng JSON: ["id1", "id2", ...]'
                  value={formData.questionIdsText}
                  onChange={(e) => setFormData({ ...formData, questionIdsText: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b] font-mono"
                />
                <span className="text-[10px] text-stone-400">
                  Hệ thống hỗ trợ dạng JSON mảng hoặc danh sách chuỗi ID phân cách bởi dấu phẩy / xuống dòng.
                </span>
              </div>

              {/* Tags */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Thẻ phân loại / Tags</label>
                <input
                  type="text"
                  placeholder="Ví dụ: HK1, Chuyên đề Dao động, Đề chuẩn 2025, Khảo sát..."
                  value={formData.tagsText}
                  onChange={(e) => setFormData({ ...formData, tagsText: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
                />
                <span className="text-[10px] text-stone-400">Các thẻ cách nhau bởi dấu phẩy</span>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-[#e8ddd6] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-[#e8ddd6] rounded font-semibold text-stone-700 hover:bg-stone-100 transition"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded bg-[#59080b] hover:bg-[#6e0b10] text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  {formSubmitting && (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth={3} strokeDasharray="30 60" />
                    </svg>
                  )}
                  <span>{formMode === 'create' ? 'TẠO ĐỀ THI' : 'LƯU THAY ĐỔI'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DETAIL VIEW MODAL */}
      {isDetailOpen && detailPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-lg border border-[#e8ddd6] shadow-xl w-full max-w-4xl my-6 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-[#59080b] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="bg-[#f0a500] text-[#59080b] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                  {detailPaper.category || 'Đề thi'}
                </span>
                <span className="text-xs font-bold text-white/90">
                  LỚP {detailPaper.grade} • {detailPaper.duration || 50} PHÚT
                </span>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-white/80 hover:text-white transition p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Paper Title & School details */}
              <div className="border-b border-[#e8ddd6] pb-3">
                <h2 className="text-base font-bold text-stone-900 leading-snug">
                  {detailPaper.title}
                </h2>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-stone-600 text-xs">
                  <div>
                    <span className="text-stone-400">Đơn vị / Trường: </span>
                    <span className="font-semibold text-stone-800">{detailPaper.schoolName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400">Tỉnh / Thành phố: </span>
                    <span className="font-semibold text-stone-800">{detailPaper.province || '—'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400">Năm học: </span>
                    <span className="font-semibold text-stone-800">{detailPaper.year || '—'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400">Ngày tạo: </span>
                    <span className="font-semibold text-stone-800">{formatDate(detailPaper.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Statistics Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#faf8f6] p-3 rounded-lg border border-[#e8ddd6] text-center">
                  <span className="text-stone-500 block text-[11px]">Tổng số câu</span>
                  <span className="text-lg font-extrabold text-[#59080b]">
                    {totalQuestions(detailPaper)}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#e8ddd6] text-center">
                  <span className="text-stone-500 block text-[11px]">Phần I: Trắc nghiệm</span>
                  <span className="text-lg font-bold text-stone-800">
                    {detailPaper.totalMC || 0}
                  </span>
                  <span className="text-[10px] text-stone-400 block">4 phương án</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#e8ddd6] text-center">
                  <span className="text-stone-500 block text-[11px]">Phần II: Đúng / Sai</span>
                  <span className="text-lg font-bold text-blue-700">
                    {detailPaper.totalTF || 0}
                  </span>
                  <span className="text-[10px] text-stone-400 block">Mỗi câu 4 ý</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#e8ddd6] text-center">
                  <span className="text-stone-500 block text-[11px]">Phần III: Điền số</span>
                  <span className="text-lg font-bold text-amber-600">
                    {detailPaper.totalSA || 0}
                  </span>
                  <span className="text-[10px] text-stone-400 block">Trả lời ngắn</span>
                </div>
              </div>

              {/* Tags */}
              {detailPaper.tags && detailPaper.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-stone-500 font-semibold text-[11px]">Thẻ phân loại:</span>
                  {detailPaper.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-[#fff8eb] text-[#59080b] border border-[#f0a500]/40 text-[10px] font-semibold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Questions list Preview */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#59080b]" />
                    <span>Nội dung câu hỏi trong đề ({detailPaper.questionIds?.length || 0} câu)</span>
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(detailPaper.questionIds, null, 2));
                      showToast('Đã sao chép danh sách ID câu hỏi!', 'success');
                    }}
                    className="text-[11px] text-[#59080b] hover:underline font-semibold flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth={2} />
                    </svg>
                    <span>Sao chép ID</span>
                  </button>
                </div>

                {detailLoading ? (
                  <div className="py-8 text-center text-stone-500 space-y-2">
                    <div className="w-6 h-6 border-2 border-[#59080b] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs">Đang tải danh sách câu hỏi...</p>
                  </div>
                ) : detailPaper.questions && detailPaper.questions.length > 0 ? (
                  <div className="space-y-3">
                    {detailPaper.questions.map((q, qIndex) => (
                      <div
                        key={q.id || qIndex}
                        className="bg-white border border-[#e8ddd6] rounded-lg p-3 space-y-2 shadow-2xs hover:border-[#59080b]/40 transition"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#59080b] bg-[#fff8eb] px-1.5 py-0.5 rounded border border-[#f0a500]/30">
                              Câu {qIndex + 1} ({q.code})
                            </span>
                            <span className="text-stone-500 font-medium">
                              {q.format === 'MULTIPLE_CHOICE'
                                ? 'Trắc nghiệm'
                                : q.format === 'TRUE_FALSE'
                                ? 'Đúng/Sai'
                                : 'Trả lời ngắn'}
                            </span>
                          </div>
                          {q.topic && (
                            <span className="text-stone-400 text-[10px]">
                              {q.topic.chapter?.name ? `${q.topic.chapter.name} • ` : ''}
                              {q.topic.name}
                            </span>
                          )}
                        </div>

                        {/* Question Content */}
                        <div className="text-xs text-stone-800 leading-relaxed font-normal">
                          <MathRenderer content={q.content} />
                        </div>

                        {/* Options if available */}
                        {q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
                            {(() => {
                              try {
                                const parsedOpt = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                                if (Array.isArray(parsedOpt)) {
                                  return parsedOpt.map((opt: any, oIdx: number) => {
                                    const label = String.fromCharCode(65 + oIdx);
                                    const isCorrect = q.correctAnswer === label || q.correctAnswer === opt;
                                    return (
                                      <div
                                        key={oIdx}
                                        className={`p-1.5 rounded border flex items-baseline gap-1.5 ${
                                          isCorrect
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                            : 'bg-stone-50 border-stone-200 text-stone-700'
                                        }`}
                                      >
                                        <span className="font-bold">{label}.</span>
                                        <MathRenderer content={typeof opt === 'string' ? opt : opt?.text || ''} />
                                      </div>
                                    );
                                  });
                                }
                              } catch {
                                return null;
                              }
                            })()}
                          </div>
                        )}

                        {/* Correct Answer & Explanation */}
                        {q.correctAnswer && (
                          <div className="bg-stone-50 p-2 rounded text-[11px] text-stone-700 border-l-2 border-[#59080b]">
                            <span className="font-bold text-[#59080b]">Đáp án: </span>
                            <span className="font-mono font-bold">{q.correctAnswer}</span>
                            {q.explanation && (
                              <div className="mt-1 text-stone-600">
                                <span className="font-semibold text-stone-700">Lời giải: </span>
                                <MathRenderer content={q.explanation} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#faf8f6] rounded border border-[#e8ddd6] space-y-2">
                    <p className="text-stone-600 text-xs">
                      Đề thi này hiện lưu danh sách <strong>{detailPaper.questionIds?.length || 0} ID câu hỏi</strong>.
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded border border-[#e8ddd6]">
                      {detailPaper.questionIds && detailPaper.questionIds.length > 0 ? (
                        detailPaper.questionIds.map((id, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200"
                          >
                            {id}
                          </span>
                        ))
                      ) : (
                        <span className="text-stone-400 text-xs italic">Chưa có ID câu hỏi nào</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detail Footer */}
            <div className="bg-stone-50 border-t border-[#e8ddd6] px-5 py-3 flex items-center justify-between">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e8ddd6] bg-white rounded font-bold text-stone-700 hover:bg-stone-100 transition text-xs"
              >
                <svg className="w-4 h-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>IN ĐỀ THI</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenEdit(detailPaper);
                  }}
                  className="px-4 py-1.5 border border-[#59080b] text-[#59080b] hover:bg-rose-50 rounded font-bold transition text-xs"
                >
                  SỬA ĐỀ NÀY
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-4 py-1.5 bg-[#59080b] text-white rounded font-bold hover:bg-[#6e0b10] transition text-xs"
                >
                  ĐÓNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-[#e8ddd6] shadow-xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Xác nhận xóa đề thi</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Bạn có chắc chắn muốn xóa đề thi này không? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#faf8f6] rounded border border-[#e8ddd6] text-xs font-semibold text-stone-800">
              &ldquo;{deletePaperTitle}&rdquo;
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-[#e8ddd6] rounded font-semibold text-stone-700 hover:bg-stone-100 transition text-xs"
              >
                HỦY
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting && (
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth={3} strokeDasharray="30 60" />
                  </svg>
                )}
                <span>XÁC NHẬN XÓA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
