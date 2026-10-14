import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateExamVariants,
  generateCompactAnswerGrid,
  type QuestionData,
} from '@/lib/shuffle-engine';

/**
 * POST /api/exam/shuffle — Trộn đề thi (tạo nhiều mã đề)
 * 
 * Body:
 *   - questionIds: string[] — Danh sách question IDs (từ matrix hoặc tự chọn)
 *   - mixCount: number — Số mã đề cần tạo (1–24)
 *   - examInfo?: { title, schoolName, duration } — Thông tin đề thi
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionIds, mixCount = 1, examInfo } = body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Thiếu danh sách câu hỏi (questionIds).' },
        { status: 400 }
      );
    }

    if (mixCount < 1 || mixCount > 24) {
      return NextResponse.json(
        { success: false, error: 'Số mã đề phải từ 1 đến 24.' },
        { status: 400 }
      );
    }

    // Lấy chi tiết câu hỏi từ DB
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy câu hỏi nào trong ngân hàng.' },
        { status: 404 }
      );
    }

    // Sắp xếp theo thứ tự trong questionIds (preserve matrix order)
    const idOrder = new Map(questionIds.map((id: string, idx: number) => [id, idx]));
    const orderedQuestions = questions.sort(
      (a, b) => (idOrder.get(a.id) || 0) - (idOrder.get(b.id) || 0)
    );

    // Map sang QuestionData
    const questionData: QuestionData[] = orderedQuestions.map((q) => ({
      id: q.id,
      code: q.code,
      format: q.format,
      difficulty: q.difficulty,
      content: q.content,
      tikzCode: q.tikzCode,
      options: q.options ? JSON.parse(q.options) : null,
      correctAnswer:
        q.format === 'TRUE_FALSE' ? q.correctAnswer : q.correctAnswer,
      explanation: q.explanation,
      topicId: q.topicId,
    }));

    // Shuffle & Generate Variants
    const shuffleResult = generateExamVariants(questionData, mixCount);

    // Answer Grid (compact cho in ấn)
    const answerGrid = generateCompactAnswerGrid(shuffleResult);

    // Lưu exam vào DB (optional)
    let savedExam = null;
    if (examInfo) {
      savedExam = await prisma.exam.create({
        data: {
          title: examInfo.title || 'Đề thi Vật lý',
          grade: orderedQuestions[0]?.grade || 12,
          schoolName: examInfo.schoolName || null,
          duration: examInfo.duration || 50,
          questionIds: JSON.stringify(questionIds),
        },
      });
    }

    return NextResponse.json({
      success: true,
      totalVariants: shuffleResult.totalVariants,
      totalQuestions: questionData.length,
      variants: shuffleResult.variants,
      answerKeys: shuffleResult.answerKeys,
      answerGrid,
      savedExam,
      breakdown: {
        multipleChoice: questionData.filter((q) => q.format === 'MULTIPLE_CHOICE').length,
        trueFalse: questionData.filter((q) => q.format === 'TRUE_FALSE').length,
        shortAnswer: questionData.filter((q) => q.format === 'SHORT_ANSWER').length,
      },
    });
  } catch (error: any) {
    console.error('Shuffle API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
