import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createEmptyMatrix2025,
  createEmptyMatrixLegacy,
  createCustomMatrix,
  validateMatrix7030,
  autoDistributeDifficulty,
  autoFillMatrix,
  type MatrixConfig,
  type QuestionCandidate,
} from '@/lib/matrix-engine';

/**
 * POST /api/matrix — Tạo / Thao tác ma trận đề
 * 
 * Actions:
 *   - create: Tạo ma trận trống
 *   - validate: Đánh giá 70/30
 *   - auto-distribute: Tự động phân bổ mức độ
 *   - auto-fill: Tự động chọn câu hỏi từ ngân hàng
 *   - save: Lưu ma trận vào DB
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      // ─── 1. TẠO MA TRẬN TRỐNG ───
      case 'create': {
        const { name, grade, examFormat, mcCount, tfCount, saCount } = body;

        if (!name || !grade) {
          return NextResponse.json(
            { success: false, error: 'Thiếu tên ma trận hoặc khối lớp.' },
            { status: 400 }
          );
        }

        let matrix: MatrixConfig;

        if (examFormat === 'THPTQG_2025') {
          matrix = createEmptyMatrix2025(name, grade);
        } else if (examFormat === 'THPTQG_LEGACY') {
          matrix = createEmptyMatrixLegacy(name, grade);
        } else {
          // Custom
          matrix = createCustomMatrix(
            name,
            grade,
            mcCount || 12,
            tfCount || 4,
            saCount || 6
          );
        }

        const validation = validateMatrix7030(matrix);

        return NextResponse.json({
          success: true,
          matrix,
          validation,
          totalSlots: matrix.slots.length,
        });
      }

      // ─── 2. VALIDATE 70/30 ───
      case 'validate': {
        const { matrix } = body as { matrix: MatrixConfig };

        if (!matrix || !matrix.slots) {
          return NextResponse.json(
            { success: false, error: 'Thiếu dữ liệu ma trận.' },
            { status: 400 }
          );
        }

        const validation = validateMatrix7030(matrix);

        return NextResponse.json({
          success: true,
          validation,
        });
      }

      // ─── 3. TỰ ĐỘNG PHÂN BỔ MỨC ĐỘ ───
      case 'auto-distribute': {
        const { matrix, preset } = body as {
          matrix: MatrixConfig;
          preset?: '70_30_balanced' | '70_30_hard' | '70_30_easy';
        };

        if (!matrix || !matrix.slots) {
          return NextResponse.json(
            { success: false, error: 'Thiếu dữ liệu ma trận.' },
            { status: 400 }
          );
        }

        const distributed = autoDistributeDifficulty(matrix, preset || '70_30_balanced');
        const validation = validateMatrix7030(distributed);

        return NextResponse.json({
          success: true,
          matrix: distributed,
          validation,
        });
      }

      // ─── 4. TỰ ĐỘNG CHỌN CÂU HỎI TỪ NGÂN HÀNG ───
      case 'auto-fill': {
        const { matrix } = body as { matrix: MatrixConfig };

        if (!matrix || !matrix.slots) {
          return NextResponse.json(
            { success: false, error: 'Thiếu dữ liệu ma trận.' },
            { status: 400 }
          );
        }

        // Lấy tất cả câu hỏi đúng khối lớp từ DB
        const allQuestions = await prisma.question.findMany({
          where: { grade: matrix.grade },
          select: {
            id: true,
            code: true,
            grade: true,
            topicId: true,
            difficulty: true,
            format: true,
          },
        });

        const candidates: QuestionCandidate[] = allQuestions.map((q) => ({
          id: q.id,
          code: q.code,
          grade: q.grade,
          topicId: q.topicId,
          difficulty: q.difficulty,
          format: q.format,
        }));

        const { matrix: filledMatrix, unfilledPositions } = autoFillMatrix(
          matrix,
          candidates
        );

        const validation = validateMatrix7030(filledMatrix);

        return NextResponse.json({
          success: true,
          matrix: filledMatrix,
          validation,
          unfilledPositions,
          totalCandidates: candidates.length,
          message:
            unfilledPositions.length > 0
              ? `⚠️ ${unfilledPositions.length} câu không tìm được câu hỏi phù hợp: vị trí ${unfilledPositions.join(', ')}`
              : '✅ Đã chọn đủ câu hỏi cho toàn bộ ma trận.',
        });
      }

      // ─── 5. LƯU MA TRẬN VÀO DB ───
      case 'save': {
        const { matrix } = body as { matrix: MatrixConfig };

        if (!matrix || !matrix.name || !matrix.grade) {
          return NextResponse.json(
            { success: false, error: 'Thiếu tên hoặc khối lớp.' },
            { status: 400 }
          );
        }

        const validation = validateMatrix7030(matrix);

        const saved = await prisma.examMatrix.create({
          data: {
            name: matrix.name,
            grade: matrix.grade,
            totalQuestions: matrix.slots.length,
            distribution: JSON.stringify({
              examFormat: matrix.examFormat,
              multipleChoiceCount: matrix.multipleChoiceCount,
              trueFalseCount: matrix.trueFalseCount,
              shortAnswerCount: matrix.shortAnswerCount,
              slots: matrix.slots,
              validation,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          savedMatrix: saved,
          validation,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Action "${action}" không hợp lệ. Dùng: create, validate, auto-distribute, auto-fill, save.`,
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Matrix API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matrix — Lấy danh sách ma trận đã lưu
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade')
      ? parseInt(searchParams.get('grade')!)
      : undefined;

    const matrices = await prisma.examMatrix.findMany({
      where: grade ? { grade } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    const parsed = matrices.map((m) => ({
      id: m.id,
      name: m.name,
      grade: m.grade,
      totalQuestions: m.totalQuestions,
      distribution: JSON.parse(m.distribution),
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: parsed,
      total: parsed.length,
    });
  } catch (error: any) {
    console.error('Matrix GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
