import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/questions/import — Nhập hàng loạt câu hỏi vào ngân hàng
 * 
 * Body:
 *   - questions: Array<{
 *       code, grade, topicId, difficulty, format,
 *       content, options?, correctAnswer, explanation?,
 *       tikzCode?, source?
 *     }>
 *   - mode: 'insert' | 'upsert' (default: 'insert')
 *     - insert: Bỏ qua câu trùng code
 *     - upsert: Cập nhật nếu code đã tồn tại
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questions, mode = 'insert' } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mảng câu hỏi (questions).' },
        { status: 400 }
      );
    }

    // Validate required fields
    const errors: string[] = [];
    const valid: any[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const missing: string[] = [];
      if (!q.code) missing.push('code');
      if (!q.grade) missing.push('grade');
      if (!q.topicId) missing.push('topicId');
      if (!q.difficulty) missing.push('difficulty');
      if (!q.format) missing.push('format');
      if (!q.content) missing.push('content');
      if (!q.correctAnswer && q.correctAnswer !== 0) missing.push('correctAnswer');

      if (missing.length > 0) {
        errors.push(`Câu ${i + 1} (${q.code || '?'}): thiếu ${missing.join(', ')}`);
      } else {
        valid.push(q);
      }
    }

    // Process valid questions
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const importErrors: string[] = [];

    for (const q of valid) {
      try {
        const data = {
          code: q.code,
          grade: q.grade,
          topicId: q.topicId,
          difficulty: q.difficulty,
          format: q.format,
          content: q.content,
          tikzCode: q.tikzCode || null,
          options: q.options
            ? typeof q.options === 'string'
              ? q.options
              : JSON.stringify(q.options)
            : null,
          correctAnswer:
            typeof q.correctAnswer === 'string'
              ? q.correctAnswer
              : JSON.stringify(q.correctAnswer),
          explanation: q.explanation || null,
          source: q.source || null,
        };

        if (mode === 'upsert') {
          const existing = await prisma.question.findUnique({
            where: { code: q.code },
          });

          if (existing) {
            await prisma.question.update({
              where: { code: q.code },
              data,
            });
            updated++;
          } else {
            await prisma.question.create({ data });
            inserted++;
          }
        } else {
          // insert mode: skip if exists
          const existing = await prisma.question.findUnique({
            where: { code: q.code },
          });

          if (existing) {
            skipped++;
          } else {
            await prisma.question.create({ data });
            inserted++;
          }
        }
      } catch (err: any) {
        importErrors.push(`${q.code}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: questions.length,
        validationErrors: errors.length,
        inserted,
        updated,
        skipped,
        importErrors: importErrors.length,
      },
      validationErrors: errors.length > 0 ? errors : undefined,
      importErrors: importErrors.length > 0 ? importErrors : undefined,
    });
  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
