import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/exam-papers — Lấy danh sách đề thi trường/sở
 * Query params: grade, category, q (search), search, page, limit, id
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // If ID is provided, return single paper with questions preview if available
    if (id) {
      const paper = await prisma.examPaper.findUnique({
        where: { id },
      });
      if (!paper) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy đề thi' }, { status: 404 });
      }

      const qIds: string[] = JSON.parse(paper.questionIds || '[]');
      const questions = await prisma.question.findMany({
        where: { id: { in: qIds } },
        include: {
          topic: {
            include: { chapter: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...paper,
          questionIds: qIds,
          tags: paper.tags ? JSON.parse(paper.tags) : [],
          questions,
        },
      });
    }

    const grade = searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined;
    const category = searchParams.get('category') || undefined;
    const q = searchParams.get('q') || searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (grade) where.grade = grade;
    if (category && category !== 'Tất cả') where.category = category;
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
        questionIds: JSON.parse(p.questionIds || '[]'),
        tags: p.tags ? JSON.parse(p.tags) : [],
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
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
    const { title, grade, category, schoolName, province, year, duration, questionIds, totalMC, totalTF, totalSA, tags } = body;

    let parsedQuestionIds: string[] = [];
    if (Array.isArray(questionIds)) {
      parsedQuestionIds = questionIds;
    } else if (typeof questionIds === 'string') {
      try {
        const parsed = JSON.parse(questionIds);
        if (Array.isArray(parsed)) parsedQuestionIds = parsed;
        else parsedQuestionIds = questionIds.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
      } catch {
        parsedQuestionIds = questionIds.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
      }
    }

    if (!title || !grade) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tên đề thi (title) hoặc khối lớp (grade).' },
        { status: 400 }
      );
    }

    // Count formats if questions exist in database
    const questions = parsedQuestionIds.length > 0 ? await prisma.question.findMany({
      where: { id: { in: parsedQuestionIds } },
      select: { format: true },
    }) : [];

    const mcCount = questions.length > 0
      ? questions.filter((q) => q.format === 'MULTIPLE_CHOICE').length
      : (typeof totalMC === 'number' ? totalMC : parseInt(totalMC || '0'));
    const tfCount = questions.length > 0
      ? questions.filter((q) => q.format === 'TRUE_FALSE').length
      : (typeof totalTF === 'number' ? totalTF : parseInt(totalTF || '0'));
    const saCount = questions.length > 0
      ? questions.filter((q) => q.format === 'SHORT_ANSWER').length
      : (typeof totalSA === 'number' ? totalSA : parseInt(totalSA || '0'));

    let parsedTags: string[] = [];
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) parsedTags = parsed;
        else parsedTags = tags.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
      } catch {
        parsedTags = tags.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
      }
    }

    const paper = await prisma.examPaper.create({
      data: {
        title,
        grade: parseInt(grade),
        category: category || 'Trường',
        schoolName: schoolName || null,
        province: province || null,
        year: year || null,
        duration: duration ? parseInt(duration) : 50,
        questionIds: JSON.stringify(parsedQuestionIds),
        totalMC: mcCount,
        totalTF: tfCount,
        totalSA: saCount,
        tags: parsedTags.length > 0 ? JSON.stringify(parsedTags) : null,
      },
    });

    // Log history
    await prisma.workHistory.create({
      data: {
        action: 'create_exam_paper',
        description: `Tạo đề thi "${title}" (${grade}, ${parsedQuestionIds.length} câu)`,
        metadata: JSON.stringify({ examPaperId: paper.id, grade, questionCount: parsedQuestionIds.length }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...paper,
        questionIds: JSON.parse(paper.questionIds || '[]'),
        tags: paper.tags ? JSON.parse(paper.tags) : [],
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/exam-papers — Cập nhật đề thi trường/sở
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, grade, category, schoolName, province, year, duration, questionIds, totalMC, totalTF, totalSA, tags } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID đề thi' }, { status: 400 });
    }

    let parsedQuestionIds: string[] | undefined = undefined;
    if (questionIds !== undefined) {
      if (Array.isArray(questionIds)) {
        parsedQuestionIds = questionIds;
      } else if (typeof questionIds === 'string') {
        try {
          const parsed = JSON.parse(questionIds);
          if (Array.isArray(parsed)) parsedQuestionIds = parsed;
          else parsedQuestionIds = questionIds.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
        } catch {
          parsedQuestionIds = questionIds.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
        }
      }
    }

    let mcCount = totalMC !== undefined ? parseInt(totalMC) : undefined;
    let tfCount = totalTF !== undefined ? parseInt(totalTF) : undefined;
    let saCount = totalSA !== undefined ? parseInt(totalSA) : undefined;

    if (parsedQuestionIds && parsedQuestionIds.length > 0 && (mcCount === undefined || tfCount === undefined || saCount === undefined)) {
      const questions = await prisma.question.findMany({
        where: { id: { in: parsedQuestionIds } },
        select: { format: true },
      });
      if (questions.length > 0) {
        if (mcCount === undefined) mcCount = questions.filter((q) => q.format === 'MULTIPLE_CHOICE').length;
        if (tfCount === undefined) tfCount = questions.filter((q) => q.format === 'TRUE_FALSE').length;
        if (saCount === undefined) saCount = questions.filter((q) => q.format === 'SHORT_ANSWER').length;
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (grade !== undefined) updateData.grade = parseInt(grade);
    if (category !== undefined) updateData.category = category;
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    if (province !== undefined) updateData.province = province;
    if (year !== undefined) updateData.year = year;
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (parsedQuestionIds !== undefined) updateData.questionIds = JSON.stringify(parsedQuestionIds);
    if (mcCount !== undefined) updateData.totalMC = mcCount;
    if (tfCount !== undefined) updateData.totalTF = tfCount;
    if (saCount !== undefined) updateData.totalSA = saCount;
    if (tags !== undefined) {
      let parsedTags: string[] = [];
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string') {
        try {
          const parsed = JSON.parse(tags);
          if (Array.isArray(parsed)) parsedTags = parsed;
          else parsedTags = tags.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
        } catch {
          parsedTags = tags.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
        }
      }
      updateData.tags = JSON.stringify(parsedTags);
    }

    const paper = await prisma.examPaper.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...paper,
        questionIds: JSON.parse(paper.questionIds || '[]'),
        tags: paper.tags ? JSON.parse(paper.tags) : [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/exam-papers — Xóa đề thi trường/sở
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu id đề thi cần xóa.' }, { status: 400 });
    }

    const paper = await prisma.examPaper.delete({
      where: { id },
    });

    // Log history
    await prisma.workHistory.create({
      data: {
        action: 'delete_exam_paper',
        description: `Xóa đề thi "${paper.title}"`,
        metadata: JSON.stringify({ examPaperId: id, title: paper.title }),
      },
    });

    return NextResponse.json({ success: true, data: paper });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
