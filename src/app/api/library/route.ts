import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/library — Module 5: Quản lý nội dung + Lịch sử làm việc
 * 
 * Query params:
 *   - type: 'matrices' | 'exams' | 'papers' | 'history' | 'all' (default: 'all')
 *   - grade: filter by grade
 *   - page, limit
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const grade = searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const result: any = { success: true };

    // Ma trận đã lưu
    if (type === 'all' || type === 'matrices') {
      const [matrices, matrixCount] = await Promise.all([
        prisma.examMatrix.findMany({
          where: grade ? { grade } : undefined,
          orderBy: { createdAt: 'desc' },
          skip: type === 'matrices' ? skip : 0,
          take: type === 'matrices' ? limit : 10,
        }),
        prisma.examMatrix.count({ where: grade ? { grade } : undefined }),
      ]);
      result.matrices = {
        data: matrices.map((m) => ({ ...m, distribution: JSON.parse(m.distribution) })),
        total: matrixCount,
      };
    }

    // Đề thi đã tạo (từ shuffle)
    if (type === 'all' || type === 'exams') {
      const [exams, examCount] = await Promise.all([
        prisma.exam.findMany({
          where: grade ? { grade } : undefined,
          orderBy: { createdAt: 'desc' },
          skip: type === 'exams' ? skip : 0,
          take: type === 'exams' ? limit : 10,
        }),
        prisma.exam.count({ where: grade ? { grade } : undefined }),
      ]);
      result.exams = {
        data: exams.map((e) => ({ ...e, questionIds: JSON.parse(e.questionIds) })),
        total: examCount,
      };
    }

    // Đề thi trường/sở
    if (type === 'all' || type === 'papers') {
      const [papers, paperCount] = await Promise.all([
        prisma.examPaper.findMany({
          where: grade ? { grade } : undefined,
          orderBy: { createdAt: 'desc' },
          skip: type === 'papers' ? skip : 0,
          take: type === 'papers' ? limit : 10,
        }),
        prisma.examPaper.count({ where: grade ? { grade } : undefined }),
      ]);
      result.papers = {
        data: papers.map((p) => ({ ...p, questionIds: JSON.parse(p.questionIds), tags: p.tags ? JSON.parse(p.tags) : [] })),
        total: paperCount,
      };
    }

    // Lịch sử
    if (type === 'all' || type === 'history') {
      const [history, historyCount] = await Promise.all([
        prisma.workHistory.findMany({
          orderBy: { createdAt: 'desc' },
          skip: type === 'history' ? skip : 0,
          take: type === 'history' ? limit : 20,
        }),
        prisma.workHistory.count(),
      ]);
      result.history = {
        data: history.map((h) => ({ ...h, metadata: h.metadata ? JSON.parse(h.metadata) : null })),
        total: historyCount,
      };
    }

    // Stats
    if (type === 'all') {
      const [qCount, matrixCount, examCount, paperCount] = await Promise.all([
        prisma.question.count(),
        prisma.examMatrix.count(),
        prisma.exam.count(),
        prisma.examPaper.count(),
      ]);
      result.stats = {
        totalQuestions: qCount,
        totalMatrices: matrixCount,
        totalExams: examCount,
        totalPapers: paperCount,
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/library — Xóa item theo type + id
 * Body: { type: 'matrix' | 'exam' | 'paper', id: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Thiếu type hoặc id.' }, { status: 400 });
    }

    let deleted: any;
    switch (type) {
      case 'matrix':
        deleted = await prisma.examMatrix.delete({ where: { id } });
        break;
      case 'exam':
        deleted = await prisma.exam.delete({ where: { id } });
        break;
      case 'paper':
        deleted = await prisma.examPaper.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Type không hợp lệ.' }, { status: 400 });
    }

    await prisma.workHistory.create({
      data: {
        action: `delete_${type}`,
        description: `Xóa ${type}: ${deleted.name || deleted.title || id}`,
      },
    });

    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
