import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: true, questions: [] });
    }

    // Clean up IDs
    const cleanIds = ids.map((id: any) => String(id).trim()).filter(Boolean);

    if (cleanIds.length === 0) {
      return NextResponse.json({ success: true, questions: [] });
    }

    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { id: { in: cleanIds } },
          { code: { in: cleanIds } },
        ],
      },
      include: {
        topic: {
          include: {
            chapter: true,
          },
        },
      },
    });

    // Map to preserve order and parse JSON fields
    const map = new Map<string, typeof questions[0]>();
    for (const q of questions) {
      map.set(q.id, q);
      map.set(q.code, q);
    }

    const seen = new Set<string>();
    const ordered: any[] = [];

    for (const key of cleanIds) {
      const q = map.get(key);
      if (q && !seen.has(q.id)) {
        seen.add(q.id);
        ordered.push({
          ...q,
          options: q.options ? JSON.parse(q.options) : null,
          correctAnswer: q.format === 'TRUE_FALSE' ? JSON.parse(q.correctAnswer) : q.correctAnswer,
        });
      }
    }

    return NextResponse.json({
      success: true,
      questions: ordered,
      total: ordered.length,
      notFound: cleanIds.filter((id) => !map.has(id)),
    });
  } catch (error: any) {
    console.error('Batch questions error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
