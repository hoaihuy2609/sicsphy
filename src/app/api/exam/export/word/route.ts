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
      examTitle,
      schoolName,
      grade,
      duration,
    } = body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Thiếu danh sách câu hỏi (questionIds).' },
        { status: 400 }
      );
    }

    // Lấy câu hỏi từ DB (hỗ trợ cả id và mã câu code)
    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { id: { in: questionIds } },
          { code: { in: questionIds } },
        ],
      },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy câu hỏi nào.' },
        { status: 404 }
      );
    }

    // Preserve matrix order (theo id hoặc code)
    const idMap = new Map<string, typeof questions[0]>();
    for (const q of questions) {
      idMap.set(q.id, q);
      idMap.set(q.code, q);
    }
    const seen = new Set<string>();
    const orderedQuestions: typeof questions = [];
    for (const key of questionIds) {
      const q = idMap.get(key);
      if (q && !seen.has(q.id)) {
        seen.add(q.id);
        orderedQuestions.push(q);
      }
    }

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

    const effectiveGrade = grade || orderedQuestions[0]?.grade || 12;
    const effectiveTitle = userConfig?.examTitle || examTitle || 'ĐỀ THI THỬ MÔN VẬT LÝ THPT QUỐC GIA';
    const effectiveSchool = userConfig?.school || schoolName || 'TRƯỜNG THPT';
    const effectiveDuration = userConfig?.duration || (duration ? `${duration} phút` : '50 phút');

    // Config
    const config: ExamDocConfig = {
      department: userConfig?.department || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
      school: effectiveSchool,
      examTitle: effectiveTitle,
      subject: userConfig?.subject || `Vật lý ${effectiveGrade}`,
      duration: effectiveDuration,
      schoolYear: userConfig?.schoolYear || '2024-2025',
      note: userConfig?.note || 'Thí sinh không được sử dụng tài liệu. Giám thị không giải thích gì thêm.',
    };

    // Generate .docx
    const buffer = await generateExamDocx(
      shuffleResult.variants,
      shuffleResult.answerKeys,
      config
    );

    // Lưu vào lịch sử làm việc (WorkHistory)
    try {
      await prisma.workHistory.create({
        data: {
          action: 'export_word',
          description: `Xuất Word: "${effectiveTitle}" (${shuffleResult.totalVariants} mã đề, ${orderedQuestions.length} câu)`,
          metadata: JSON.stringify({
            examTitle: effectiveTitle,
            schoolName: effectiveSchool,
            mixCount: shuffleResult.totalVariants,
            grade: effectiveGrade,
            duration: effectiveDuration,
            questionCount: orderedQuestions.length,
          }),
        },
      });
    } catch (hErr) {
      console.warn('Lỗi ghi workHistory khi xuất word:', hErr);
    }

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
