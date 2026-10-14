/**
 * ScisPhy — Matrix Engine
 * 
 * Logic nghiệp vụ cốt lõi cho tạo ma trận đề thi Vật lý chuẩn GDPT 2018/2025.
 * 
 * Cấu trúc đề thi chuẩn Bộ GD&ĐT 2025:
 *   Phần I:  Trắc nghiệm 4 phương án — 18 câu (câu 1–18)
 *   Phần II: Đúng/Sai 4 ý a,b,c,d   — 4 câu  (câu 1–4)
 *   Phần III: Trả lời ngắn            — 6 câu  (câu 1–6)
 *   Tổng: 28 câu
 * 
 * LEGACY (trước 2025): 22 câu = 12 TN + 4 DS + 6 TLN
 * 
 * Quy tắc 70/30:
 *   - 70% nhận biết + thông hiểu (mức 1, 2) — tolerance ±5%
 *   - 30% vận dụng + vận dụng cao (mức 3, 4) — tolerance ±5%
 * 
 * Thuật toán từ MathTIAD:
 *   Math.abs(basicPercent - 70) <= 5
 */

// ===== TYPES =====

export interface MatrixSlot {
  /** Vị trí câu trong đề (1-based) */
  position: number;
  /** Dạng câu hỏi */
  format: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  /** Mức độ nhận thức (1–4), null = chưa chọn */
  difficulty: number | null;
  /** Topic ID đã gán (null = chưa chọn dạng bài) */
  topicId: string | null;
  /** Topic name (display) */
  topicName: string | null;
  /** Question ID nếu đã chọn câu cụ thể */
  questionId: string | null;
  /** Question code (display) */
  questionCode: string | null;
}

export interface MatrixConfig {
  /** Tên ma trận */
  name: string;
  /** Khối lớp (10, 11, 12) */
  grade: number;
  /** Kiểu đề: 'THPTQG_2025' (28 câu) hoặc 'CUSTOM' */
  examFormat: 'THPTQG_2025' | 'THPTQG_LEGACY' | 'CUSTOM';
  /** Số câu từng phần — auto-set nếu examFormat = THPTQG */
  multipleChoiceCount: number;
  trueFalseCount: number;
  shortAnswerCount: number;
  /** Danh sách các slot */
  slots: MatrixSlot[];
}

export interface MatrixValidation {
  /** Có hợp lệ theo quy tắc 70/30 không */
  is7030Valid: boolean;
  /** % nhận biết + thông hiểu */
  basicPercent: number;
  /** % vận dụng + vận dụng cao */
  advancedPercent: number;
  /** Số câu chưa chọn mức độ */
  unassignedCount: number;
  /** Tổng câu đã assign mức */
  assignedCount: number;
  /** Breakdown chi tiết */
  breakdown: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
  /** Độ khó trung bình (1.0–4.0) */
  averageDifficulty: number;
  /** Thông báo lỗi / cảnh báo */
  messages: string[];
}

export interface MatrixGenerateResult {
  success: boolean;
  matrix: MatrixConfig;
  validation: MatrixValidation;
  error?: string;
}

// ===== FACTORY =====

/**
 * Tạo ma trận trống theo format chuẩn THPTQG 2025.
 * 28 câu: 18 TN + 4 ĐS + 6 TLN
 */
export function createEmptyMatrix2025(name: string, grade: number): MatrixConfig {
  const slots: MatrixSlot[] = [];

  // Phần I: 18 Trắc nghiệm
  for (let i = 1; i <= 18; i++) {
    slots.push({
      position: i,
      format: 'MULTIPLE_CHOICE',
      difficulty: null,
      topicId: null,
      topicName: null,
      questionId: null,
      questionCode: null,
    });
  }

  // Phần II: 4 Đúng/Sai
  for (let i = 1; i <= 4; i++) {
    slots.push({
      position: 18 + i,
      format: 'TRUE_FALSE',
      difficulty: null,
      topicId: null,
      topicName: null,
      questionId: null,
      questionCode: null,
    });
  }

  // Phần III: 6 Trả lời ngắn
  for (let i = 1; i <= 6; i++) {
    slots.push({
      position: 22 + i,
      format: 'SHORT_ANSWER',
      difficulty: null,
      topicId: null,
      topicName: null,
      questionId: null,
      questionCode: null,
    });
  }

  return {
    name,
    grade,
    examFormat: 'THPTQG_2025',
    multipleChoiceCount: 18,
    trueFalseCount: 4,
    shortAnswerCount: 6,
    slots,
  };
}

/**
 * Tạo ma trận trống theo format legacy THPTQG (trước 2025).
 * 22 câu: 12 TN + 4 ĐS + 6 TLN
 */
export function createEmptyMatrixLegacy(name: string, grade: number): MatrixConfig {
  const slots: MatrixSlot[] = [];

  for (let i = 1; i <= 12; i++) {
    slots.push({
      position: i,
      format: 'MULTIPLE_CHOICE',
      difficulty: null,
      topicId: null,
      topicName: null,
      questionId: null,
      questionCode: null,
    });
  }

  for (let i = 1; i <= 4; i++) {
    slots.push({
      position: 12 + i,
      format: 'TRUE_FALSE',
      difficulty: null,
      topicId: null,
      topicName: null,
      questionId: null,
      questionCode: null,
    });
  }

  for (let i = 1; i <= 6; i++) {
    slots.push({
      position: 16 + i,
      format: 'SHORT_ANSWER',
      difficulty: null,
      topicId: null,
      topicName: null,
      questionId: null,
      questionCode: null,
    });
  }

  return {
    name,
    grade,
    examFormat: 'THPTQG_LEGACY',
    multipleChoiceCount: 12,
    trueFalseCount: 4,
    shortAnswerCount: 6,
    slots,
  };
}

/**
 * Tạo ma trận tùy chỉnh (custom count)
 */
export function createCustomMatrix(
  name: string,
  grade: number,
  mcCount: number,
  tfCount: number,
  saCount: number
): MatrixConfig {
  const slots: MatrixSlot[] = [];
  let pos = 1;

  for (let i = 0; i < mcCount; i++) {
    slots.push({
      position: pos++,
      format: 'MULTIPLE_CHOICE',
      difficulty: null,
      topicId: null,
      topicName: null,
      questionId: null,
      questionCode: null,
    });
  }

  for (let i = 0; i < tfCount; i++) {
    slots.push({
      position: pos++,
      format: 'TRUE_FALSE',
      difficulty: null,
      topicId: null,
      topicName: null,
      questionId: null,
      questionCode: null,
    });
  }

  for (let i = 0; i < saCount; i++) {
    slots.push({
      position: pos++,
      format: 'SHORT_ANSWER',
      difficulty: null,
      topicId: null,
      topicName: null,
      questionId: null,
      questionCode: null,
    });
  }

  return {
    name,
    grade,
    examFormat: 'CUSTOM',
    multipleChoiceCount: mcCount,
    trueFalseCount: tfCount,
    shortAnswerCount: saCount,
    slots,
  };
}

// ===== VALIDATION =====

/**
 * Đánh giá mức độ đề 70/30 — thuật toán gốc MathTIAD.
 * Tolerance: Math.abs(basicPercent - 70) <= 5
 */
export function validateMatrix7030(matrix: MatrixConfig): MatrixValidation {
  const assigned = matrix.slots.filter((s) => s.difficulty !== null);
  const unassigned = matrix.slots.filter((s) => s.difficulty === null);

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

  // Chỉ validate khi tất cả đã assign
  const is7030Valid = unassigned.length === 0 && Math.abs(basicPercent - 70) <= 5;

  const averageDifficulty =
    totalAssigned > 0
      ? assigned.reduce((sum, s) => sum + (s.difficulty || 0), 0) / totalAssigned
      : 0;

  const messages: string[] = [];

  if (unassigned.length > 0) {
    messages.push(`${unassigned.length} câu chưa chọn mức độ (không tính vào thống kê).`);
  }

  if (totalAssigned > 0 && unassigned.length === 0) {
    if (is7030Valid) {
      messages.push(
        `✅ Đạt chuẩn 70/30: ${basicPercent.toFixed(1)}% nhận biết–thông hiểu / ${advancedPercent.toFixed(1)}% vận dụng–vận dụng cao.`
      );
    } else {
      messages.push(
        `⚠️ Chưa đạt chuẩn 70/30: ${basicPercent.toFixed(1)}% NB–TH / ${advancedPercent.toFixed(1)}% VD–VDC. Yêu cầu: 65–75% NB–TH.`
      );
    }
  }

  if (averageDifficulty > 0) {
    let label = 'Dễ';
    if (averageDifficulty >= 1.5 && averageDifficulty < 2.3) label = 'Trung bình';
    else if (averageDifficulty >= 2.3 && averageDifficulty < 3.0) label = 'Khá';
    else if (averageDifficulty >= 3.0) label = 'Khó';
    messages.push(`📊 Độ khó trung bình: ${averageDifficulty.toFixed(2)} — ${label}`);
  }

  return {
    is7030Valid,
    basicPercent: Math.round(basicPercent * 10) / 10,
    advancedPercent: Math.round(advancedPercent * 10) / 10,
    unassignedCount: unassigned.length,
    assignedCount: totalAssigned,
    breakdown,
    averageDifficulty: Math.round(averageDifficulty * 100) / 100,
    messages,
  };
}

// ===== AUTO-GENERATE =====

/**
 * Input cho auto-generate: Tạo phân bổ mức độ tự động đạt chuẩn 70/30.
 * Thuật toán:
 *   - Tính basicTarget = round(total * 0.7)
 *   - Phân bổ level 1 & 2 sao cho tổng = basicTarget
 *   - Phân bổ level 3 & 4 sao cho tổng = total - basicTarget
 *   - Mặc định: L1:L2 ≈ 40:60 trong basic, L3:L4 ≈ 70:30 trong advanced
 */
export function autoDistributeDifficulty(
  matrix: MatrixConfig,
  preset: '70_30_balanced' | '70_30_hard' | '70_30_easy' = '70_30_balanced'
): MatrixConfig {
  const total = matrix.slots.length;
  const basicTarget = Math.round(total * 0.7);
  const advancedTarget = total - basicTarget;

  let l1Ratio: number, l2Ratio: number, l3Ratio: number, l4Ratio: number;

  switch (preset) {
    case '70_30_easy':
      // Nhiều nhận biết, ít VDC
      l1Ratio = 0.50;
      l2Ratio = 0.50;
      l3Ratio = 0.80;
      l4Ratio = 0.20;
      break;
    case '70_30_hard':
      // Ít nhận biết, nhiều VDC
      l1Ratio = 0.30;
      l2Ratio = 0.70;
      l3Ratio = 0.50;
      l4Ratio = 0.50;
      break;
    case '70_30_balanced':
    default:
      l1Ratio = 0.40;
      l2Ratio = 0.60;
      l3Ratio = 0.70;
      l4Ratio = 0.30;
      break;
  }

  const level1Count = Math.round(basicTarget * l1Ratio);
  const level2Count = basicTarget - level1Count;
  const level3Count = Math.round(advancedTarget * l3Ratio);
  const level4Count = advancedTarget - level3Count;

  // Assign difficulties by format sections in order
  const difficulties: number[] = [];

  // Trộn NB–TH xen kẽ trong mỗi phần format
  const addDifficulties = (count: number, l1: number, l2: number, l3: number, l4: number) => {
    // Build pool cho section này
    const pool: number[] = [];
    for (let i = 0; i < l1; i++) pool.push(1);
    for (let i = 0; i < l2; i++) pool.push(2);
    for (let i = 0; i < l3; i++) pool.push(3);
    for (let i = 0; i < l4; i++) pool.push(4);

    // Pad nếu thiếu (round issue)
    while (pool.length < count) pool.push(2);
    // Trim nếu thừa
    pool.splice(count);

    return pool;
  };

  // Phân bổ theo tỉ lệ trong từng phần format
  const mcSlots = matrix.slots.filter((s) => s.format === 'MULTIPLE_CHOICE').length;
  const tfSlots = matrix.slots.filter((s) => s.format === 'TRUE_FALSE').length;
  const saSlots = matrix.slots.filter((s) => s.format === 'SHORT_ANSWER').length;

  // Tỉ lệ theo format
  const mcRatio = mcSlots / total;
  const tfRatio = tfSlots / total;
  const saRatio = saSlots / total;

  const mcDiffs = addDifficulties(
    mcSlots,
    Math.round(level1Count * mcRatio),
    Math.round(level2Count * mcRatio),
    Math.round(level3Count * mcRatio),
    Math.round(level4Count * mcRatio)
  );

  const tfDiffs = addDifficulties(
    tfSlots,
    Math.round(level1Count * tfRatio),
    Math.round(level2Count * tfRatio),
    Math.round(level3Count * tfRatio),
    Math.round(level4Count * tfRatio)
  );

  const saDiffs = addDifficulties(
    saSlots,
    Math.round(level1Count * saRatio),
    Math.round(level2Count * saRatio),
    Math.round(level3Count * saRatio),
    Math.round(level4Count * saRatio)
  );

  difficulties.push(...mcDiffs, ...tfDiffs, ...saDiffs);

  // Assign to slots
  const updatedSlots = matrix.slots.map((slot, idx) => ({
    ...slot,
    difficulty: difficulties[idx] ?? 2,
  }));

  return { ...matrix, slots: updatedSlots };
}

// ===== QUESTION PICKER =====

export interface QuestionCandidate {
  id: string;
  code: string;
  grade: number;
  topicId: string;
  difficulty: number;
  format: string;
}

/**
 * Chọn câu hỏi từ ngân hàng cho 1 slot.
 * Ưu tiên: đúng format + difficulty + topicId (nếu có).
 * Fallback: đúng format + difficulty, bất kỳ topic.
 */
export function pickQuestionForSlot(
  slot: MatrixSlot,
  candidates: QuestionCandidate[],
  usedIds: Set<string>
): QuestionCandidate | null {
  if (!slot.difficulty) return null;

  // Filter chưa dùng
  const available = candidates.filter((q) => !usedIds.has(q.id));

  // Exact match: format + difficulty + topic
  if (slot.topicId) {
    const exact = available.filter(
      (q) =>
        q.format === slot.format &&
        q.difficulty === slot.difficulty &&
        q.topicId === slot.topicId
    );
    if (exact.length > 0) {
      return exact[Math.floor(Math.random() * exact.length)];
    }
  }

  // Match format + difficulty (any topic)
  const byFormatDiff = available.filter(
    (q) => q.format === slot.format && q.difficulty === slot.difficulty
  );
  if (byFormatDiff.length > 0) {
    return byFormatDiff[Math.floor(Math.random() * byFormatDiff.length)];
  }

  // Fallback: same format, ±1 difficulty
  const byFormatNear = available.filter(
    (q) =>
      q.format === slot.format &&
      slot.difficulty !== null &&
      Math.abs(q.difficulty - slot.difficulty) <= 1
  );
  if (byFormatNear.length > 0) {
    return byFormatNear[Math.floor(Math.random() * byFormatNear.length)];
  }

  // Last resort: same format, any difficulty
  const byFormat = available.filter((q) => q.format === slot.format);
  if (byFormat.length > 0) {
    return byFormat[Math.floor(Math.random() * byFormat.length)];
  }

  return null;
}

/**
 * Auto-fill toàn bộ matrix từ ngân hàng câu hỏi.
 * Returns matrix đã gán questionId + danh sách slot không tìm được câu.
 */
export function autoFillMatrix(
  matrix: MatrixConfig,
  allQuestions: QuestionCandidate[]
): { matrix: MatrixConfig; unfilledPositions: number[] } {
  const usedIds = new Set<string>();
  const unfilled: number[] = [];

  // Filter câu hỏi đúng grade
  const gradeQuestions = allQuestions.filter((q) => q.grade === matrix.grade);

  const updatedSlots = matrix.slots.map((slot) => {
    const picked = pickQuestionForSlot(slot, gradeQuestions, usedIds);
    if (picked) {
      usedIds.add(picked.id);
      return {
        ...slot,
        questionId: picked.id,
        questionCode: picked.code,
      };
    } else {
      unfilled.push(slot.position);
      return slot;
    }
  });

  return {
    matrix: { ...matrix, slots: updatedSlots },
    unfilledPositions: unfilled,
  };
}
