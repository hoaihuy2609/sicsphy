import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/questions - Lọc, tìm kiếm và phân trang ngân hàng câu hỏi
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const grade = searchParams.get("grade") ? parseInt(searchParams.get("grade")!) : undefined;
    const chapterId = searchParams.get("chapterId") || undefined;
    const topicId = searchParams.get("topicId") || undefined;
    const difficulty = searchParams.get("difficulty") ? parseInt(searchParams.get("difficulty")!) : undefined;
    const format = searchParams.get("format") || undefined;
    const q = searchParams.get("q") || undefined;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện lọc
    const where: any = {};
    if (grade) where.grade = grade;
    if (topicId) where.topicId = topicId;
    if (chapterId) where.topic = { chapterId };
    if (difficulty) where.difficulty = difficulty;
    if (format) where.format = format;
    if (q) {
      where.OR = [
        { code: { contains: q } },
        { content: { contains: q } },
        { explanation: { contains: q } },
      ];
    }

    // Thực hiện truy vấn danh sách & tổng số
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          topic: {
            include: {
              chapter: true,
            },
          },
        },
        orderBy: { code: "asc" },
        skip,
        take: limit,
      }),
      prisma.question.count({ where }),
    ]);

    // Thống kê theo mức độ & dạng thức (y chang thanh thống kê MathTIAD)
    const [diff1, diff2, diff3, diff4, fmtMC, fmtTF, fmtSA, fmtES] = await Promise.all([
      prisma.question.count({ where: { ...where, difficulty: 1 } }),
      prisma.question.count({ where: { ...where, difficulty: 2 } }),
      prisma.question.count({ where: { ...where, difficulty: 3 } }),
      prisma.question.count({ where: { ...where, difficulty: 4 } }),
      prisma.question.count({ where: { ...where, format: "MULTIPLE_CHOICE" } }),
      prisma.question.count({ where: { ...where, format: "TRUE_FALSE" } }),
      prisma.question.count({ where: { ...where, format: "SHORT_ANSWER" } }),
      prisma.question.count({ where: { ...where, format: "ESSAY" } }),
    ]);

    // Format options JSON string sang object
    const formattedQuestions = questions.map((item) => ({
      ...item,
      options: item.options ? JSON.parse(item.options) : null,
      correctAnswer: item.format === "TRUE_FALSE" ? JSON.parse(item.correctAnswer) : item.correctAnswer,
    }));

    return NextResponse.json({
      success: true,
      data: formattedQuestions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byDifficulty: {
          level1: diff1, // Nhận biết
          level2: diff2, // Thông hiểu
          level3: diff3, // Vận dụng
          level4: diff4, // Vận dụng cao
        },
        byFormat: {
          multipleChoice: fmtMC, // Trắc nghiệm 4 phương án
          trueFalse: fmtTF,      // Đúng/Sai
          shortAnswer: fmtSA,    // Trả lời ngắn
          essay: fmtES,          // Tự luận
        },
        totalSelected: total,
      },
    });
  } catch (error: any) {
    console.error("Lỗi truy vấn câu hỏi:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/questions - Thêm câu hỏi mới vào ngân hàng
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, grade, topicId, difficulty, format, content, tikzCode, options, correctAnswer, explanation, source } = body;

    if (!code || !grade || !topicId || !difficulty || !format || !content || !correctAnswer) {
      return NextResponse.json(
        { success: false, error: "Vui lòng điền đầy đủ các thông tin bắt buộc!" },
        { status: 400 }
      );
    }

    const newQuestion = await prisma.question.create({
      data: {
        code,
        grade,
        topicId,
        difficulty,
        format,
        content,
        tikzCode: tikzCode || null,
        options: options ? (typeof options === "string" ? options : JSON.stringify(options)) : null,
        correctAnswer: typeof correctAnswer === "string" ? correctAnswer : JSON.stringify(correctAnswer),
        explanation: explanation || null,
        source: source || null,
      },
    });

    return NextResponse.json({ success: true, data: newQuestion }, { status: 201 });
  } catch (error: any) {
    console.error("Lỗi tạo câu hỏi:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
