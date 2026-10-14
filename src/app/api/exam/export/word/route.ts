import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateExamVariants,
  type QuestionData,
} from '@/lib/shuffle-engine';
import { generateExamDocx, type ExamDocConfig } from '@/lib/word-export';

/**
 * POST /api/exam/export/word — Xuất đề thi ra file .docx
 *
 * Body:
 *   - questionIds: string[] — Danh sách question IDs
 *   - mixCount: number — Số mã đề (1–24)
 *   - config: ExamDocConfig — Cấu hình header/footer đề thi
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      questionIds,
      mixCount = 1,
      config: userConfig,
    } = body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Thiếu danh sách câu hỏi (questionIds).' },
        { status: 400 }
      );
    }

    // Lấy câu hỏi từ DB
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy câu hỏi nào.' },
        { status: 404 }
      );
    }

    // Preserve matrix order
    const idOrder = new Map(questionIds.map((id: string, idx: number) => [id, idx]));
    const orderedQuestions = questions.sort(
      (a, b) => (idOrder.get(a.id) || 0) - (idOrder.get(b.id) || 0)
    );

    const questionData: QuestionData[] = orderedQuestions.map((q) => ({
      id: q.id,
      code: q.code,
      format: q.format,
      difficulty: q.difficulty,
      content: q.content,
      tikzCode: q.tikzCode,
      options: q.options ? JSON.parse(q.options) : null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      topicId: q.topicId,
    }));

    // Shuffle
    const shuffleResult = generateExamVariants(questionData, mixCount);

    // Config
    const config: ExamDocConfig = {
      department: userConfig?.department || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
      school: userConfig?.school || 'TRƯỜNG THPT',
      examTitle: userConfig?.examTitle || 'ĐỀ THI THỬ MÔN VẬT LÝ THPT QUỐC GIA',
      subject: userConfig?.subject || 'Vật lý',
      duration: userConfig?.duration || '50 phút',
      schoolYear: userConfig?.schoolYear || '2024-2025',
      note: userConfig?.note || 'Thí sinh không được sử dụng tài liệu. Giám thị không giải thích gì thêm.',
    };

    // Generate .docx
    const buffer = await generateExamDocx(
      shuffleResult.variants,
      shuffleResult.answerKeys,
      config
    );

    // Return as downloadable file
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="ScisPhy_DeThi_${shuffleResult.totalVariants}mde.docx"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Word Export Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
