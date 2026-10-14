import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu nạp dữ liệu mẫu Vật lý 10, 11, 12 (GDPT 2018)...");

  // Xóa dữ liệu cũ nếu có
  await prisma.question.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.grade.deleteMany();

  // 1. Khởi tạo 3 khối lớp
  const grade10 = await prisma.grade.create({ data: { id: 10, name: "Vật lý 10" } });
  const grade11 = await prisma.grade.create({ data: { id: 11, name: "Vật lý 11" } });
  const grade12 = await prisma.grade.create({ data: { id: 12, name: "Vật lý 12" } });

  // 2. Chương & Bài Vật lý 12
  const c12_1 = await prisma.chapter.create({
    data: {
      name: "Chương I. Vật lý nhiệt & Khí lý tưởng",
      order: 1,
      gradeId: 12,
      topics: {
        create: [
          { name: "Bài 1. Cấu trúc chất. Sự chuyển thể", order: 1 },
          { name: "Bài 2. Nội năng. Định luật I nhiệt động lực học", order: 2 },
          { name: "Bài 3. Nhiệt dung riêng, nhiệt nóng chảy, nhiệt hóa hơi", order: 3 },
          { name: "Bài 4. Mô hình động học phân tử chất khí", order: 4 },
          { name: "Bài 5. Phương trình trạng thái khí lý tưởng", order: 5 },
        ],
      },
    },
  });

  const c12_2 = await prisma.chapter.create({
    data: {
      name: "Chương II. Từ trường & Cảm ứng điện từ",
      order: 2,
      gradeId: 12,
      topics: {
        create: [
          { name: "Bài 1. Từ trường. Cảm ứng từ", order: 1 },
          { name: "Bài 2. Lực từ tác dụng lên đoạn dây dẫn mang dòng điện", order: 2 },
          { name: "Bài 3. Hiện tượng cảm ứng điện từ", order: 3 },
          { name: "Bài 4. Dòng điện xoay chiều trong thực tế", order: 4 },
        ],
      },
    },
  });

  const c12_3 = await prisma.chapter.create({
    data: {
      name: "Chương III. Vật lý hạt nhân",
      order: 3,
      gradeId: 12,
      topics: {
        create: [
          { name: "Bài 1. Cấu trúc hạt nhân. Năng lượng liên kết", order: 1 },
          { name: "Bài 2. Hiện tượng phóng xạ", order: 2 },
          { name: "Bài 3. Phản ứng phân hạch và nhiệt hạch", order: 3 },
        ],
      },
    },
  });

  // 3. Chương Vật lý 11 (Dao động, Sóng, Điện trường)
  const c11_1 = await prisma.chapter.create({
    data: {
      name: "Chương I. Dao động",
      order: 1,
      gradeId: 11,
      topics: {
        create: [
          { name: "Bài 1. Dao động điều hòa", order: 1 },
          { name: "Bài 2. Con lắc lò xo và con lắc đơn", order: 2 },
          { name: "Bài 3. Năng lượng trong dao động điều hòa", order: 3 },
        ],
      },
    },
  });

  // Lấy các topic để gán câu hỏi mẫu
  const topics12 = await prisma.topic.findMany({ where: { chapter: { gradeId: 12 } } });
  const t_nhiet = topics12[1]; // Bài 2: Nội năng
  const t_khi = topics12[4];   // Bài 5: Khí lý tưởng
  const t_tutruong = topics12[6]; // Lực từ
  const t_hatnhan = topics12[9];  // Phóng xạ

  // 4. Tạo các câu hỏi mẫu chuẩn 4 dạng thức 2025
  console.log("📝 Đang tạo câu hỏi mẫu chuẩn 4 dạng thức 2025...");

  // Dạng 1: Trắc nghiệm 4 lựa chọn (Mức 1 - Nhận biết)
  await prisma.question.create({
    data: {
      code: "V12.01.01.NB-01",
      grade: 12,
      topicId: t_nhiet.id,
      difficulty: 1,
      format: "MULTIPLE_CHOICE",
      content: "Công thức nào sau đây diễn tả đúng định luật I của nhiệt động lực học đối với hệ kín?",
      options: JSON.stringify([
        { id: "A", text: "$\\Delta U = A + Q$" },
        { id: "B", text: "$\\Delta U = A - Q$" },
        { id: "C", text: "$A = \\Delta U + Q$" },
        { id: "D", text: "$Q = \\Delta U - A$" },
      ]),
      correctAnswer: "A",
      explanation: "Theo định luật I nhiệt động lực học: Độ biến thiên nội năng của vật bằng tổng công và nhiệt lượng mà vật nhận được: $\\Delta U = A + Q$.",
      source: "Đề minh họa Bộ GD&ĐT 2025",
    },
  });

  // Dạng 1: Trắc nghiệm 4 lựa chọn (Mức 3 - Vận dụng có công thức KaTeX)
  await prisma.question.create({
    data: {
      code: "V12.01.02.VD-02",
      grade: 12,
      topicId: t_khi.id,
      difficulty: 3,
      format: "MULTIPLE_CHOICE",
      content: "Một lượng khí lý tưởng xác định ở trạng thái (1) có áp suất $p_1 = 2\\cdot 10^5\\,\\text{Pa}$, thể tích $V_1 = 3\\,\\text{lít}$, nhiệt độ $T_1 = 300\\,\\text{K}$. Khí biến đổi đẳng nhiệt sang trạng thái (2) có thể tích $V_2 = 6\\,\\text{lít}$. Áp suất $p_2$ của khối khí là:",
      options: JSON.stringify([
        { id: "A", text: "$1\\cdot 10^5\\,\\text{Pa}$" },
        { id: "B", text: "$4\\cdot 10^5\\,\\text{Pa}$" },
        { id: "C", text: "$0{,}5\\cdot 10^5\\,\\text{Pa}$" },
        { id: "D", text: "$2\\cdot 10^5\\,\\text{Pa}$" },
      ]),
      correctAnswer: "A",
      explanation: "Quá trình đẳng nhiệt tuân theo định luật Boyle: $p_1 V_1 = p_2 V_2 \\Rightarrow p_2 = \\dfrac{p_1 V_1}{V_2} = \\dfrac{2\\cdot 10^5 \\cdot 3}{6} = 1\\cdot 10^5\\,\\text{Pa}$.",
      source: "Ngân hàng đề chuẩn ScisPhy",
    },
  });

  // Dạng 2: Đúng / Sai 4 ý (Mức 2 - Thông hiểu)
  await prisma.question.create({
    data: {
      code: "V12.02.01.DS-01",
      grade: 12,
      topicId: t_tutruong.id,
      difficulty: 2,
      format: "TRUE_FALSE",
      content: "Một đoạn dây dẫn thẳng dài $L = 0{,}2\\,\\text{m}$ mang dòng điện không đổi $I = 5\\,\\text{A}$ được đặt trong từ trường đều có cảm ứng từ $B = 0{,}04\\,\\text{T}$. Lực từ tác dụng lên đoạn dây dẫn có độ lớn $F$. Xét tính đúng/sai của các phát biểu sau:",
      options: JSON.stringify([
        { id: "a", text: "Lực từ có phương vuông góc với cả đoạn dây dẫn và véctơ cảm ứng từ." },
        { id: "b", text: "Khi đoạn dây đặt vuông góc với đường sức từ thì lực từ đạt giá trị cực đại bằng $0{,}04\\,\\text{N}$." },
        { id: "c", text: "Nếu tăng cường độ dòng điện lên 2 lần thì lực từ tăng lên 4 lần." },
        { id: "d", text: "Khi góc hợp bởi dòng điện và đường sức từ bằng $30^\\circ$ thì lực từ có độ lớn $0{,}02\\,\\text{N}$." },
      ]),
      correctAnswer: JSON.stringify({ a: true, b: true, c: false, d: true }),
      explanation: "Công thức lực từ: $F = B I L \\sin\\alpha$.\n- a) Đúng: Lực từ luôn vuông góc với mặt phẳng chứa dòng điện và $\\vec{B}$.\n- b) Đúng: $F_{\\max} = B I L = 0{,}04 \\times 5 \\times 0{,}2 = 0{,}04\\,\\text{N}$.\n- c) Sai: $F$ tỉ lệ bậc nhất với $I$, $I$ tăng 2 lần thì $F$ tăng 2 lần.\n- d) Đúng: $F = 0{,}04 \\times \\sin(30^\\circ) = 0{,}02\\,\\text{N}$.",
      source: "Đề thi thử THPT Chuyên KHTN",
    },
  });

  // Dạng 3: Trả lời ngắn (Mức 3 - Vận dụng)
  await prisma.question.create({
    data: {
      code: "V12.03.01.TLN-01",
      grade: 12,
      topicId: t_hatnhan.id,
      difficulty: 3,
      format: "SHORT_ANSWER",
      content: "Chất phóng xạ Poloni $^{210}_{84}\\text{Po}$ có chu kì bán rã $T = 138$ ngày. Ban đầu có một mẫu Poloni nguyên chất khối lượng $m_0 = 100\\,\\text{g}$. Sau bao nhiêu ngày thì khối lượng Poloni còn lại trong mẫu là $12{,}5\\,\\text{g}$? (Kết quả ghi dưới dạng số nguyên)",
      options: null,
      correctAnswer: "414",
      explanation: "Khối lượng còn lại: $m = m_0 \\cdot 2^{-t/T}$. Ta có: $\\dfrac{m}{m_0} = \\dfrac{12{,}5}{100} = \\dfrac{1}{8} = 2^{-3} \\Rightarrow \\dfrac{t}{T} = 3 \\Rightarrow t = 3 \\times 138 = 414$ ngày.",
      source: "Đề tuyển chọn Vật lý 2025",
    },
  });

  // Dạng 1: Trắc nghiệm có hình TikZ (Mạch điện xoay chiều / Mức 4 - VDC)
  await prisma.question.create({
    data: {
      code: "V12.02.04.VDC-01",
      grade: 12,
      topicId: t_tutruong.id,
      difficulty: 4,
      format: "MULTIPLE_CHOICE",
      content: "Cho mạch điện như hình vẽ. Đoạn mạch gồm điện trở $R = 50\\,\\Omega$, cuộn cảm thuần $L = \\dfrac{1}{\\pi}\\,\\text{H}$ và tụ điện $C = \\dfrac{10^{-4}}{\\pi}\\,\\text{F}$ mắc nối tiếp. Đặt vào hai đầu đoạn mạch điện áp xoay chiều $u = 200\\sqrt{2}\\cos(100\\pi t)\\,\\text{V}$. Cường độ dòng điện hiệu dụng trong mạch là:",
      tikzCode: `\\begin{tikzpicture}[scale=0.9]
  \\draw[thick] (0,1.5) -- (1,1.5);
  \\draw[thick] (1,1.2) rectangle (2.5,1.8) node[midway,above=8pt] {$R$};
  \\draw[thick] (2.5,1.5) -- (3.5,1.5);
  \\draw[thick] (3.5,1.5) to[out=60,in=120] (4.2,1.5) to[out=60,in=120] (4.9,1.5) to[out=60,in=120] (5.6,1.5) node[midway,above=8pt] {$L$};
  \\draw[thick] (5.6,1.5) -- (6.5,1.5);
  \\draw[thick] (6.5,1.1) -- (6.5,1.9);
  \\draw[thick] (6.8,1.1) -- (6.8,1.9) node[midway,above=14pt] {$C$};
  \\draw[thick] (6.8,1.5) -- (7.8,1.5);
  \\fill (0,1.5) circle (2pt) node[left] {$A$};
  \\fill (7.8,1.5) circle (2pt) node[right] {$B$};
\\end{tikzpicture}`,
      options: JSON.stringify([
        { id: "A", text: "$1\\,\\text{A}$" },
        { id: "B", text: "$2\\,\\text{A}$" },
        { id: "C", text: "$2\\sqrt{2}\\,\\text{A}$" },
        { id: "D", text: "$\\sqrt{2}\\,\\text{A}$" },
      ]),
      correctAnswer: "B",
      explanation: "$Z_L = \\omega L = 100\\pi \\times \\dfrac{1}{\\pi} = 100\\,\\Omega$.\n$Z_C = \\dfrac{1}{\\omega C} = \\dfrac{1}{100\\pi \\times \\dfrac{10^{-4}}{\\pi}} = 100\\,\\Omega$.\nDo $Z_L = Z_C$ nên xảy ra cộng hưởng điện: $Z = R = 50\\,\\Omega$.\nCường độ dòng điện hiệu dụng: $I = \\dfrac{U}{R} = \\dfrac{200}{50} = 2\\,\\text{A}$ (Chọn B).",
      source: "Đề thi thử THPT Quốc gia 2025",
    },
  });

  console.log("✅ Seed dữ liệu Vật lý mẫu thành công 100%!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
