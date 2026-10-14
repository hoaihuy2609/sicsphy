/**
 * ScisPhy — Exam Shuffle Engine
 *
 * Trộn đề thi: Tạo nhiều mã đề (variants) từ 1 ma trận gốc.
 *
 * Thuật toán lấy từ MathTIAD:
 *   - mixCount: Tối đa 24 mã đề (capped)
 *   - Variant 1: Giữ nguyên thứ tự câu hỏi gốc
 *   - Variant 2+: Hoán vị thứ tự câu hỏi TRONG từng phần (TN, ĐS, TLN riêng)
 *   - Với TN: Hoán vị cả thứ tự đáp án A/B/C/D
 *   - randomVariants: Nếu true → thay thế câu hỏi bằng câu khác cùng topic/difficulty/format
 *   - Output: Danh sách variants + Bảng đáp án tổng hợp
 */

// ===== TYPES =====

export interface ShuffledOption {
  /** Label gốc (A/B/C/D) */
  originalLabel: string;
  /** Label mới sau shuffle */
  newLabel: string;
  /** Nội dung đáp án */
  text: string;
}

export interface ShuffledQuestion {
  /** Vị trí mới trong đề (1-based) */
  position: number;
  /** Vị trí gốc trong ma trận */
  originalPosition: number;
  /** Question ID */
  questionId: string;
  /** Question Code */
  questionCode: string;
  /** Dạng thức */
  format: string;
  /** Mức độ */
  difficulty: number;
  /** Nội dung câu hỏi */
  content: string;
  /** TikZ code nếu có */
  tikzCode?: string | null;
  /** Đáp án đã shuffle (chỉ cho MULTIPLE_CHOICE) */
  shuffledOptions?: ShuffledOption[];
  /** Đáp án đúng (label mới) */
  correctAnswerLabel: string;
  /** Lời giải */
  explanation?: string | null;
}

export interface ExamVariant {
  /** Mã đề (001, 002, ...) */
  variantCode: string;
  /** Số thứ tự variant (1-based) */
  variantNumber: number;
  /** Danh sách câu hỏi đã shuffle */
  questions: ShuffledQuestion[];
}

export interface AnswerKeyEntry {
  /** Vị trí câu trong đề variant */
  position: number;
  /** Mã câu hỏi gốc */
  questionCode: string;
  /** Đáp án đúng (label mới) */
  correctAnswer: string;
  /** Dạng thức */
  format: string;
}

export interface AnswerKey {
  variantCode: string;
  entries: AnswerKeyEntry[];
}

export interface ShuffleResult {
  /** Số mã đề */
  totalVariants: number;
  /** Danh sách variants */
  variants: ExamVariant[];
  /** Bảng đáp án cho mỗi variant */
  answerKeys: AnswerKey[];
}

export interface QuestionData {
  id: string;
  code: string;
  format: string;
  difficulty: number;
  content: string;
  tikzCode?: string | null;
  options?: any;
  correctAnswer: string;
  explanation?: string | null;
  topicId: string;
}

// ===== UTILITIES =====

/** Fisher-Yates shuffle (in-place, returns new array) */
function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Tạo mã đề dạng 3 chữ số: 001, 002, ... */
function formatVariantCode(n: number): string {
  return String(n).padStart(3, '0');
}

// ===== CORE SHUFFLE =====

/**
 * Shuffle đáp án A/B/C/D cho câu trắc nghiệm.
 * Returns: danh sách options đã hoán vị + đáp án đúng mới.
 */
function shuffleMultipleChoiceOptions(
  options: Array<{ id: string; text: string }>,
  correctAnswerOriginal: string
): { shuffledOptions: ShuffledOption[]; newCorrectLabel: string } {
  const labels = ['A', 'B', 'C', 'D'];

  // Tạo indexed array
  const indexed = options.map((opt, idx) => ({
    originalLabel: labels[idx] || opt.id,
    text: opt.text,
    isCorrect: (labels[idx] || opt.id) === correctAnswerOriginal || opt.id === correctAnswerOriginal,
  }));

  // Shuffle
  const shuffled = fisherYatesShuffle(indexed);

  // Assign new labels
  let newCorrectLabel = 'A';
  const shuffledOptions: ShuffledOption[] = shuffled.map((item, idx) => {
    const newLabel = labels[idx];
    if (item.isCorrect) {
      newCorrectLabel = newLabel;
    }
    return {
      originalLabel: item.originalLabel,
      newLabel,
      text: item.text,
    };
  });

  return { shuffledOptions, newCorrectLabel };
}

/**
 * Tạo 1 variant đề thi từ danh sách câu hỏi.
 * 
 * @param questions - Danh sách câu hỏi theo thứ tự gốc
 * @param variantNumber - Số thứ tự variant
 * @param shouldShuffleQuestionOrder - Có hoán vị thứ tự câu không
 * @param shouldShuffleOptions - Có hoán vị đáp án A/B/C/D không
 */
function createVariant(
  questions: QuestionData[],
  variantNumber: number,
  shouldShuffleQuestionOrder: boolean,
  shouldShuffleOptions: boolean
): ExamVariant {
  // Tách theo format sections
  const mcQuestions = questions.filter((q) => q.format === 'MULTIPLE_CHOICE');
  const tfQuestions = questions.filter((q) => q.format === 'TRUE_FALSE');
  const saQuestions = questions.filter((q) => q.format === 'SHORT_ANSWER');

  // Shuffle trong từng section riêng (giữ sections không lẫn nhau)
  const orderedMC = shouldShuffleQuestionOrder ? fisherYatesShuffle(mcQuestions) : [...mcQuestions];
  const orderedTF = shouldShuffleQuestionOrder ? fisherYatesShuffle(tfQuestions) : [...tfQuestions];
  const orderedSA = shouldShuffleQuestionOrder ? fisherYatesShuffle(saQuestions) : [...saQuestions];

  const allOrdered = [...orderedMC, ...orderedTF, ...orderedSA];

  // Map thành ShuffledQuestion
  const shuffledQuestions: ShuffledQuestion[] = allOrdered.map((q, idx) => {
    const originalPosition = questions.indexOf(q) + 1;
    let shuffledOptions: ShuffledOption[] | undefined;
    let correctAnswerLabel = q.correctAnswer;

    if (q.format === 'MULTIPLE_CHOICE' && q.options && shouldShuffleOptions) {
      const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      if (Array.isArray(parsed) && parsed.length >= 2) {
        const result = shuffleMultipleChoiceOptions(parsed, q.correctAnswer);
        shuffledOptions = result.shuffledOptions;
        correctAnswerLabel = result.newCorrectLabel;
      }
    } else if (q.format === 'MULTIPLE_CHOICE' && q.options) {
      // Không shuffle — giữ nguyên nhưng vẫn output options
      const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      const labels = ['A', 'B', 'C', 'D'];
      if (Array.isArray(parsed)) {
        shuffledOptions = parsed.map((opt: any, i: number) => ({
          originalLabel: labels[i] || opt.id,
          newLabel: labels[i] || opt.id,
          text: typeof opt === 'string' ? opt : opt.text,
        }));
      }
    }

    return {
      position: idx + 1,
      originalPosition,
      questionId: q.id,
      questionCode: q.code,
      format: q.format,
      difficulty: q.difficulty,
      content: q.content,
      tikzCode: q.tikzCode,
      shuffledOptions,
      correctAnswerLabel,
      explanation: q.explanation,
    };
  });

  return {
    variantCode: formatVariantCode(variantNumber),
    variantNumber,
    questions: shuffledQuestions,
  };
}

// ===== MAIN API =====

/**
 * Tạo nhiều mã đề (variants) từ 1 bộ câu hỏi gốc.
 *
 * @param questions - Danh sách câu hỏi gốc (đã chọn từ matrix)
 * @param mixCount - Số mã đề cần tạo (1–24, capped tại 24 theo MathTIAD)
 * @returns ShuffleResult với variants + answer keys
 */
export function generateExamVariants(
  questions: QuestionData[],
  mixCount: number
): ShuffleResult {
  // Cap at 24 (MathTIAD spec)
  const actualCount = Math.max(1, Math.min(24, mixCount));
  const variants: ExamVariant[] = [];
  const answerKeys: AnswerKey[] = [];

  for (let v = 1; v <= actualCount; v++) {
    // Variant 1: Giữ nguyên thứ tự gốc, không shuffle options
    // Variant 2+: Shuffle cả thứ tự câu hỏi lẫn options
    const variant = createVariant(
      questions,
      v,
      /* shuffleOrder */ v > 1,
      /* shuffleOptions */ v > 1
    );
    variants.push(variant);

    // Build answer key
    const entries: AnswerKeyEntry[] = variant.questions.map((sq) => ({
      position: sq.position,
      questionCode: sq.questionCode,
      correctAnswer: sq.correctAnswerLabel,
      format: sq.format,
    }));

    answerKeys.push({
      variantCode: variant.variantCode,
      entries,
    });
  }

  return {
    totalVariants: actualCount,
    variants,
    answerKeys,
  };
}

/**
 * Tạo bảng đáp án nhanh (compact grid) cho in ấn.
 * Format: { variantCode: { câu1: 'A', câu2: 'C', ... } }
 */
export function generateCompactAnswerGrid(
  result: ShuffleResult
): Record<string, Record<number, string>> {
  const grid: Record<string, Record<number, string>> = {};

  for (const ak of result.answerKeys) {
    grid[ak.variantCode] = {};
    for (const entry of ak.entries) {
      grid[ak.variantCode][entry.position] = entry.correctAnswer;
    }
  }

  return grid;
}
