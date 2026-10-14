'use client';

import React, { useState, useEffect, useMemo } from 'react';
import MathRenderer from '@/components/MathRenderer';
import {
  FileText,
  FileDown,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Layers,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  ListFilter,
  Eye,
  Settings,
} from 'lucide-react';

interface QuestionItem {
  id: string;
  code: string;
  grade: number;
  format: string;
  difficulty: number;
  content: string;
  options?: any;
  correctAnswer?: any;
  explanation?: string;
  topic?: {
    id: string;
    name: string;
    chapter?: {
      name: string;
    };
  };
}

interface SavedMatrix {
  id: string;
  name: string;
  grade: number;
  totalQuestions: number;
  createdAt: string;
  distribution?: {
    examFormat?: string;
    multipleChoiceCount?: number;
    trueFalseCount?: number;
    shortAnswerCount?: number;
    slots?: Array<{
      position: number;
      format: string;
      difficulty: number | null;
      topicName?: string | null;
      questionId?: string | null;
      questionCode?: string | null;
    }>;
  };
}

interface WorkHistoryItem {
  id: string;
  action: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export default function WordEditorPage() {
  // Form State
  const [examTitle, setExamTitle] = useState('ĐỀ KIỂM TRA ĐỊNH KỲ VẬT LÝ 12 — CHUẨN BGD 2025');
  const [schoolName, setSchoolName] = useState('TRƯỜNG THPT CHUYÊN KHOA HỌC TỰ NHIÊN');
  const [department, setDepartment] = useState('SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI');
  const [grade, setGrade] = useState<number>(12);
  const [duration, setDuration] = useState<number>(50);
  const [mixCount, setMixCount] = useState<number>(4);
  const [questionInput, setQuestionInput] = useState<string>('');
  const [note, setNote] = useState('Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.');

  // Questions Preview State
  const [previewQuestions, setPreviewQuestions] = useState<QuestionItem[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Matrix Modal State
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [matrices, setMatrices] = useState<SavedMatrix[]>([]);
  const [matrixFilterGrade, setMatrixFilterGrade] = useState<number | 'ALL'>('ALL');
  const [loadingMatrices, setLoadingMatrices] = useState(false);

  // History State
  const [historyList, setHistoryList] = useState<WorkHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // UI Active Tab
  const [activeTab, setActiveTab] = useState<'preview' | 'keys' | 'config'>('preview');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Parse entered IDs from questionInput
  const parsedIds = useMemo(() => {
    return questionInput
      .split(/[\n,;\s]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }, [questionInput]);

  // Load History on Mount
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/library?type=history&limit=15');
      const data = await res.json();
      if (data.success && data.history?.data) {
        setHistoryList(data.history.data);
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Fetch Questions for Preview whenever parsedIds change significantly
  const fetchQuestionsForPreview = async (idsToFetch: string[]) => {
    if (idsToFetch.length === 0) {
      setPreviewQuestions([]);
      return;
    }
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/questions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToFetch }),
      });
      const data = await res.json();
      if (data.success && data.questions) {
        setPreviewQuestions(data.questions);
        if (data.notFound && data.notFound.length > 0) {
          setStatusMessage({
            type: 'info',
            text: `Đã nạp ${data.questions.length} câu hỏi (${data.notFound.length} mã không tìm thấy trong DB)`,
          });
        }
      }
    } catch (err) {
      console.error('Lỗi nạp câu hỏi xem trước:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Open Matrix Selection Modal and Fetch Matrices
  const openMatrixModal = async () => {
    setIsMatrixModalOpen(true);
    setLoadingMatrices(true);
    try {
      const res = await fetch('/api/library?type=matrices');
      const data = await res.json();
      if (data.success && data.matrices?.data) {
        setMatrices(data.matrices.data);
      }
    } catch (err) {
      console.error('Lỗi tải ma trận:', err);
    } finally {
      setLoadingMatrices(false);
    }
  };

  // Load question IDs from a chosen matrix
  const handleSelectMatrix = async (matrix: SavedMatrix) => {
    const slots = matrix.distribution?.slots || [];
    const idsFromSlots: string[] = [];

    slots.forEach((s) => {
      if (s.questionId) idsFromSlots.push(s.questionId);
      else if (s.questionCode) idsFromSlots.push(s.questionCode);
    });

    if (idsFromSlots.length > 0) {
      setQuestionInput(idsFromSlots.join('\n'));
      setGrade(matrix.grade || 12);
      setExamTitle(matrix.name || `ĐỀ THI TỪ MA TRẬN ${matrix.grade}`);
      setIsMatrixModalOpen(false);
      fetchQuestionsForPreview(idsFromSlots);
      setStatusMessage({
        type: 'success',
        text: `Đã nạp ${idsFromSlots.length} câu hỏi từ ma trận "${matrix.name}"!`,
      });
    } else {
      // If slots are not assigned yet, fetch candidates from question bank matching grade
      setLoadingMatrices(true);
      try {
        const res = await fetch(`/api/questions?grade=${matrix.grade}&limit=${matrix.totalQuestions || 22}`);
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          const autoIds = data.data.map((q: any) => q.code || q.id);
          setQuestionInput(autoIds.join('\n'));
          setGrade(matrix.grade || 12);
          setExamTitle(matrix.name);
          setIsMatrixModalOpen(false);
          fetchQuestionsForPreview(autoIds);
          setStatusMessage({
            type: 'success',
            text: `Ma trận chưa gắn câu hỏi cố định. Hệ thống đã tự động gắp ${autoIds.length} câu chuẩn Lớp ${matrix.grade}!`,
          });
        } else {
          alert('Không tìm thấy câu hỏi phù hợp cho ma trận này.');
        }
      } catch (e) {
        alert('Lỗi nạp câu hỏi cho ma trận');
      } finally {
        setLoadingMatrices(false);
      }
    }
  };

  // Load 22 Sample Questions for quick test
  const handleLoadSampleQuestions = async (sampleGrade = 12) => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/questions?grade=${sampleGrade}&limit=22`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const sampleCodes = data.data.map((q: any) => q.code || q.id);
        setQuestionInput(sampleCodes.join('\n'));
        setGrade(sampleGrade);
        setPreviewQuestions(data.data);
        setStatusMessage({
          type: 'success',
          text: `Đã nạp ${sampleCodes.length} câu hỏi mẫu Vật lý ${sampleGrade} theo cấu trúc chuẩn!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Chưa có dữ liệu câu hỏi trong ngân hàng để nạp mẫu.',
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ.' });
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handle Export Word Document
  const handleExportWord = async () => {
    if (parsedIds.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng nhập ít nhất một mã câu hỏi hoặc chọn từ ma trận!',
      });
      return;
    }

    setIsExporting(true);
    setStatusMessage(null);

    try {
      const payload = {
        questionIds: parsedIds,
        examTitle,
        schoolName,
        mixCount,
        grade,
        duration: Number(duration) || 50,
        config: {
          department,
          school: schoolName,
          examTitle,
          subject: `Vật lý ${grade}`,
          duration: `${duration} phút`,
          schoolYear: '2024-2025',
          note,
        },
      };

      const res = await fetch('/api/exam/export/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Lỗi máy chủ (${res.status})`);
      }

      // Download docx blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from header or build fallback
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `ScisPhy_DeThi_${grade}_${mixCount}mde.docx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: `Xuất thành công tài liệu Word (${mixCount} mã đề thi kèm bảng đáp án chi tiết)!`,
      });

      // Refresh history list
      loadHistory();
    } catch (err: any) {
      console.error('Export Error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Có lỗi xảy ra khi tạo file Word.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Breakdown of preview questions
  const breakdown = useMemo(() => {
    let mc = 0;
    let tf = 0;
    let sa = 0;
    let essay = 0;
    let lv1 = 0;
    let lv2 = 0;
    let lv3 = 0;
    let lv4 = 0;

    previewQuestions.forEach((q) => {
      if (q.format === 'MULTIPLE_CHOICE') mc++;
      else if (q.format === 'TRUE_FALSE') tf++;
      else if (q.format === 'SHORT_ANSWER') sa++;
      else essay++;

      if (q.difficulty === 1) lv1++;
      else if (q.difficulty === 2) lv2++;
      else if (q.difficulty === 3) lv3++;
      else if (q.difficulty === 4) lv4++;
    });

    const total = previewQuestions.length;
    const basicCount = lv1 + lv2;
    const advancedCount = lv3 + lv4;
    const basicRatio = total > 0 ? Math.round((basicCount / total) * 100) : 0;
    const advancedRatio = total > 0 ? 100 - basicRatio : 0;

    return { mc, tf, sa, essay, total, lv1, lv2, lv3, lv4, basicRatio, advancedRatio };
  }, [previewQuestions]);

  const copyQuestionIdsToClipboard = () => {
    if (!questionInput) return;
    navigator.clipboard.writeText(questionInput);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const getFormatBadge = (fmt: string) => {
    switch (fmt) {
      case 'MULTIPLE_CHOICE':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold">Phần I: Trắc nghiệm</span>;
      case 'TRUE_FALSE':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold">Phần II: Đúng/Sai</span>;
      case 'SHORT_ANSWER':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold">Phần III: Trả lời ngắn</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 border border-stone-200 px-1.5 py-0.5 rounded text-[10px] font-bold">{fmt}</span>;
    }
  };

  const getDifficultyBadge = (diff: number) => {
    switch (diff) {
      case 1:
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">Mức 1 (Nhận biết)</span>;
      case 2:
        return <span className="bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded text-[10px] font-bold">Mức 2 (Thông hiểu)</span>;
      case 3:
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold">Mức 3 (Vận dụng)</span>;
      case 4:
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-bold">Mức 4 (Vận dụng cao)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto text-[#1a0a0a]">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-[#59080b] text-white rounded-xl p-4 shadow-sm border border-[#3a0002] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#f0a500] text-stone-900 flex items-center justify-center font-black shadow-inner">
            <FileText className="w-6 h-6 text-[#59080b]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold uppercase tracking-wide">
                BIÊN SOẠN & XUẤT ĐỀ THI WORD (.DOCX)
              </h1>
              <span className="bg-[#f0a500] text-[#1a0a0a] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                GDPT 2018 / 2025
              </span>
            </div>
            <p className="text-xs text-stone-200">
              Biên soạn tiêu đề đề thi, cấu hình trường học, đảo câu hỏi nhiều mã đề và xuất file Word chuẩn Bộ GD&ĐT.
            </p>
          </div>
        </div>

        {/* Quick actions top bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLoadSampleQuestions(grade)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 font-bold transition"
            title="Nạp nhanh 22 câu mẫu từ ngân hàng câu hỏi để kiểm tra xuất Word"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f0a500]" />
            <span>Nạp 22 câu mẫu Lớp {grade}</span>
          </button>

          <button
            onClick={openMatrixModal}
            className="flex items-center gap-1.5 bg-[#f0a500] hover:bg-[#d99200] text-[#1a0a0a] text-xs px-3.5 py-1.5 rounded-lg font-bold shadow transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Chọn từ ma trận</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
            {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-amber-600" />}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-stone-400 hover:text-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: FORM CONFIGURATION (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-[#e8ddd6] shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="bg-[#59080b] px-4 py-2.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#f0a500]" />
                <span className="text-sm font-bold tracking-wide">1. THÔNG TIN & CẤU HÌNH ĐỀ THI</span>
              </div>
              <span className="text-[11px] text-stone-200">Word Header Settings</span>
            </div>

            {/* Form Fields */}
            <div className="p-4 space-y-3.5 text-xs">
              {/* Exam Title */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Tiêu đề đề thi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Ví dụ: ĐỀ KIỂM TRA ĐỊNH KỲ VẬT LÝ 12"
                  className="w-full px-3 py-2 border border-[#e8ddd6] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#59080b] focus:ring-1 focus:ring-[#59080b]"
                />
              </div>

              {/* School Name & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tên trường THPT</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="THPT Chuyên Khoa Học Tự Nhiên"
                    className="w-full px-3 py-2 border border-[#e8ddd6] rounded-lg text-xs focus:outline-none focus:border-[#59080b]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Sở Giáo dục & Đào tạo</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="SỞ GD&ĐT HÀ NỘI"
                    className="w-full px-3 py-2 border border-[#e8ddd6] rounded-lg text-xs focus:outline-none focus:border-[#59080b]"
                  />
                </div>
              </div>

              {/* Grade & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Khối lớp</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#faf8f6] p-1 rounded-lg border border-[#e8ddd6]">
                    {[10, 11, 12].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setGrade(g);
                        }}
                        className={`py-1.5 text-xs font-bold rounded text-center transition ${
                          grade === g
                            ? 'bg-[#59080b] text-white shadow-sm'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        Lớp {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Thời gian làm bài</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={15}
                      max={180}
                      step={5}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 border border-[#e8ddd6] rounded-lg text-xs font-bold text-center focus:outline-none focus:border-[#59080b]"
                    />
                    <span className="text-xs text-stone-600 font-semibold">phút</span>
                    <div className="flex gap-1 ml-auto">
                      {[45, 50, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDuration(d)}
                          className={`px-2 py-1 text-[11px] rounded border ${
                            duration === d
                              ? 'bg-[#f0a500] text-stone-900 border-[#f0a500] font-bold'
                              : 'bg-white border-[#e8ddd6] text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {d}p
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mix Count Slider (1-24 mã đề) */}
              <div className="bg-[#fff8eb] p-3 rounded-lg border border-[#f0a500]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#59080b]" />
                    <span className="font-bold text-stone-900">Số lượng mã đề thi xáo trộn:</span>
                  </div>
                  <span className="text-sm font-black text-[#59080b] bg-white px-2.5 py-0.5 rounded border border-[#f0a500] shadow-sm">
                    {mixCount} mã đề
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={24}
                  value={mixCount}
                  onChange={(e) => setMixCount(Number(e.target.value))}
                  className="w-full accent-[#59080b] cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium pt-0.5">
                  <div className="flex gap-1">
                    {[1, 2, 4, 8, 12, 24].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setMixCount(v)}
                        className={`px-1.5 py-0.5 rounded border ${
                          mixCount === v
                            ? 'bg-[#59080b] text-white border-[#59080b] font-bold'
                            : 'bg-white border-[#e8ddd6] hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <span className="italic text-stone-500">
                    Mã: {Array.from({ length: Math.min(mixCount, 4) }, (_, i) => 101 + i * 2).join(', ')}
                    {mixCount > 4 ? '...' : ''}
                  </span>
                </div>
              </div>

              {/* Question IDs Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#59080b]" />
                    <span>Danh sách mã câu hỏi (Question IDs / Codes)</span>
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-[#59080b]">
                      Đã nhập: {parsedIds.length} câu
                    </span>
                    {parsedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuestionInput('')}
                        className="text-stone-400 hover:text-red-600 transition"
                        title="Xóa danh sách"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="Dán danh sách ID câu hỏi hoặc mã câu (ví dụ: V12.01.01.NB-01, V12.01.01.TH-02), mỗi mã trên 1 dòng hoặc cách nhau bởi dấu phẩy..."
                  className="w-full px-3 py-2 border border-[#e8ddd6] rounded-lg text-xs font-mono focus:outline-none focus:border-[#59080b] leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openMatrixModal}
                      className="px-2.5 py-1 rounded bg-[#fff8eb] border border-[#f0a500] text-[#59080b] font-bold hover:bg-[#ffeec2] transition flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3 text-[#f0a500]" />
                      <span>Chọn từ ma trận</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLoadSampleQuestions(grade)}
                      className="px-2.5 py-1 rounded bg-stone-100 border border-stone-200 text-stone-700 font-semibold hover:bg-stone-200 transition"
                    >
                      Nạp 22 câu mẫu L{grade}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchQuestionsForPreview(parsedIds)}
                    disabled={parsedIds.length === 0 || loadingPreview}
                    className="px-3 py-1 bg-[#59080b] text-white rounded font-bold hover:bg-[#4a0a0c] disabled:opacity-40 transition flex items-center gap-1 shadow-sm"
                  >
                    {loadingPreview ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-[#f0a500]" />
                    ) : (
                      <Eye className="w-3 h-3 text-[#f0a500]" />
                    )}
                    <span>Nạp xem trước ({parsedIds.length})</span>
                  </button>
                </div>
              </div>

              {/* Note input */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Ghi chú chân đề thi</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#e8ddd6] rounded-lg text-xs focus:outline-none focus:border-[#59080b]"
                />
              </div>

              {/* Primary Export Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExportWord}
                  disabled={parsedIds.length === 0 || isExporting}
                  className="w-full py-3 bg-[#59080b] hover:bg-[#440003] text-white rounded-xl font-bold text-sm tracking-wide shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition transform active:scale-[0.99] flex items-center justify-center gap-2 group"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#f0a500]" />
                      <span>Đang khởi tạo tài liệu Word...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-5 h-5 text-[#f0a500] group-hover:translate-y-0.5 transition" />
                      <span>XUẤT WORD (.DOCX) — {mixCount} MÃ ĐỀ</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-stone-500 italic mt-1.5">
                  Tập tin Word hoàn chỉnh (.docx) sẽ được tải xuống trình duyệt cùng bảng đáp án.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE EXAM STRUCTURE PREVIEW (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-[#e8ddd6] shadow-sm overflow-hidden flex flex-col min-h-[560px]">
            {/* Header bar */}
            <div className="bg-[#59080b] px-4 py-2.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#f0a500]" />
                <span className="text-sm font-bold tracking-wide">2. XEM TRƯỚC CẤU TRÚC ĐỀ THI & CÂU HỎI</span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    activeTab === 'preview'
                      ? 'bg-white text-[#59080b]'
                      : 'text-stone-200 hover:bg-white/10'
                  }`}
                >
                  Đề thi ({previewQuestions.length})
                </button>
                <button
                  onClick={() => setActiveTab('keys')}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    activeTab === 'keys'
                      ? 'bg-white text-[#59080b]'
                      : 'text-stone-200 hover:bg-white/10'
                  }`}
                >
                  Đáp án
                </button>
              </div>
            </div>

            {/* Breakdown Mini Bar */}
            <div className="bg-[#fff8eb] px-4 py-2 border-b border-[#f0a500]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-stone-700">Cấu trúc:</span>
                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[11px] font-bold">
                  Phần I: {breakdown.mc} câu
                </span>
                <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded text-[11px] font-bold">
                  Phần II: {breakdown.tf} câu
                </span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px] font-bold">
                  Phần III: {breakdown.sa} câu
                </span>
                {breakdown.essay > 0 && (
                  <span className="bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-[11px] font-bold">
                    Tự luận: {breakdown.essay} câu
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-stone-600 font-semibold">Tỉ lệ 70/30:</span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded ${
                    breakdown.basicRatio >= 65 && breakdown.basicRatio <= 75
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {breakdown.basicRatio}% Cơ bản / {breakdown.advancedRatio}% Nâng cao
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[640px] bg-[#faf8f6]">
              {/* Paper Layout Container (Simulated Word Document) */}
              <div className="bg-white rounded-lg border border-[#e8ddd6] p-5 shadow-sm space-y-4">
                {/* 1. Official Header */}
                <div className="border-b-2 border-stone-800 pb-3">
                  <div className="grid grid-cols-12 gap-2 text-xs">
                    {/* Left header */}
                    <div className="col-span-6 text-center space-y-0.5">
                      <p className="uppercase font-semibold tracking-wide text-stone-700">{department}</p>
                      <p className="uppercase font-bold text-stone-900">{schoolName}</p>
                      <div className="w-16 h-0.5 bg-stone-400 mx-auto my-1" />
                      <p className="font-bold text-[#59080b]">MÃ ĐỀ THI: 101</p>
                    </div>

                    {/* Right header */}
                    <div className="col-span-6 text-center space-y-0.5">
                      <p className="uppercase font-bold text-stone-900 text-xs md:text-sm">{examTitle}</p>
                      <p className="font-semibold text-stone-700">Môn: Vật lý — Lớp {grade}</p>
                      <p className="italic text-stone-600">Thời gian làm bài: {duration} phút (không kể thời gian phát đề)</p>
                      <div className="w-16 h-0.5 bg-stone-400 mx-auto my-1" />
                    </div>
                  </div>

                  {/* Student Info Line */}
                  <div className="pt-2 text-[11px] text-stone-600 flex justify-between border-t border-dashed border-stone-300 mt-2">
                    <span>Họ và tên thí sinh: ............................................................................</span>
                    <span>Số báo danh: .......................</span>
                  </div>
                </div>

                {/* Question List View */}
                {activeTab === 'preview' && (
                  <div className="space-y-4">
                    {previewQuestions.length === 0 ? (
                      <div className="text-center py-12 text-stone-400 space-y-2">
                        <BookOpen className="w-10 h-10 mx-auto text-stone-300" />
                        <p className="text-xs font-semibold text-stone-600">Chưa có câu hỏi nào được nạp</p>
                        <p className="text-[11px] max-w-sm mx-auto text-stone-400">
                          Nhập danh sách mã câu hỏi ở khung bên trái hoặc bấm &quot;Chọn từ ma trận&quot; để nạp xem trước toàn bộ đề thi.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={() => handleLoadSampleQuestions(grade)}
                            className="px-3 py-1.5 bg-[#59080b] text-white rounded text-xs font-bold hover:bg-[#4a0a0c]"
                          >
                            Nạp 22 câu mẫu Lớp {grade} ngay
                          </button>
                        </div>
                      </div>
                    ) : (
                      previewQuestions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-3 bg-stone-50/70 rounded-lg border border-stone-200 hover:border-stone-400 transition space-y-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#59080b] bg-[#fff8eb] px-2 py-0.5 rounded border border-[#f0a500]/50">
                                Câu {idx + 1}
                              </span>
                              <span className="font-mono text-[10px] text-stone-500 font-semibold">{q.code}</span>
                              {getFormatBadge(q.format)}
                              {getDifficultyBadge(q.difficulty)}
                            </div>

                            {q.topic?.name && (
                              <span className="text-[10px] text-stone-500 truncate max-w-[200px]" title={q.topic.name}>
                                {q.topic.name}
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="text-stone-900 leading-relaxed font-normal">
                            <MathRenderer content={q.content} />
                          </div>

                          {/* Options if Multiple Choice */}
                          {q.format === 'MULTIPLE_CHOICE' && q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {Object.entries(q.options).map(([key, optVal]) => {
                                const isCorrect = q.correctAnswer === key;
                                return (
                                  <div
                                    key={key}
                                    className={`p-2 rounded border text-xs flex items-start gap-1.5 ${
                                      isCorrect
                                        ? 'bg-emerald-50/80 border-emerald-300 font-semibold text-emerald-900'
                                        : 'bg-white border-stone-200 text-stone-800'
                                    }`}
                                  >
                                    <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-[#59080b]'}`}>
                                      {key}.
                                    </span>
                                    <div className="flex-1">
                                      <MathRenderer content={String(optVal)} />
                                    </div>
                                    {isCorrect && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Options if True/False */}
                          {q.format === 'TRUE_FALSE' && q.options && (
                            <div className="space-y-1.5 pt-1">
                              {Object.entries(q.options).map(([subKey, subVal]) => {
                                const correctObj = typeof q.correctAnswer === 'object' ? q.correctAnswer : {};
                                const isTrue = correctObj[subKey] === true || correctObj[subKey] === 'Đ';
                                return (
                                  <div
                                    key={subKey}
                                    className="p-1.5 rounded border bg-white border-stone-200 text-xs flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-[#59080b]">{subKey})</span>
                                      <MathRenderer content={String(subVal)} />
                                    </div>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        isTrue ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {isTrue ? 'ĐÚNG' : 'SAI'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Short Answer */}
                          {q.format === 'SHORT_ANSWER' && (
                            <div className="bg-amber-50/60 p-2 rounded border border-amber-200 flex items-center justify-between text-xs">
                              <span className="text-stone-700 font-semibold">Đáp án số:</span>
                              <span className="font-mono font-bold text-[#59080b] text-sm">
                                {String(q.correctAnswer)}
                              </span>
                            </div>
                          )}

                          {/* Explanation if any */}
                          {q.explanation && (
                            <div className="bg-stone-100/60 p-2 rounded text-[11px] text-stone-600 border border-stone-200">
                              <span className="font-bold text-stone-700">Lời giải vắn tắt: </span>
                              <MathRenderer content={q.explanation} className="inline" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Answer Key Matrix View */}
                {activeTab === 'keys' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-stone-800 uppercase">
                        Bảng Đáp Án Tự Động ({mixCount} Mã Đề Dự Kiến)
                      </h4>
                      <button
                        onClick={copyQuestionIdsToClipboard}
                        className="flex items-center gap-1 text-[11px] text-[#59080b] hover:underline font-bold"
                      >
                        {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Sao chép ID</span>
                      </button>
                    </div>

                    <div className="border border-stone-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-[#59080b] text-white text-[11px]">
                          <tr>
                            <th className="p-2 text-center w-12">Câu</th>
                            <th className="p-2">Mã câu</th>
                            <th className="p-2">Dạng thức</th>
                            <th className="p-2 text-center">Đáp án Gốc</th>
                            <th className="p-2 text-center">Mức độ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {previewQuestions.map((q, idx) => (
                            <tr key={q.id || idx} className="hover:bg-stone-50">
                              <td className="p-2 text-center font-bold text-[#59080b]">{idx + 1}</td>
                              <td className="p-2 font-mono text-[11px] text-stone-700">{q.code}</td>
                              <td className="p-2 text-stone-600">
                                {q.format === 'MULTIPLE_CHOICE' && 'Trắc nghiệm 4 phương án'}
                                {q.format === 'TRUE_FALSE' && 'Đúng/Sai 4 ý'}
                                {q.format === 'SHORT_ANSWER' && 'Trả lời ngắn'}
                              </td>
                              <td className="p-2 text-center font-bold text-emerald-700">
                                {typeof q.correctAnswer === 'object'
                                  ? JSON.stringify(q.correctAnswer)
                                  : String(q.correctAnswer)}
                              </td>
                              <td className="p-2 text-center text-[11px]">
                                Mức {q.difficulty}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXPORT & WORK HISTORY SECTION */}
      <div className="bg-white rounded-xl border border-[#e8ddd6] shadow-sm overflow-hidden">
        <div className="bg-[#59080b] px-4 py-2.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#f0a500]" />
            <span className="text-sm font-bold tracking-wide">3. LỊCH SỬ XUẤT ĐỀ & HOẠT ĐỘNG GẦN ĐÂY</span>
          </div>

          <button
            onClick={loadHistory}
            disabled={loadingHistory}
            className="flex items-center gap-1 text-xs text-stone-200 hover:text-white transition disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        <div className="p-4">
          {historyList.length === 0 ? (
            <div className="text-center py-6 text-stone-400 text-xs">
              <Clock className="w-8 h-8 mx-auto text-stone-300 mb-1" />
              Chưa có lịch sử làm việc nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e8ddd6] text-stone-600 bg-stone-50">
                    <th className="py-2.5 px-3 font-bold">Thời gian</th>
                    <th className="py-2.5 px-3 font-bold">Hành động</th>
                    <th className="py-2.5 px-3 font-bold">Nội dung thao tác</th>
                    <th className="py-2.5 px-3 font-bold">Thông tin chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8ddd6]">
                  {historyList.map((item) => {
                    const isExport = item.action === 'export_word';
                    return (
                      <tr key={item.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isExport
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {isExport ? 'XUẤT WORD' : item.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-stone-800">
                          {item.description}
                        </td>
                        <td className="py-2.5 px-3 text-stone-500 text-[11px]">
                          {item.metadata?.examTitle ? (
                            <span className="font-semibold text-[#59080b]">
                              {item.metadata.examTitle} ({item.metadata.mixCount || 1} mã)
                            </span>
                          ) : (
                            <span className="italic text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: CHỌN TỪ MA TRẬN */}
      {isMatrixModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#e8ddd6] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#59080b] px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#f0a500]" />
                <div>
                  <h3 className="font-bold text-sm tracking-wide">CHỌN TỪ MA TRẬN ĐỀ THI ĐÃ LƯU</h3>
                  <p className="text-[11px] text-stone-300">
                    Nạp danh sách câu hỏi theo cấu trúc ma trận chuẩn vào form soạn thảo Word
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMatrixModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="p-3 bg-[#faf8f6] border-b border-[#e8ddd6] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                {(['ALL', 10, 11, 12] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setMatrixFilterGrade(g)}
                    className={`px-3 py-1 rounded-md font-bold transition text-xs ${
                      matrixFilterGrade === g
                        ? 'bg-[#59080b] text-white'
                        : 'bg-white border border-[#e8ddd6] text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {g === 'ALL' ? 'Tất cả khối' : `Lớp ${g}`}
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-stone-500 font-semibold">
                Tổng: {matrices.length} ma trận đã lưu
              </span>
            </div>

            {/* Matrix List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-stone-50">
              {loadingMatrices ? (
                <div className="text-center py-10 text-stone-400 space-y-2">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#59080b]" />
                  <p className="text-xs">Đang tải danh sách ma trận...</p>
                </div>
              ) : matrices.length === 0 ? (
                <div className="text-center py-10 text-stone-400 space-y-2">
                  <Layers className="w-8 h-8 mx-auto text-stone-300" />
                  <p className="text-xs font-semibold">Chưa có ma trận nào được lưu trong thư viện</p>
                  <p className="text-[11px]">
                    Bạn có thể nạp câu hỏi mẫu Vật lý 10, 11, 12 ngay ngoài màn hình chính.
                  </p>
                </div>
              ) : (
                matrices
                  .filter((m) => matrixFilterGrade === 'ALL' || m.grade === matrixFilterGrade)
                  .map((m) => {
                    const slotCount = m.distribution?.slots?.length || m.totalQuestions || 22;
                    return (
                      <div
                        key={m.id}
                        className="bg-white p-3.5 rounded-xl border border-[#e8ddd6] hover:border-[#59080b] hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#59080b] text-xs md:text-sm">
                              {m.name}
                            </span>
                            <span className="bg-[#fff8eb] text-[#59080b] border border-[#f0a500] px-2 py-0.2 rounded text-[10px] font-bold">
                              Lớp {m.grade}
                            </span>
                            <span className="bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                              {slotCount} câu
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-500 flex items-center gap-2">
                            <span>Ngày tạo: {new Date(m.createdAt).toLocaleDateString('vi-VN')}</span>
                            {m.distribution?.examFormat && (
                              <span>• Chuẩn: {m.distribution.examFormat}</span>
                            )}
                          </p>
                        </div>

                        <button
                          onClick={() => handleSelectMatrix(m)}
                          className="px-3.5 py-1.5 bg-[#59080b] hover:bg-[#440003] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm flex-shrink-0"
                        >
                          <span>Nạp ma trận này</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#f0a500]" />
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-[#e8ddd6] flex items-center justify-between text-xs">
              <span className="text-[11px] text-stone-500 italic">
                * Câu hỏi sẽ được lấy từ các slot đã gắn hoặc tự động chọn từ ngân hàng.
              </span>
              <button
                onClick={() => setIsMatrixModalOpen(false)}
                className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
