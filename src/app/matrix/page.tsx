'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MathRenderer from '@/components/MathRenderer';

// ===== INTERFACES =====

interface Topic {
  id: string;
  name: string;
  order: number;
  totalQuestions?: number;
  _count?: { questions: number };
}

interface Chapter {
  id: string;
  name: string;
  order: number;
  totalQuestions?: number;
  topics: Topic[];
  _count?: { questions: number };
}

interface GradeTree {
  id: number;
  name: string;
  totalQuestions: number;
  chapters: Chapter[];
}

interface MatrixSlot {
  position: number;
  format: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty: number | null;
  topicId: string | null;
  topicName: string | null;
  questionId: string | null;
  questionCode: string | null;
}

interface MatrixConfig {
  id?: string;
  name: string;
  grade: number;
  examFormat: 'THPTQG_2025' | 'THPTQG_LEGACY' | 'CUSTOM';
  multipleChoiceCount: number;
  trueFalseCount: number;
  shortAnswerCount: number;
  slots: MatrixSlot[];
}

interface MatrixValidation {
  is7030Valid: boolean;
  basicPercent: number;
  advancedPercent: number;
  unassignedCount: number;
  assignedCount: number;
  breakdown: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
  averageDifficulty: number;
  messages: string[];
}

interface ChapterRow {
  chapterId: string;
  chapterName: string;
  order: number;
  topics: Topic[];
  mc: [number, number, number, number]; // M1, M2, M3, M4
  tf: [number, number, number, number];
  sa: [number, number, number, number];
}

interface QuestionDetail {
  id: string;
  code: string;
  grade: number;
  subject?: string;
  format: string;
  difficulty: number;
  content: string;
  options?: any;
  correctAnswer?: any;
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

interface ShuffledOption {
  originalLabel: string;
  newLabel: string;
  text: string;
}

interface ShuffledQuestion {
  position: number;
  originalPosition: number;
  questionId: string;
  questionCode: string;
  format: string;
  difficulty: number;
  content: string;
  tikzCode?: string | null;
  shuffledOptions?: ShuffledOption[];
  correctAnswerLabel: string;
  explanation?: string | null;
}

interface ExamVariant {
  variantCode: string;
  variantNumber: number;
  questions: ShuffledQuestion[];
}

interface ShuffleResult {
  totalVariants: number;
  totalQuestions: number;
  variants: ExamVariant[];
  answerKeys: Array<{
    variantCode: string;
    entries: Array<{
      position: number;
      questionCode: string;
      correctAnswer: string;
      format: string;
    }>;
  }>;
  answerGrid: Array<{
    position: number;
    format: string;
    answers: Record<string, string>;
  }>;
  savedExam?: any;
  breakdown?: {
    multipleChoice: number;
    trueFalse: number;
    shortAnswer: number;
  };
}

interface SavedMatrixItem {
  id: string;
  name: string;
  grade: number;
  totalQuestions: number;
  createdAt: string;
  distribution: {
    examFormat: string;
    multipleChoiceCount: number;
    trueFalseCount: number;
    shortAnswerCount: number;
    slots: MatrixSlot[];
  };
}

export default function MatrixPage() {
  // ─── 1. Form Configuration State ───
  const [matrixName, setMatrixName] = useState('Ma trận Đề thi Vật lý 12 - Học kỳ I 2025');
  const [grade, setGrade] = useState<number>(12);
  const [template, setTemplate] = useState<'THPTQG_2025' | 'THPTQG_LEGACY' | 'CUSTOM'>('THPTQG_2025');
  const [customMC, setCustomMC] = useState(18);
  const [customTF, setCustomTF] = useState(4);
  const [customSA, setCustomSA] = useState(6);

  // ─── 2. Taxonomy & Chapter Distribution State ───
  const [taxonomy, setTaxonomy] = useState<GradeTree[]>([]);
  const [chapterRows, setChapterRows] = useState<ChapterRow[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'questions' | 'shuffle' | 'saved'>('matrix');

  // ─── 3. Matrix & Validation State ───
  const [matrix, setMatrix] = useState<MatrixConfig | null>(null);
  const [validation, setValidation] = useState<MatrixValidation | null>(null);
  const [autoDistributePreset, setAutoDistributePreset] = useState<'70_30_balanced' | '70_30_hard' | '70_30_easy'>('70_30_balanced');

  // ─── 4. Questions & Candidates State ───
  const [questionsMap, setQuestionsMap] = useState<Record<string, QuestionDetail>>({});
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [questionFilterFormat, setQuestionFilterFormat] = useState<string>('ALL');

  // ─── 5. Shuffle State ───
  const [mixCount, setMixCount] = useState<number>(4);
  const [examTitle, setExamTitle] = useState('ĐỀ KIỂM TRA HỌC KỲ I - MÔN VẬT LÝ');
  const [schoolName, setSchoolName] = useState('TRƯỜNG THPT CHUYÊN KHOA HỌC TỰ NHIÊN');
  const [examDuration, setExamDuration] = useState<number>(50);
  const [shuffleResult, setShuffleResult] = useState<ShuffleResult | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);

  // ─── 6. UI & Action Status State ───
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);
  const [savedMatrices, setSavedMatrices] = useState<SavedMatrixItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Helper to show notification
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  // Compute total questions
  const totalQuestions = useMemo(() => {
    if (template === 'THPTQG_2025') return 28;
    if (template === 'THPTQG_LEGACY') return 22;
    return customMC + customTF + customSA;
  }, [template, customMC, customTF, customSA]);

  const targetMC = template === 'THPTQG_2025' ? 18 : template === 'THPTQG_LEGACY' ? 12 : customMC;
  const targetTF = template === 'THPTQG_2025' ? 4 : template === 'THPTQG_LEGACY' ? 4 : customTF;
  const targetSA = template === 'THPTQG_2025' ? 6 : template === 'THPTQG_LEGACY' ? 6 : customSA;

  // ─── Load Taxonomy Tree ───
  useEffect(() => {
    async function fetchTaxonomy() {
      try {
        const res = await fetch('/api/taxonomy');
        const data = await res.json();
        if (data.success && data.tree) {
          setTaxonomy(data.tree);
        }
      } catch (err) {
        console.error('Lỗi tải mục lục:', err);
      }
    }
    fetchTaxonomy();
  }, []);

  // ─── Load Questions for Grade ───
  const loadGradeQuestions = useCallback(async (targetGrade: number) => {
    try {
      const res = await fetch(`/api/questions?grade=${targetGrade}&limit=50`);
      const data = await res.json();
      if (data.success && data.data) {
        const map: Record<string, QuestionDetail> = {};
        data.data.forEach((q: QuestionDetail) => {
          map[q.id] = q;
        });
        setQuestionsMap(map);
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết câu hỏi:', err);
    }
  }, []);

  useEffect(() => {
    loadGradeQuestions(grade);
  }, [grade, loadGradeQuestions]);

  // ─── Initialize Chapter Rows from Taxonomy ───
  const initializeChapterRows = useCallback((targetGrade: number, currentTaxonomy: GradeTree[]) => {
    const gradeNode = currentTaxonomy.find((g) => g.id === targetGrade || g.name.includes(`${targetGrade}`));
    if (!gradeNode || !gradeNode.chapters) return [];

    return gradeNode.chapters.map((chap) => ({
      chapterId: chap.id,
      chapterName: chap.name,
      order: chap.order,
      topics: chap.topics || [],
      mc: [0, 0, 0, 0] as [number, number, number, number],
      tf: [0, 0, 0, 0] as [number, number, number, number],
      sa: [0, 0, 0, 0] as [number, number, number, number],
    }));
  }, []);

  // When grade or taxonomy changes, re-init chapter rows
  useEffect(() => {
    if (taxonomy.length > 0) {
      const initialRows = initializeChapterRows(grade, taxonomy);
      setChapterRows(initialRows);
      // Auto-create initial matrix
      handleCreateMatrix(grade, template, initialRows);
    }
  }, [grade, taxonomy]);

  // ─── Fetch Saved Matrices ───
  const fetchSavedMatrices = async () => {
    setLoadingSaved(true);
    try {
      const res = await fetch(`/api/matrix?grade=${grade}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSavedMatrices(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải ma trận đã lưu:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  // ─── Action 1: Create Matrix ───
  const handleCreateMatrix = async (
    targetGrade = grade,
    targetTemplate = template,
    existingRows = chapterRows
  ) => {
    setLoading(true);
    try {
      const mc = targetTemplate === 'THPTQG_2025' ? 18 : targetTemplate === 'THPTQG_LEGACY' ? 12 : customMC;
      const tf = targetTemplate === 'THPTQG_2025' ? 4 : targetTemplate === 'THPTQG_LEGACY' ? 4 : customTF;
      const sa = targetTemplate === 'THPTQG_2025' ? 6 : targetTemplate === 'THPTQG_LEGACY' ? 6 : customSA;

      const res = await fetch('/api/matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: matrixName,
          grade: targetGrade,
          examFormat: targetTemplate,
          template: targetTemplate,
          mcCount: mc,
          tfCount: tf,
          saCount: sa,
          totalQuestions: mc + tf + sa,
        }),
      });

      const data = await res.json();
      if (data.success && data.matrix) {
        setMatrix(data.matrix);
        setValidation(data.validation);
        showToast('info', `Đã khởi tạo ma trận trống: ${data.totalSlots} câu hỏi.`);
      } else {
        showToast('error', data.error || 'Không thể tạo ma trận.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi kết nối khi tạo ma trận.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Helper: Rebuild slots from ChapterRows ───
  const buildSlotsFromRows = (rows: ChapterRow[], config: MatrixConfig): MatrixSlot[] => {
    const slots: MatrixSlot[] = [];
    let pos = 1;

    // 1. Multiple Choice
    const mcItems: Array<{ diff: number; topicId: string | null; topicName: string | null }> = [];
    rows.forEach((r) => {
      r.mc.forEach((count, diffIdx) => {
        for (let i = 0; i < count; i++) {
          mcItems.push({
            diff: diffIdx + 1,
            topicId: r.topics[0]?.id || null,
            topicName: r.chapterName,
          });
        }
      });
    });

    for (let i = 0; i < config.multipleChoiceCount; i++) {
      const item = mcItems[i];
      slots.push({
        position: pos++,
        format: 'MULTIPLE_CHOICE',
        difficulty: item ? item.diff : null,
        topicId: item ? item.topicId : null,
        topicName: item ? item.topicName : null,
        questionId: null,
        questionCode: null,
      });
    }

    // 2. True / False
    const tfItems: Array<{ diff: number; topicId: string | null; topicName: string | null }> = [];
    rows.forEach((r) => {
      r.tf.forEach((count, diffIdx) => {
        for (let i = 0; i < count; i++) {
          tfItems.push({
            diff: diffIdx + 1,
            topicId: r.topics[0]?.id || null,
            topicName: r.chapterName,
          });
        }
      });
    });

    for (let i = 0; i < config.trueFalseCount; i++) {
      const item = tfItems[i];
      slots.push({
        position: pos++,
        format: 'TRUE_FALSE',
        difficulty: item ? item.diff : null,
        topicId: item ? item.topicId : null,
        topicName: item ? item.topicName : null,
        questionId: null,
        questionCode: null,
      });
    }

    // 3. Short Answer
    const saItems: Array<{ diff: number; topicId: string | null; topicName: string | null }> = [];
    rows.forEach((r) => {
      r.sa.forEach((count, diffIdx) => {
        for (let i = 0; i < count; i++) {
          saItems.push({
            diff: diffIdx + 1,
            topicId: r.topics[0]?.id || null,
            topicName: r.chapterName,
          });
        }
      });
    });

    for (let i = 0; i < config.shortAnswerCount; i++) {
      const item = saItems[i];
      slots.push({
        position: pos++,
        format: 'SHORT_ANSWER',
        difficulty: item ? item.diff : null,
        topicId: item ? item.topicId : null,
        topicName: item ? item.topicName : null,
        questionId: null,
        questionCode: null,
      });
    }

    return slots;
  };

  // ─── Table Cell Change Handler ───
  const handleCellChange = (
    rowIndex: number,
    format: 'mc' | 'tf' | 'sa',
    diffIndex: number,
    value: number
  ) => {
    const clampedVal = Math.max(0, Math.min(50, isNaN(value) ? 0 : value));
    const nextRows = [...chapterRows];
    const targetRow = { ...nextRows[rowIndex] };
    const nextArr = [...targetRow[format]] as [number, number, number, number];
    nextArr[diffIndex] = clampedVal;
    targetRow[format] = nextArr;
    nextRows[rowIndex] = targetRow;
    setChapterRows(nextRows);

    if (matrix) {
      const updatedSlots = buildSlotsFromRows(nextRows, matrix);
      const updatedMatrix = { ...matrix, slots: updatedSlots };
      setMatrix(updatedMatrix);

      // Instant local validation update
      computeLocalValidation(updatedSlots);
    }
  };

  // ─── Local 70/30 Computation ───
  const computeLocalValidation = (slots: MatrixSlot[]) => {
    const assigned = slots.filter((s) => s.difficulty !== null);
    const unassigned = slots.filter((s) => s.difficulty === null);
    const breakdown = {
      level1: assigned.filter((s) => s.difficulty === 1).length,
      level2: assigned.filter((s) => s.difficulty === 2).length,
      level3: assigned.filter((s) => s.difficulty === 3).length,
      level4: assigned.filter((s) => s.difficulty === 4).length,
    };
    const totalAssigned = assigned.length;
    const basicCount = breakdown.level1 + breakdown.level2;
    const advancedCount = breakdown.level3 + breakdown.level4;
    const basicPercent = totalAssigned > 0 ? (basicCount / totalAssigned) * 100 : 0;
    const advancedPercent = totalAssigned > 0 ? (advancedCount / totalAssigned) * 100 : 0;
    const is7030Valid = unassigned.length === 0 && Math.abs(basicPercent - 70) <= 5;
    const averageDifficulty =
      totalAssigned > 0
        ? assigned.reduce((sum, s) => sum + (s.difficulty || 0), 0) / totalAssigned
        : 0;

    const messages: string[] = [];
    if (unassigned.length > 0) {
      messages.push(`${unassigned.length} câu chưa gán mức độ nhận thức.`);
    }
    if (unassigned.length === 0 && totalAssigned > 0) {
      if (is7030Valid) {
        messages.push(
          `✅ Đạt chuẩn 70/30: ${basicPercent.toFixed(1)}% NB–TH / ${advancedPercent.toFixed(1)}% VD–VDC.`
        );
      } else {
        messages.push(
          `⚠️ Chưa đạt tỷ lệ 70/30: ${basicPercent.toFixed(1)}% NB–TH (yêu cầu 65%–75%).`
        );
      }
    }

    setValidation({
      is7030Valid,
      basicPercent: Math.round(basicPercent * 10) / 10,
      advancedPercent: Math.round(advancedPercent * 10) / 10,
      unassignedCount: unassigned.length,
      assignedCount: totalAssigned,
      breakdown,
      averageDifficulty: Math.round(averageDifficulty * 100) / 100,
      messages,
    });
  };

  // ─── Table Summary Calculations ───
  const tableTotals = useMemo(() => {
    const colMC = [0, 0, 0, 0];
    const colTF = [0, 0, 0, 0];
    const colSA = [0, 0, 0, 0];

    chapterRows.forEach((r) => {
      r.mc.forEach((v, i) => { colMC[i] += v; });
      r.tf.forEach((v, i) => { colTF[i] += v; });
      r.sa.forEach((v, i) => { colSA[i] += v; });
    });

    const sumMC = colMC.reduce((a, b) => a + b, 0);
    const sumTF = colTF.reduce((a, b) => a + b, 0);
    const sumSA = colSA.reduce((a, b) => a + b, 0);
    const grandTotal = sumMC + sumTF + sumSA;

    const m1 = colMC[0] + colTF[0] + colSA[0];
    const m2 = colMC[1] + colTF[1] + colSA[1];
    const m3 = colMC[2] + colTF[2] + colSA[2];
    const m4 = colMC[3] + colTF[3] + colSA[3];

    const basicTotal = m1 + m2;
    const advancedTotal = m3 + m4;
    const basicRatio = grandTotal > 0 ? (basicTotal / grandTotal) * 100 : 0;
    const advancedRatio = grandTotal > 0 ? (advancedTotal / grandTotal) * 100 : 0;

    return {
      colMC,
      colTF,
      colSA,
      sumMC,
      sumTF,
      sumSA,
      grandTotal,
      m1,
      m2,
      m3,
      m4,
      basicTotal,
      advancedTotal,
      basicRatio: Math.round(basicRatio * 10) / 10,
      advancedRatio: Math.round(advancedRatio * 10) / 10,
      is7030: Math.abs(basicRatio - 70) <= 5 && grandTotal > 0,
    };
  }, [chapterRows]);

  // ─── Action 2: Auto Distribute ───
  const handleAutoDistribute = async () => {
    if (!matrix) {
      showToast('error', 'Chưa khởi tạo ma trận.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto-distribute',
          matrix,
          preset: autoDistributePreset,
          grade,
          template,
          name: matrixName,
          totalQuestions: matrix.slots.length,
        }),
      });

      const data = await res.json();
      if (data.success && data.matrix) {
        setMatrix(data.matrix);
        setValidation(data.validation);

        // Distribute slots into chapterRows across available chapters
        const newRows = chapterRows.map((row) => ({
          ...row,
          mc: [0, 0, 0, 0] as [number, number, number, number],
          tf: [0, 0, 0, 0] as [number, number, number, number],
          sa: [0, 0, 0, 0] as [number, number, number, number],
        }));

        const numChaps = Math.max(1, newRows.length);

        data.matrix.slots.forEach((slot: MatrixSlot, idx: number) => {
          if (!slot.difficulty) return;
          const chapIdx = idx % numChaps;
          const diffIdx = slot.difficulty - 1;

          if (slot.format === 'MULTIPLE_CHOICE') {
            newRows[chapIdx].mc[diffIdx]++;
          } else if (slot.format === 'TRUE_FALSE') {
            newRows[chapIdx].tf[diffIdx]++;
          } else if (slot.format === 'SHORT_ANSWER') {
            newRows[chapIdx].sa[diffIdx]++;
          }
        });

        setChapterRows(newRows);
        showToast('success', 'Đã tự động phân bổ câu hỏi đạt chuẩn 70/30!');
      } else {
        showToast('error', data.error || 'Lỗi khi phân bổ mức độ.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi kết nối khi phân bổ.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Action 3: Validate 70/30 ───
  const handleValidate = async () => {
    if (!matrix) {
      showToast('error', 'Chưa khởi tạo ma trận.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          matrix,
          grade,
          template,
          name: matrixName,
          totalQuestions: matrix.slots.length,
        }),
      });

      const data = await res.json();
      if (data.success && data.validation) {
        setValidation(data.validation);
        if (data.validation.is7030Valid) {
          showToast(
            'success',
            `Chuẩn 70/30: ${data.validation.basicPercent}% NB-TH / ${data.validation.advancedPercent}% VD-VDC. Hoàn toàn hợp lệ!`
          );
        } else {
          showToast(
            'warning',
            `Chưa đạt chuẩn 70/30 (${data.validation.basicPercent}% NB-TH, yêu cầu 65%–75%). Vui lòng cân chỉnh lại.`
          );
        }
      } else {
        showToast('error', data.error || 'Lỗi khi kiểm tra ma trận.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi kết nối khi kiểm tra.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Action 4: Auto Fill from Question Bank ───
  const handleAutoFill = async () => {
    if (!matrix) {
      showToast('error', 'Chưa khởi tạo ma trận.');
      return;
    }

    // Ensure difficulties are assigned
    const unassigned = matrix.slots.filter((s) => s.difficulty === null);
    if (unassigned.length > 0) {
      showToast(
        'warning',
        'Còn câu hỏi chưa có mức độ! Đang tự động phân bổ trước khi chọn câu...'
      );
      await handleAutoDistribute();
    }

    setLoading(true);
    try {
      const res = await fetch('/api/matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto-fill',
          matrix,
          grade,
          template,
          name: matrixName,
          totalQuestions: matrix.slots.length,
        }),
      });

      const data = await res.json();
      if (data.success && data.matrix) {
        setMatrix(data.matrix);
        setValidation(data.validation);

        // Fetch detailed question cards to populate preview
        await loadGradeQuestions(matrix.grade);

        showToast(
          'success',
          data.message || 'Đã tự động chọn đầy đủ câu hỏi từ ngân hàng số!'
        );
        setActiveTab('questions');
      } else {
        showToast('error', data.error || 'Lỗi khi chọn câu hỏi.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi kết nối khi chọn câu.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Action 5: Save Matrix ───
  const handleSaveMatrix = async () => {
    if (!matrix) {
      showToast('error', 'Chưa khởi tạo ma trận.');
      return;
    }

    setLoading(true);
    try {
      const matrixToSave = {
        ...matrix,
        name: matrixName,
        grade,
      };

      const res = await fetch('/api/matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          matrix: matrixToSave,
          grade,
          template,
          name: matrixName,
          distribution: matrixToSave.slots,
          totalQuestions: matrixToSave.slots.length,
        }),
      });

      const data = await res.json();
      if (data.success && data.savedMatrix) {
        showToast('success', `Đã lưu ma trận "${matrixName}" thành công vào CSDL!`);
        fetchSavedMatrices();
      } else {
        showToast('error', data.error || 'Không thể lưu ma trận.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi kết nối khi lưu ma trận.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Action 6: Shuffle Exam ───
  const handleShuffle = async () => {
    if (!matrix) {
      showToast('error', 'Chưa có cấu hình ma trận.');
      return;
    }

    const questionIds = matrix.slots
      .map((s) => s.questionId)
      .filter((id): id is string => Boolean(id));

    if (questionIds.length === 0) {
      showToast(
        'warning',
        'Chưa có câu hỏi nào được gán! Vui lòng nhấn "Tự động chọn câu" trước.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/exam/shuffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIds,
          mixCount,
          examTitle,
          schoolName,
          examInfo: {
            title: examTitle,
            schoolName,
            duration: examDuration,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.variants) {
        setShuffleResult(data);
        setSelectedVariantIndex(0);
        showToast(
          'success',
          `Trộn đề thành công! Đã tạo ${data.totalVariants} mã đề với bảng đáp án chi tiết.`
        );
        setActiveTab('shuffle');
      } else {
        showToast('error', data.error || 'Không thể trộn đề.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi kết nối khi trộn đề.');
    } finally {
      setLoading(false);
    }
  };

  // Load a saved matrix
  const handleLoadSavedMatrix = (item: SavedMatrixItem) => {
    try {
      setMatrixName(item.name);
      setGrade(item.grade);
      const dist = item.distribution;
      const loadedTemplate = (dist.examFormat as any) || 'THPTQG_2025';
      setTemplate(loadedTemplate);

      const loadedMatrix: MatrixConfig = {
        id: item.id,
        name: item.name,
        grade: item.grade,
        examFormat: loadedTemplate,
        multipleChoiceCount: dist.multipleChoiceCount || 18,
        trueFalseCount: dist.trueFalseCount || 4,
        shortAnswerCount: dist.shortAnswerCount || 6,
        slots: dist.slots || [],
      };

      setMatrix(loadedMatrix);
      computeLocalValidation(dist.slots || []);

      // Re-populate chapter rows
      if (taxonomy.length > 0) {
        const rows = initializeChapterRows(item.grade, taxonomy);
        const numChaps = Math.max(1, rows.length);

        (dist.slots || []).forEach((slot, idx) => {
          if (!slot.difficulty) return;
          const chapIdx = idx % numChaps;
          const diffIdx = slot.difficulty - 1;
          if (slot.format === 'MULTIPLE_CHOICE') rows[chapIdx].mc[diffIdx]++;
          else if (slot.format === 'TRUE_FALSE') rows[chapIdx].tf[diffIdx]++;
          else if (slot.format === 'SHORT_ANSWER') rows[chapIdx].sa[diffIdx]++;
        });

        setChapterRows(rows);
      }

      showToast('success', `Đã tải ma trận: "${item.name}".`);
      setActiveTab('matrix');
    } catch (err: any) {
      showToast('error', 'Lỗi khi tải dữ liệu ma trận.');
    }
  };

  // Filter questions for display
  const filteredSlots = useMemo(() => {
    if (!matrix || !matrix.slots) return [];
    if (questionFilterFormat === 'ALL') return matrix.slots;
    return matrix.slots.filter((s) => s.format === questionFilterFormat);
  }, [matrix, questionFilterFormat]);

  const assignedCount = matrix?.slots.filter((s) => s.questionId).length || 0;

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-[#1a0a0a]">
      {/* ─── TOAST NOTIFICATION ─── */}
      {actionMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : actionMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : actionMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-sky-50 text-sky-800 border-sky-300'
          }`}
        >
          <span>
            {actionMessage.type === 'success' && '✅'}
            {actionMessage.type === 'error' && '❌'}
            {actionMessage.type === 'warning' && '⚠️'}
            {actionMessage.type === 'info' && 'ℹ️'}
          </span>
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="ml-2 text-stone-400 hover:text-stone-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── PAGE HEADER BAR ─── */}
      <div className="bg-white rounded-lg p-3 border border-[#e8ddd6] shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#59080b] flex items-center justify-center text-[#f0a500] font-bold text-sm shadow-sm">
            ▦
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#59080b] uppercase tracking-wide">
              Xây Dựng Ma Trận Đề Thi Vật Lý
            </h1>
            <p className="text-[11px] text-stone-500">
              Chuẩn GDPT 2018 / Định hướng Bộ GD&ĐT 2025 • Tỷ lệ 70/30 (±5%)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#faf8f6] p-1 rounded-md border border-[#e8ddd6] gap-1 font-semibold text-[11px]">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'matrix'
                ? 'bg-[#59080b] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#59080b]'
            }`}
          >
            1. Bảng Ma Trận
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 ${
              activeTab === 'questions'
                ? 'bg-[#59080b] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#59080b]'
            }`}
          >
            <span>2. Danh Sách Câu Hỏi</span>
            {assignedCount > 0 && (
              <span className="bg-[#f0a500] text-stone-900 rounded-full px-1.5 py-0.2 text-[10px]">
                {assignedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('shuffle')}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 ${
              activeTab === 'shuffle'
                ? 'bg-[#59080b] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#59080b]'
            }`}
          >
            <span>3. Trộn Đề & Đáp Án</span>
            {shuffleResult && (
              <span className="bg-emerald-600 text-white rounded-full px-1.5 py-0.2 text-[10px]">
                {shuffleResult.totalVariants} mã
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('saved');
              fetchSavedMatrices();
            }}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'saved'
                ? 'bg-[#59080b] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#59080b]'
            }`}
          >
            Ma Trận Đã Lưu
          </button>
        </div>
      </div>

      {/* ─── 1. FORM CREATE / CONFIGURE MATRIX ─── */}
      <div className="bg-white rounded-lg border border-[#e8ddd6] overflow-hidden shadow-sm">
        <div className="bg-[#59080b] text-white px-4 py-2 font-bold text-sm tracking-wide flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚙️</span>
            <span>Cấu Hình Thông Số Ma Trận Đề</span>
          </div>
          <span className="text-[11px] bg-white/20 text-amber-200 px-2.5 py-0.5 rounded font-mono">
            Tổng cộng: {totalQuestions} câu
          </span>
        </div>

        <div className="p-3.5 space-y-3 text-xs bg-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Matrix Name */}
            <div className="md:col-span-5 space-y-1">
              <label className="font-bold text-stone-700 flex items-center gap-1">
                <span>Tên ma trận đề thi:</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={matrixName}
                onChange={(e) => setMatrixName(e.target.value)}
                placeholder="VD: Ma trận đề thi giữa kỳ 1 Vật lý 12..."
                className="w-full px-2.5 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b] focus:ring-1 focus:ring-[#59080b]"
              />
            </div>

            {/* Grade Selector */}
            <div className="md:col-span-2 space-y-1">
              <label className="font-bold text-stone-700">Khối lớp:</label>
              <div className="flex rounded border border-[#e8ddd6] overflow-hidden">
                {[10, 11, 12].map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGrade(g);
                      if (taxonomy.length > 0) {
                        const newRows = initializeChapterRows(g, taxonomy);
                        setChapterRows(newRows);
                        handleCreateMatrix(g, template, newRows);
                      }
                    }}
                    className={`flex-1 py-1.5 text-center font-bold text-xs transition ${
                      grade === g
                        ? 'bg-[#59080b] text-white'
                        : 'bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    Lớp {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selector */}
            <div className="md:col-span-3 space-y-1">
              <label className="font-bold text-stone-700">Mẫu ma trận:</label>
              <select
                value={template}
                onChange={(e) => {
                  const val = e.target.value as 'THPTQG_2025' | 'THPTQG_LEGACY' | 'CUSTOM';
                  setTemplate(val);
                  handleCreateMatrix(grade, val);
                }}
                className="w-full px-2.5 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b] bg-white font-medium"
              >
                <option value="THPTQG_2025">
                  THPTQG 2025 (28 câu = 18TN + 4ĐS + 6TLN)
                </option>
                <option value="THPTQG_LEGACY">
                  Cũ / Kiểm tra (22 câu = 12TN + 4ĐS + 6TLN)
                </option>
                <option value="CUSTOM">Tùy chỉnh số câu theo yêu cầu</option>
              </select>
            </div>

            {/* Reset / Khởi tạo button */}
            <div className="md:col-span-2">
              <button
                onClick={() => handleCreateMatrix(grade, template)}
                disabled={loading}
                className="w-full py-1.5 px-3 rounded bg-stone-100 hover:bg-stone-200 border border-[#e8ddd6] text-[#59080b] font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>🔄</span>
                <span>Khởi tạo lại</span>
              </button>
            </div>
          </div>

          {/* Custom Counts Inputs (Only when CUSTOM) */}
          {template === 'CUSTOM' && (
            <div className="p-2.5 bg-[#fff8eb] rounded border border-[#f0a500]/40 flex flex-wrap items-center gap-4 text-xs">
              <span className="font-bold text-[#59080b]">Số câu tùy chỉnh:</span>
              <div className="flex items-center gap-1.5">
                <span>Trắc nghiệm 4 PA:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={customMC}
                  onChange={(e) => setCustomMC(parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-[#e8ddd6] rounded text-center bg-white font-bold"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>Đúng/Sai:</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={customTF}
                  onChange={(e) => setCustomTF(parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-[#e8ddd6] rounded text-center bg-white font-bold"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>Trả lời ngắn:</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={customSA}
                  onChange={(e) => setCustomSA(parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-[#e8ddd6] rounded text-center bg-white font-bold"
                />
              </div>
              <button
                onClick={() => handleCreateMatrix(grade, 'CUSTOM')}
                className="px-2.5 py-1 bg-[#59080b] text-white rounded font-bold hover:bg-[#6e0b10]"
              >
                Cập nhật cấu hình
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. ACTION BUTTONS & 70/30 RATIO INDICATOR ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* Action Buttons Toolbar */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-[#e8ddd6] p-3 shadow-sm space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Hành động chính trên ma trận</span>
              <span className="text-[#59080b] font-mono">
                {tableTotals.grandTotal} / {totalQuestions} câu đã phân bổ
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Button 1: Auto-distribute */}
              <button
                onClick={handleAutoDistribute}
                disabled={loading}
                className="p-2 rounded border border-[#59080b] bg-[#59080b] text-white hover:bg-[#6e0b10] transition font-bold text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-50 shadow-sm"
              >
                <span className="text-base">⚡</span>
                <span>Tự động phân bổ</span>
              </button>

              {/* Button 2: Validate 70/30 */}
              <button
                onClick={handleValidate}
                disabled={loading}
                className="p-2 rounded border border-[#f0a500] bg-[#fff8eb] text-stone-800 hover:bg-[#fef3d6] transition font-bold text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-50 shadow-sm"
              >
                <span className="text-base">⚖️</span>
                <span>Kiểm tra 70/30</span>
              </button>

              {/* Button 3: Auto-fill questions */}
              <button
                onClick={handleAutoFill}
                disabled={loading}
                className="p-2 rounded border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 transition font-bold text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-50 shadow-sm"
              >
                <span className="text-base">🎯</span>
                <span>Tự động chọn câu</span>
              </button>

              {/* Button 4: Save Matrix */}
              <button
                onClick={handleSaveMatrix}
                disabled={loading}
                className="p-2 rounded border border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-100 transition font-bold text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-50 shadow-sm"
              >
                <span className="text-base">💾</span>
                <span>Lưu ma trận</span>
              </button>
            </div>
          </div>

          {/* Quick preset selector for auto-distribute */}
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-stone-600">
            <span className="font-semibold text-stone-500">Chế độ phân bổ tự động:</span>
            <div className="flex items-center gap-1">
              {[
                { id: '70_30_balanced', label: 'Cân bằng (chuẩn BGD)' },
                { id: '70_30_easy', label: 'Dễ (nhiều NB)' },
                { id: '70_30_hard', label: 'Khó (nhiều VDC)' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setAutoDistributePreset(p.id as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    autoDistributePreset === p.id
                      ? 'bg-[#59080b] text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 70/30 Ratio Indicator Card */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-[#e8ddd6] p-3 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#59080b] text-xs uppercase tracking-wide">
                Đánh Giá Tỷ Lệ 70/30
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  validation?.is7030Valid || tableTotals.is7030
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {validation?.is7030Valid || tableTotals.is7030
                  ? '✅ ĐẠT CHUẨN 70/30 (±5%)'
                  : '⚠️ CHƯA ĐẠT CHUẨN'}
              </span>
            </div>

            {/* Split Progress Bar */}
            <div className="space-y-1">
              <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden flex border border-stone-200">
                <div
                  style={{ width: `${Math.min(100, tableTotals.basicRatio)}%` }}
                  className="bg-[#59080b] h-full flex items-center justify-center text-[9px] text-white font-bold transition-all duration-300"
                  title={`Nhận biết + Thông hiểu: ${tableTotals.basicRatio}%`}
                >
                  {tableTotals.basicRatio > 15 ? `${tableTotals.basicRatio}%` : ''}
                </div>
                <div
                  style={{ width: `${Math.min(100, tableTotals.advancedRatio)}%` }}
                  className="bg-[#f0a500] h-full flex items-center justify-center text-[9px] text-stone-900 font-bold transition-all duration-300"
                  title={`Vận dụng + VDC: ${tableTotals.advancedRatio}%`}
                >
                  {tableTotals.advancedRatio > 15 ? `${tableTotals.advancedRatio}%` : ''}
                </div>
              </div>

              {/* Progress Bar Labels */}
              <div className="flex justify-between text-[10px] font-semibold text-stone-600">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#59080b] inline-block" />
                  <span>
                    NB + TH: <strong className="text-stone-900">{tableTotals.basicTotal} câu</strong> ({tableTotals.basicRatio}%)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f0a500] inline-block" />
                  <span>
                    VD + VDC: <strong className="text-stone-900">{tableTotals.advancedTotal} câu</strong> ({tableTotals.advancedRatio}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Feedback Messages */}
          <div className="pt-2 border-t border-stone-100 text-[11px] space-y-0.5">
            {validation?.messages && validation.messages.length > 0 ? (
              validation.messages.map((msg, i) => (
                <div key={i} className="text-stone-600 leading-tight">
                  {msg}
                </div>
              ))
            ) : (
              <div className="text-stone-500 italic">
                Mục tiêu chuẩn: Nhận biết + Thông hiểu = 65% – 75% • Vận dụng + VDC = 25% – 35%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── TAB CONTENT 1: BẢNG MA TRẬN PHÂN BỔ ─── */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#e8ddd6] overflow-hidden shadow-sm">
            {/* Table Header Banner */}
            <div className="bg-[#59080b] text-white px-4 py-2 font-bold text-xs tracking-wider uppercase flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>📋</span>
                <span>Ma Trận Phân Bổ Kiến Thức & Mức Độ Nhận Thức</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] normal-case font-normal text-amber-200">
                <span>💡 Click vào ô để nhập số lượng câu hỏi</span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  {/* Super Header Row */}
                  <tr className="bg-stone-100 text-stone-800 border-b border-[#e8ddd6] font-bold text-[11px] text-center">
                    <th rowSpan={2} className="p-2 border-r border-[#e8ddd6] w-10">
                      TT
                    </th>
                    <th rowSpan={2} className="p-2 border-r border-[#e8ddd6] min-w-[220px] text-left">
                      Chủ đề / Chương kiến thức
                    </th>
                    <th colSpan={4} className="p-1.5 border-r border-[#e8ddd6] bg-amber-50/70 text-[#59080b]">
                      Phần I. Trắc nghiệm 4 lựa chọn ({tableTotals.sumMC}/{targetMC} câu)
                    </th>
                    <th colSpan={4} className="p-1.5 border-r border-[#e8ddd6] bg-rose-50/50 text-[#59080b]">
                      Phần II. Đúng / Sai ({tableTotals.sumTF}/{targetTF} câu)
                    </th>
                    <th colSpan={4} className="p-1.5 border-r border-[#e8ddd6] bg-sky-50/50 text-[#59080b]">
                      Phần III. Trả lời ngắn ({tableTotals.sumSA}/{targetSA} câu)
                    </th>
                    <th rowSpan={2} className="p-2 border-r border-[#e8ddd6] w-16 bg-stone-100">
                      Tổng câu
                    </th>
                    <th rowSpan={2} className="p-2 w-14 bg-stone-100">
                      Tỷ lệ %
                    </th>
                  </tr>

                  {/* Sub Header Row: Difficulties */}
                  <tr className="bg-stone-50 text-stone-600 border-b border-[#e8ddd6] text-[10px] font-bold text-center">
                    {/* Phần I */}
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-amber-50/40" title="Nhận biết">
                      M1 (NB)
                    </th>
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-amber-50/40" title="Thông hiểu">
                      M2 (TH)
                    </th>
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-amber-50/40" title="Vận dụng">
                      M3 (VD)
                    </th>
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-amber-50/40" title="Vận dụng cao">
                      M4 (VDC)
                    </th>

                    {/* Phần II */}
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-rose-50/30" title="Nhận biết">
                      M1 (NB)
                    </th>
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-rose-50/30" title="Thông hiểu">
                      M2 (TH)
                    </th>
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-rose-50/30" title="Vận dụng">
                      M3 (VD)
                    </th>
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-rose-50/30" title="Vận dụng cao">
                      M4 (VDC)
                    </th>

                    {/* Phần III */}
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-sky-50/30" title="Nhận biết">
                      M1 (NB)
                    </th>
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-sky-50/30" title="Thông hiểu">
                      M2 (TH)
                    </th>
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-sky-50/30" title="Vận dụng">
                      M3 (VD)
                    </th>
                    <th className="p-1 border-r border-[#e8ddd6] w-11 bg-sky-50/30" title="Vận dụng cao">
                      M4 (VDC)
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {chapterRows.map((row, rIdx) => {
                    const rowMC = row.mc.reduce((a, b) => a + b, 0);
                    const rowTF = row.tf.reduce((a, b) => a + b, 0);
                    const rowSA = row.sa.reduce((a, b) => a + b, 0);
                    const rowTotal = rowMC + rowTF + rowSA;
                    const rowPct = tableTotals.grandTotal > 0
                      ? Math.round((rowTotal / tableTotals.grandTotal) * 100)
                      : 0;

                    return (
                      <tr
                        key={row.chapterId}
                        className={`border-b border-[#e8ddd6] hover:bg-stone-50/80 transition ${
                          rIdx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f6]/50'
                        }`}
                      >
                        {/* TT */}
                        <td className="p-2 border-r border-[#e8ddd6] text-center font-mono text-stone-500 font-bold">
                          {rIdx + 1}
                        </td>

                        {/* Chapter Name */}
                        <td className="p-2 border-r border-[#e8ddd6] font-semibold text-stone-800">
                          <div>{row.chapterName}</div>
                          {row.topics.length > 0 && (
                            <div className="text-[10px] text-stone-400 font-normal truncate max-w-xs">
                              {row.topics.length} bài: {row.topics.map((t) => t.name).join(', ')}
                            </div>
                          )}
                        </td>

                        {/* Phần I: MC */}
                        {[0, 1, 2, 3].map((dIdx) => (
                          <td key={`mc-${dIdx}`} className="p-1 border-r border-[#e8ddd6] text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={row.mc[dIdx] || ''}
                              onChange={(e) =>
                                handleCellChange(rIdx, 'mc', dIdx, parseInt(e.target.value) || 0)
                              }
                              placeholder="0"
                              className={`w-9 py-1 text-center font-bold text-xs rounded border transition ${
                                row.mc[dIdx] > 0
                                  ? 'bg-[#fff8eb] text-[#59080b] border-[#f0a500] font-black'
                                  : 'border-transparent hover:border-stone-200 text-stone-400'
                              } focus:bg-white focus:border-[#59080b] focus:outline-none`}
                            />
                          </td>
                        ))}

                        {/* Phần II: TF */}
                        {[0, 1, 2, 3].map((dIdx) => (
                          <td key={`tf-${dIdx}`} className="p-1 border-r border-[#e8ddd6] text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={row.tf[dIdx] || ''}
                              onChange={(e) =>
                                handleCellChange(rIdx, 'tf', dIdx, parseInt(e.target.value) || 0)
                              }
                              placeholder="0"
                              className={`w-9 py-1 text-center font-bold text-xs rounded border transition ${
                                row.tf[dIdx] > 0
                                  ? 'bg-rose-50 text-rose-800 border-rose-300 font-black'
                                  : 'border-transparent hover:border-stone-200 text-stone-400'
                              } focus:bg-white focus:border-[#59080b] focus:outline-none`}
                            />
                          </td>
                        ))}

                        {/* Phần III: SA */}
                        {[0, 1, 2, 3].map((dIdx) => (
                          <td key={`sa-${dIdx}`} className="p-1 border-r border-[#e8ddd6] text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={row.sa[dIdx] || ''}
                              onChange={(e) =>
                                handleCellChange(rIdx, 'sa', dIdx, parseInt(e.target.value) || 0)
                              }
                              placeholder="0"
                              className={`w-9 py-1 text-center font-bold text-xs rounded border transition ${
                                row.sa[dIdx] > 0
                                  ? 'bg-sky-50 text-sky-800 border-sky-300 font-black'
                                  : 'border-transparent hover:border-stone-200 text-stone-400'
                              } focus:bg-white focus:border-[#59080b] focus:outline-none`}
                            />
                          </td>
                        ))}

                        {/* Row Total */}
                        <td className="p-2 border-r border-[#e8ddd6] text-center font-bold text-stone-800 bg-stone-50/50">
                          {rowTotal}
                        </td>

                        {/* Row Pct */}
                        <td className="p-2 text-center font-mono text-[11px] text-stone-500">
                          {rowPct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Footer Totals */}
                <tfoot>
                  {/* Row 1: Column Totals for Each Cell */}
                  <tr className="bg-stone-100 text-stone-800 font-bold border-t-2 border-[#59080b]">
                    <td colSpan={2} className="p-2.5 border-r border-[#e8ddd6] text-right uppercase text-[11px]">
                      Tổng số câu theo mức độ:
                    </td>

                    {/* MC Totals */}
                    {tableTotals.colMC.map((v, i) => (
                      <td key={`tot-mc-${i}`} className="p-1.5 border-r border-[#e8ddd6] text-center text-[#59080b] font-black">
                        {v}
                      </td>
                    ))}

                    {/* TF Totals */}
                    {tableTotals.colTF.map((v, i) => (
                      <td key={`tot-tf-${i}`} className="p-1.5 border-r border-[#e8ddd6] text-center text-[#59080b] font-black">
                        {v}
                      </td>
                    ))}

                    {/* SA Totals */}
                    {tableTotals.colSA.map((v, i) => (
                      <td key={`tot-sa-${i}`} className="p-1.5 border-r border-[#e8ddd6] text-center text-[#59080b] font-black">
                        {v}
                      </td>
                    ))}

                    {/* Grand Total */}
                    <td className="p-2 border-r border-[#e8ddd6] text-center text-[#59080b] text-sm font-black bg-amber-100/50">
                      {tableTotals.grandTotal}
                    </td>

                    <td className="p-2 text-center text-stone-700 font-bold text-[11px]">
                      100%
                    </td>
                  </tr>

                  {/* Row 2: Format Subtotals & Target Comparison */}
                  <tr className="bg-[#fff8eb] text-stone-800 text-[11px] border-t border-[#e8ddd6]">
                    <td colSpan={2} className="p-2 border-r border-[#e8ddd6] text-right font-bold text-[#59080b]">
                      Tổng hợp từng phần:
                    </td>
                    <td colSpan={4} className="p-2 border-r border-[#e8ddd6] text-center font-semibold">
                      Phần I: <strong>{tableTotals.sumMC}</strong> / {targetMC} câu
                      {tableTotals.sumMC === targetMC ? ' (Đủ)' : ` (${tableTotals.sumMC > targetMC ? 'Thừa' : 'Thiếu'} ${Math.abs(tableTotals.sumMC - targetMC)})`}
                    </td>
                    <td colSpan={4} className="p-2 border-r border-[#e8ddd6] text-center font-semibold">
                      Phần II: <strong>{tableTotals.sumTF}</strong> / {targetTF} câu
                      {tableTotals.sumTF === targetTF ? ' (Đủ)' : ` (${tableTotals.sumTF > targetTF ? 'Thừa' : 'Thiếu'} ${Math.abs(tableTotals.sumTF - targetTF)})`}
                    </td>
                    <td colSpan={4} className="p-2 border-r border-[#e8ddd6] text-center font-semibold">
                      Phần III: <strong>{tableTotals.sumSA}</strong> / {targetSA} câu
                      {tableTotals.sumSA === targetSA ? ' (Đủ)' : ` (${tableTotals.sumSA > targetSA ? 'Thừa' : 'Thiếu'} ${Math.abs(tableTotals.sumSA - targetSA)})`}
                    </td>
                    <td colSpan={2} className="p-2 text-center font-bold text-[#59080b]">
                      {tableTotals.grandTotal === totalQuestions ? '✅ Đủ số câu' : `⚠️ Cần ${totalQuestions} câu`}
                    </td>
                  </tr>

                  {/* Row 3: 70/30 Breakdown Summary */}
                  <tr className="bg-stone-50 text-[11px] text-stone-700 border-t border-[#e8ddd6]">
                    <td colSpan={2} className="p-2 border-r border-[#e8ddd6] text-right font-bold text-[#59080b]">
                      Tổng hợp 4 mức độ:
                    </td>
                    <td colSpan={6} className="p-2 border-r border-[#e8ddd6]">
                      <div className="flex items-center justify-around">
                        <span>Nhận biết (M1): <strong>{tableTotals.m1}</strong> câu</span>
                        <span>Thông hiểu (M2): <strong>{tableTotals.m2}</strong> câu</span>
                        <span className="text-[#59080b] font-bold">
                          =&gt; NB+TH = {tableTotals.basicTotal} câu ({tableTotals.basicRatio}%)
                        </span>
                      </div>
                    </td>
                    <td colSpan={6} className="p-2 border-r border-[#e8ddd6]">
                      <div className="flex items-center justify-around">
                        <span>Vận dụng (M3): <strong>{tableTotals.m3}</strong> câu</span>
                        <span>Vận dụng cao (M4): <strong>{tableTotals.m4}</strong> câu</span>
                        <span className="text-[#f0a500] font-bold">
                          =&gt; VD+VDC = {tableTotals.advancedTotal} câu ({tableTotals.advancedRatio}%)
                        </span>
                      </div>
                    </td>
                    <td colSpan={2} className="p-2 text-center font-bold">
                      {tableTotals.is7030 ? (
                        <span className="text-emerald-700">Đạt 70/30</span>
                      ) : (
                        <span className="text-amber-700">Chưa đạt</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT 2: DANH SÁCH CÂU HỎI ĐÃ CHỌN ─── */}
      {activeTab === 'questions' && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg border border-[#e8ddd6] overflow-hidden shadow-sm">
            <div className="bg-[#59080b] text-white px-4 py-2 font-bold text-xs tracking-wider uppercase flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span>Danh Sách Câu Hỏi Theo Ma Trận Đề ({assignedCount}/{matrix?.slots.length || 0} câu)</span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 text-[11px] normal-case">
                {[
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
                  { id: 'TRUE_FALSE', label: 'Đúng/Sai' },
                  { id: 'SHORT_ANSWER', label: 'Trả lời ngắn' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setQuestionFilterFormat(f.id)}
                    className={`px-2.5 py-0.5 rounded transition ${
                      questionFilterFormat === f.id
                        ? 'bg-[#f0a500] text-stone-900 font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Grid / List */}
            <div className="p-3.5 space-y-3">
              {filteredSlots.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  Chưa có câu hỏi nào trong danh sách. Hãy nhấn &quot;Tự động chọn câu&quot; để tải câu hỏi từ ngân hàng!
                </div>
              ) : (
                filteredSlots.map((slot) => {
                  const q = slot.questionId ? questionsMap[slot.questionId] : null;
                  const isSolutionOpen = slot.questionId ? expandedSolutions[slot.questionId] : false;

                  return (
                    <div
                      key={`slot-${slot.position}`}
                      className="bg-white rounded-lg border border-[#e8ddd6] p-3 shadow-xs hover:border-[#f0a500]/60 transition space-y-2 text-xs"
                    >
                      {/* Slot Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#59080b] text-white font-bold px-2 py-0.5 rounded text-[11px]">
                            Câu {slot.position}
                          </span>

                          {slot.questionCode ? (
                            <span className="font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded text-[10px] font-bold">
                              {slot.questionCode}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic text-[11px]">
                              Chưa gán câu hỏi cụ thể
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              slot.format === 'MULTIPLE_CHOICE'
                                ? 'bg-amber-100 text-amber-900'
                                : slot.format === 'TRUE_FALSE'
                                ? 'bg-rose-100 text-rose-900'
                                : 'bg-sky-100 text-sky-900'
                            }`}
                          >
                            {slot.format === 'MULTIPLE_CHOICE'
                              ? 'Trắc nghiệm 4 PA'
                              : slot.format === 'TRUE_FALSE'
                              ? 'Đúng / Sai'
                              : 'Trả lời ngắn'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              slot.difficulty === 1
                                ? 'bg-emerald-100 text-emerald-800'
                                : slot.difficulty === 2
                                ? 'bg-blue-100 text-blue-800'
                                : slot.difficulty === 3
                                ? 'bg-orange-100 text-orange-800'
                                : slot.difficulty === 4
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {slot.difficulty === 1 && 'Mức 1: Nhận biết'}
                            {slot.difficulty === 2 && 'Mức 2: Thông hiểu'}
                            {slot.difficulty === 3 && 'Mức 3: Vận dụng'}
                            {slot.difficulty === 4 && 'Mức 4: VDC'}
                            {!slot.difficulty && 'Chưa chọn mức'}
                          </span>
                        </div>

                        {/* Topic info */}
                        {slot.topicName && (
                          <span className="text-[11px] text-stone-500 italic truncate max-w-xs">
                            📂 {slot.topicName}
                          </span>
                        )}
                      </div>

                      {/* Question Content */}
                      {q ? (
                        <div className="space-y-2">
                          {/* LaTeX Content */}
                          <div className="text-stone-900 font-medium leading-relaxed">
                            <MathRenderer content={q.content} />
                          </div>

                          {/* Options */}
                          {slot.format === 'MULTIPLE_CHOICE' && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                              {Object.entries(q.options).map(([label, optText]) => {
                                const isCorrect = q.correctAnswer === label;
                                return (
                                  <div
                                    key={label}
                                    className={`p-2 rounded border text-xs flex items-start gap-2 ${
                                      isCorrect
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                                        : 'bg-stone-50/50 border-stone-200 text-stone-700'
                                    }`}
                                  >
                                    <span
                                      className={`font-bold w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                                        isCorrect
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-stone-200 text-stone-700'
                                      }`}
                                    >
                                      {label}
                                    </span>
                                    <div className="flex-1">
                                      <MathRenderer content={String(optText)} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* True / False Options */}
                          {slot.format === 'TRUE_FALSE' && q.options && (
                            <div className="space-y-1.5 pt-1">
                              {Object.entries(q.options).map(([subKey, subText]) => {
                                let ansVal = '';
                                if (typeof q.correctAnswer === 'object' && q.correctAnswer !== null) {
                                  ansVal = q.correctAnswer[subKey] ? 'Đúng' : 'Sai';
                                } else if (typeof q.correctAnswer === 'string') {
                                  try {
                                    const parsed = JSON.parse(q.correctAnswer);
                                    ansVal = parsed[subKey] ? 'Đúng' : 'Sai';
                                  } catch {
                                    ansVal = q.correctAnswer;
                                  }
                                }

                                return (
                                  <div
                                    key={subKey}
                                    className="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200 text-xs"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="font-bold text-stone-700">{subKey})</span>
                                      <MathRenderer content={String(subText)} />
                                    </div>
                                    {ansVal && (
                                      <span
                                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                          ansVal === 'Đúng'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {ansVal}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Short Answer */}
                          {slot.format === 'SHORT_ANSWER' && (
                            <div className="p-2 rounded bg-sky-50 border border-sky-200 text-xs flex items-center gap-2">
                              <span className="font-bold text-sky-900">Đáp án chính xác:</span>
                              <span className="font-mono font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-300">
                                {typeof q.correctAnswer === 'string'
                                  ? q.correctAnswer
                                  : JSON.stringify(q.correctAnswer)}
                              </span>
                            </div>
                          )}

                          {/* Solution Toggle */}
                          {q.explanation && (
                            <div className="pt-1">
                              <button
                                onClick={() => {
                                  if (slot.questionId) {
                                    setExpandedSolutions((prev) => ({
                                      ...prev,
                                      [slot.questionId!]: !prev[slot.questionId!],
                                    }));
                                  }
                                }}
                                className="text-[11px] font-bold text-[#59080b] hover:underline flex items-center gap-1"
                              >
                                <span>{isSolutionOpen ? '▼ Ẩn lời giải' : '▶ Xem lời giải chi tiết'}</span>
                              </button>

                              {isSolutionOpen && (
                                <div className="mt-1.5 p-2.5 rounded bg-[#fff8eb] border border-[#f0a500]/40 text-stone-800 text-xs leading-relaxed">
                                  <div className="font-bold text-[#59080b] mb-1">Lời giải:</div>
                                  <MathRenderer content={q.explanation} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded bg-stone-50 border border-dashed border-stone-300 text-center text-stone-400">
                          {slot.questionId
                            ? 'Đang tải nội dung câu hỏi...'
                            : 'Chưa có câu hỏi nào được gán cho slot này. Hãy nhấn nút "Tự động chọn câu" ở trên!'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT 3: TRỘN ĐỀ THI & BẢNG ĐÁP ÁN ─── */}
      {activeTab === 'shuffle' && (
        <div className="space-y-4">
          {/* Shuffle Configuration Box */}
          <div className="bg-white rounded-lg border border-[#e8ddd6] overflow-hidden shadow-sm">
            <div className="bg-[#59080b] text-white px-4 py-2 font-bold text-xs tracking-wider uppercase flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🔀</span>
                <span>Thông Số Trộn Đề Thi (Tạo Nhiều Mã Đề)</span>
              </div>
              <span className="text-[11px] bg-white/20 text-amber-200 px-2 py-0.5 rounded font-mono">
                {assignedCount} câu hỏi sẵn sàng
              </span>
            </div>

            <div className="p-3.5 space-y-3 text-xs bg-white">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5 space-y-1">
                  <label className="font-bold text-stone-700">Tiêu đề đề thi in ấn:</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
                  />
                </div>

                <div className="md:col-span-4 space-y-1">
                  <label className="font-bold text-stone-700">Tên đơn vị / Trường:</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="font-bold text-stone-700">Thời gian (phút):</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={examDuration}
                    onChange={(e) => setExamDuration(parseInt(e.target.value) || 50)}
                    className="w-full px-2.5 py-1.5 border border-[#e8ddd6] rounded text-xs focus:outline-none focus:border-[#59080b]"
                  />
                </div>
              </div>

              {/* Mix Count Selector & Action */}
              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-700">Số lượng mã đề cần tạo:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 4, 6, 8, 12, 24].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setMixCount(cnt)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                          mixCount === cnt
                            ? 'bg-[#59080b] text-white shadow-sm'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                      >
                        {cnt} mã
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleShuffle}
                  disabled={loading || assignedCount === 0}
                  className="px-5 py-2 rounded bg-[#59080b] hover:bg-[#6e0b10] text-white font-bold text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  <span>🔀</span>
                  <span>Bắt đầu trộn {mixCount} mã đề</span>
                </button>
              </div>
            </div>
          </div>

          {/* Shuffle Results Section */}
          {shuffleResult && (
            <div className="space-y-4">
              {/* Variant Selector Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-[#e8ddd6] shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-stone-700 text-xs mr-1">Xem mã đề:</span>
                  {shuffleResult.variants.map((v, idx) => (
                    <button
                      key={v.variantCode}
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`px-3 py-1 rounded font-mono font-bold text-xs transition ${
                        selectedVariantIndex === idx
                          ? 'bg-[#59080b] text-white shadow-sm'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      Mã {v.variantCode}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-stone-100 hover:bg-stone-200 border border-[#e8ddd6] rounded font-bold text-stone-700 text-xs flex items-center gap-1"
                  >
                    <span>🖨️</span>
                    <span>In đề thi</span>
                  </button>
                </div>
              </div>

              {/* Compact Answer Grid */}
              <div className="bg-white rounded-lg border border-[#e8ddd6] overflow-hidden shadow-sm">
                <div className="bg-[#59080b] text-white px-4 py-2 font-bold text-xs tracking-wider uppercase flex items-center justify-between">
                  <span>📊 Bảng Đáp Án Tổng Hợp Các Mã Đề</span>
                  <span className="text-[11px] text-[#f0a500]">
                    {shuffleResult.totalVariants} mã đề • {shuffleResult.totalQuestions} câu
                  </span>
                </div>

                <div className="p-3 overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-stone-100 border-b border-[#e8ddd6] font-bold text-[11px]">
                        <th className="p-2 border-r border-[#e8ddd6] w-12">Câu</th>
                        <th className="p-2 border-r border-[#e8ddd6] w-28">Dạng thức</th>
                        {shuffleResult.variants.map((v) => (
                          <th key={v.variantCode} className="p-2 border-r border-[#e8ddd6] font-mono">
                            Mã {v.variantCode}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shuffleResult.answerGrid.map((row) => (
                        <tr key={row.position} className="border-b border-[#e8ddd6] hover:bg-stone-50">
                          <td className="p-1.5 border-r border-[#e8ddd6] font-bold text-stone-800 bg-stone-50/50">
                            {row.position}
                          </td>
                          <td className="p-1.5 border-r border-[#e8ddd6] text-[10px] text-stone-500 text-left px-2">
                            {row.format === 'MULTIPLE_CHOICE'
                              ? 'Trắc nghiệm'
                              : row.format === 'TRUE_FALSE'
                              ? 'Đúng/Sai'
                              : 'Trả lời ngắn'}
                          </td>
                          {shuffleResult.variants.map((v) => {
                            const ans = row.answers[v.variantCode] || '—';
                            return (
                              <td
                                key={v.variantCode}
                                className="p-1.5 border-r border-[#e8ddd6] font-mono font-bold text-[#59080b]"
                              >
                                {ans}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Shuffled Exam Paper Preview for Selected Variant */}
              {shuffleResult.variants[selectedVariantIndex] && (
                <div className="bg-white rounded-lg border border-[#e8ddd6] p-6 shadow-sm space-y-4 print:p-0 print:border-none">
                  {/* Exam Paper Header */}
                  <div className="border-b-2 border-stone-800 pb-3 flex justify-between items-start">
                    <div className="text-left space-y-0.5">
                      <div className="font-bold uppercase text-xs tracking-wider">{schoolName}</div>
                      <div className="font-bold text-sm text-[#59080b]">{examTitle}</div>
                      <div className="text-xs text-stone-600">
                        Năm học 2024 - 2025 • Môn: Vật lý {grade}
                      </div>
                      <div className="text-xs text-stone-500">
                        Thời gian làm bài: {examDuration} phút (không kể thời gian phát đề)
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="border-2 border-stone-800 px-3 py-1 font-mono font-black text-sm inline-block rounded">
                        MÃ ĐỀ: {shuffleResult.variants[selectedVariantIndex].variantCode}
                      </div>
                      <div className="text-[11px] text-stone-500 italic">
                        Đề thi gồm {shuffleResult.totalQuestions} câu
                      </div>
                    </div>
                  </div>

                  {/* Student Info Box */}
                  <div className="p-2 border border-stone-300 rounded text-xs flex justify-between text-stone-600">
                    <span>Họ và tên thí sinh: ........................................................................</span>
                    <span>Số báo danh: .................................................</span>
                  </div>

                  {/* Questions List for this Variant */}
                  <div className="space-y-4 pt-2">
                    {shuffleResult.variants[selectedVariantIndex].questions.map((q) => (
                      <div key={q.position} className="space-y-1 text-xs">
                        <div className="flex items-start gap-1.5 font-medium leading-relaxed">
                          <span className="font-bold text-stone-900 shrink-0">
                            Câu {q.position}:
                          </span>
                          <div className="flex-1">
                            <MathRenderer content={q.content} />
                          </div>
                        </div>

                        {/* Options */}
                        {q.format === 'MULTIPLE_CHOICE' && q.shuffledOptions && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 pl-4 pt-1">
                            {q.shuffledOptions.map((opt) => (
                              <div key={opt.newLabel} className="flex items-start gap-1.5 text-stone-800">
                                <span className="font-bold text-stone-900">{opt.newLabel}.</span>
                                <MathRenderer content={opt.text} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT 4: DANH SÁCH MA TRẬN ĐÃ LƯU ─── */}
      {activeTab === 'saved' && (
        <div className="bg-white rounded-lg border border-[#e8ddd6] overflow-hidden shadow-sm space-y-3">
          <div className="bg-[#59080b] text-white px-4 py-2 font-bold text-xs tracking-wider uppercase flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>💾</span>
              <span>Ngân Hàng Ma Trận Đã Lưu ({savedMatrices.length} ma trận)</span>
            </div>
            <button
              onClick={fetchSavedMatrices}
              className="text-[11px] bg-white/20 hover:bg-white/30 text-amber-200 px-2.5 py-0.5 rounded font-semibold"
            >
              🔄 Tải lại danh sách
            </button>
          </div>

          <div className="p-3.5">
            {loadingSaved ? (
              <div className="text-center py-10 text-stone-400 text-xs">
                Đang tải danh sách ma trận đã lưu...
              </div>
            ) : savedMatrices.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs space-y-2">
                <div>Chưa có ma trận nào được lưu trong cơ sở dữ liệu.</div>
                <div className="text-[11px] text-stone-500">
                  Hãy thiết lập ma trận và nhấn nút &quot;Lưu ma trận&quot; để lưu lại dùng nhiều lần!
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedMatrices.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-lg border border-[#e8ddd6] bg-white hover:border-[#59080b] shadow-xs hover:shadow transition flex flex-col justify-between space-y-2 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] bg-[#fff8eb] text-[#59080b] px-2 py-0.5 rounded border border-[#f0a500]/30 font-mono">
                          Lớp {m.grade}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm line-clamp-1">{m.name}</h3>
                      <div className="text-[11px] text-stone-500">
                        Cấu trúc: {m.totalQuestions} câu • {m.distribution.examFormat || 'Chuẩn BGD'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400 font-mono">
                        ID: {m.id.substring(0, 8)}...
                      </span>
                      <button
                        onClick={() => handleLoadSavedMatrix(m)}
                        className="px-3 py-1 bg-[#59080b] hover:bg-[#6e0b10] text-white rounded font-bold text-xs transition"
                      >
                        Mở ma trận
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── BOTTOM SECTION: QUICK SHUFFLE TRIGGER ─── */}
      <div className="bg-[#fff8eb] rounded-lg border border-[#f0a500]/40 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="font-bold text-[#59080b] text-sm flex items-center gap-1.5">
            <span>🚀</span>
            <span>Sẵn Sàng Xuất Bản Đề Thi?</span>
          </div>
          <div className="text-stone-600 text-xs">
            Trộn tự động thành nhiều mã đề hoán vị câu hỏi & đáp án theo quy chế thi Bộ GD&ĐT.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (assignedCount === 0) {
                handleAutoFill();
              } else {
                handleShuffle();
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-[#59080b] hover:bg-[#6e0b10] text-white font-bold text-xs rounded shadow transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>🔀</span>
            <span>{assignedCount === 0 ? 'Tự động chọn & Trộn đề' : `Trộn ${mixCount} mã đề ngay`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
