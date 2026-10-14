import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/exam-papers — Lấy danh sách đề thi trường/sở
 * Query params: grade, category, q (search), page, limit
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined;
    const category = searchParams.get('category') || undefined;
    const q = searchParams.get('q') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (grade) where.grade = grade;
    if (category) where.category = category;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { schoolName: { contains: q } },
        { province: { contains: q } },
      ];
    }

    const [papers, total] = await Promise.all([
      prisma.examPaper.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.examPaper.count({ where }),
    ]);

    // Count by category
    const categories = await prisma.examPaper.groupBy({
      by: ['category'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: papers.map((p) => ({
        ...p,
        questionIds: JSON.parse(p.questionIds),
        tags: p.tags ? JSON.parse(p.tags) : [],
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      categories: categories.map((c) => ({ category: c.category, count: c._count })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/exam-papers — Tạo đề thi trường/sở mới
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, grade, category, schoolName, province, year, duration, questionIds, tags } = body;

    if (!title || !grade || !questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { success: false, error: 'Thiếu title, grade, hoặc questionIds.' },
        { status: 400 }
      );
    }

    // Count formats
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { format: true },
    });

    const paper = await prisma.examPaper.create({
      data: {
        title,
        grade,
        category: category || 'Trường',
        schoolName: schoolName || null,
        province: province || null,
        year: year || null,
        duration: duration || 50,
        questionIds: JSON.stringify(questionIds),
        totalMC: questions.filter((q) => q.format === 'MULTIPLE_CHOICE').length,
        totalTF: questions.filter((q) => q.format === 'TRUE_FALSE').length,
        totalSA: questions.filter((q) => q.format === 'SHORT_ANSWER').length,
        tags: tags ? JSON.stringify(tags) : null,
      },
    });

    // Log history
    await prisma.workHistory.create({
      data: {
        action: 'create_exam_paper',
        description: `Tạo đề thi "${title}" (${grade}, ${questions.length} câu)`,
        metadata: JSON.stringify({ examPaperId: paper.id, grade, questionCount: questionIds.length }),
      },
    });

    return NextResponse.json({ success: true, data: paper }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
