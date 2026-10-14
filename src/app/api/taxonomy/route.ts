import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/taxonomy - Lấy cây mục lục khối lớp, chương, bài và số lượng câu hỏi
export async function GET() {
  try {
    const grades = await prisma.grade.findMany({
      include: {
        chapters: {
          orderBy: { order: "asc" },
          include: {
            topics: {
              orderBy: { order: "asc" },
              include: {
                _count: {
                  select: { questions: true },
                },
              },
            },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const totalQuestions = await prisma.question.count();

    // Map dữ liệu để trả về kèm thống kê số lượng câu hỏi
    const data = grades.map((g) => {
      const gradeTotal = g.chapters.reduce(
        (sum, c) => sum + c.topics.reduce((tSum, t) => tSum + t._count.questions, 0),
        0
      );
      return {
        id: g.id,
        name: g.name,
        totalQuestions: gradeTotal,
        chapters: g.chapters.map((c) => ({
          id: c.id,
          name: c.name,
          order: c.order,
          totalQuestions: c.topics.reduce((tSum, t) => tSum + t._count.questions, 0),
          topics: c.topics.map((t) => ({
            id: t.id,
            name: t.name,
            order: t.order,
            totalQuestions: t._count.questions,
          })),
        })),
      };
    });

    return NextResponse.json({
      success: true,
      totalQuestions,
      tree: data,
    });
  } catch (error: any) {
    console.error("Lỗi lấy cây mục lục:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
