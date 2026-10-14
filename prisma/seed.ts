import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu nạp dữ liệu Vật lý 10, 11, 12 (GDPT 2018) — Full seed...");

  // Xóa dữ liệu cũ
  await prisma.exam.deleteMany();
  await prisma.examMatrix.deleteMany();
  await prisma.question.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.grade.deleteMany();

  // ═══════════════════════════════════════════
  // 1. KHỐI LỚP
  // ═══════════════════════════════════════════
  await prisma.grade.create({ data: { id: 10, name: "Vật lý 10" } });
  await prisma.grade.create({ data: { id: 11, name: "Vật lý 11" } });
  await prisma.grade.create({ data: { id: 12, name: "Vật lý 12" } });

  // ═══════════════════════════════════════════
  // 2. VẬT LÝ 12 — CHƯƠNG & BÀI
  // ═══════════════════════════════════════════
  const c12_1 = await prisma.chapter.create({
    data: {
      name: "Chương I. Vật lý nhiệt & Khí lý tưởng", order: 1, gradeId: 12,
      topics: { create: [
        { name: "Bài 1. Cấu trúc chất. Sự chuyển thể", order: 1 },
        { name: "Bài 2. Nội năng. Định luật I nhiệt động lực học", order: 2 },
        { name: "Bài 3. Nhiệt dung riêng, nhiệt nóng chảy, nhiệt hóa hơi", order: 3 },
        { name: "Bài 4. Mô hình động học phân tử chất khí", order: 4 },
        { name: "Bài 5. Phương trình trạng thái khí lý tưởng", order: 5 },
      ]},
    },
  });

  const c12_2 = await prisma.chapter.create({
    data: {
      name: "Chương II. Từ trường & Cảm ứng điện từ", order: 2, gradeId: 12,
      topics: { create: [
        { name: "Bài 1. Từ trường. Cảm ứng từ", order: 1 },
        { name: "Bài 2. Lực từ tác dụng lên đoạn dây dẫn mang dòng điện", order: 2 },
        { name: "Bài 3. Hiện tượng cảm ứng điện từ", order: 3 },
        { name: "Bài 4. Dòng điện xoay chiều trong thực tế", order: 4 },
      ]},
    },
  });

  const c12_3 = await prisma.chapter.create({
    data: {
      name: "Chương III. Vật lý hạt nhân", order: 3, gradeId: 12,
      topics: { create: [
        { name: "Bài 1. Cấu trúc hạt nhân. Năng lượng liên kết", order: 1 },
        { name: "Bài 2. Hiện tượng phóng xạ", order: 2 },
        { name: "Bài 3. Phản ứng phân hạch và nhiệt hạch", order: 3 },
      ]},
    },
  });

  // ═══════════════════════════════════════════
  // 3. VẬT LÝ 11 — CHƯƠNG & BÀI
  // ═══════════════════════════════════════════
  await prisma.chapter.create({
    data: {
      name: "Chương I. Dao động", order: 1, gradeId: 11,
      topics: { create: [
        { name: "Bài 1. Dao động điều hòa", order: 1 },
        { name: "Bài 2. Con lắc lò xo và con lắc đơn", order: 2 },
        { name: "Bài 3. Năng lượng trong dao động điều hòa", order: 3 },
        { name: "Bài 4. Dao động tắt dần. Dao động cưỡng bức. Cộng hưởng", order: 4 },
      ]},
    },
  });

  await prisma.chapter.create({
    data: {
      name: "Chương II. Sóng", order: 2, gradeId: 11,
      topics: { create: [
        { name: "Bài 1. Mô tả sóng. Sóng dọc và sóng ngang", order: 1 },
        { name: "Bài 2. Sóng âm. Đặc trưng vật lý của âm", order: 2 },
        { name: "Bài 3. Giao thoa sóng. Sóng dừng", order: 3 },
      ]},
    },
  });

  await prisma.chapter.create({
    data: {
      name: "Chương III. Điện trường", order: 3, gradeId: 11,
      topics: { create: [
        { name: "Bài 1. Lực tương tác giữa các điện tích. Định luật Coulomb", order: 1 },
        { name: "Bài 2. Khái niệm điện trường. Cường độ điện trường", order: 2 },
        { name: "Bài 3. Điện thế. Hiệu điện thế", order: 3 },
        { name: "Bài 4. Tụ điện", order: 4 },
      ]},
    },
  });

  await prisma.chapter.create({
    data: {
      name: "Chương IV. Dòng điện. Mạch điện", order: 4, gradeId: 11,
      topics: { create: [
        { name: "Bài 1. Cường độ dòng điện. Định luật Ohm", order: 1 },
        { name: "Bài 2. Điện năng. Công suất điện", order: 2 },
        { name: "Bài 3. Ghép điện trở. Mạch cầu", order: 3 },
      ]},
    },
  });

  // ═══════════════════════════════════════════
  // 4. VẬT LÝ 10 — CHƯƠNG & BÀI
  // ═══════════════════════════════════════════
  await prisma.chapter.create({
    data: {
      name: "Chương I. Mô tả chuyển động", order: 1, gradeId: 10,
      topics: { create: [
        { name: "Bài 1. Chuyển động thẳng đều", order: 1 },
        { name: "Bài 2. Chuyển động thẳng biến đổi đều", order: 2 },
        { name: "Bài 3. Rơi tự do", order: 3 },
      ]},
    },
  });

  await prisma.chapter.create({
    data: {
      name: "Chương II. Các lực cơ học", order: 2, gradeId: 10,
      topics: { create: [
        { name: "Bài 1. Ba định luật Newton", order: 1 },
        { name: "Bài 2. Lực hấp dẫn. Trọng lực", order: 2 },
        { name: "Bài 3. Lực đàn hồi. Lực ma sát", order: 3 },
      ]},
    },
  });

  await prisma.chapter.create({
    data: {
      name: "Chương III. Năng lượng", order: 3, gradeId: 10,
      topics: { create: [
        { name: "Bài 1. Động năng. Định lý động năng", order: 1 },
        { name: "Bài 2. Thế năng. Cơ năng", order: 2 },
        { name: "Bài 3. Công và công suất", order: 3 },
      ]},
    },
  });

  await prisma.chapter.create({
    data: {
      name: "Chương IV. Động lượng", order: 4, gradeId: 10,
      topics: { create: [
        { name: "Bài 1. Động lượng. Xung lượng", order: 1 },
        { name: "Bài 2. Định luật bảo toàn động lượng. Va chạm", order: 2 },
      ]},
    },
  });

  // ═══════════════════════════════════════════
  // 5. CÂU HỎI VẬT LÝ 12 — ĐỦ 4 DẠNG × 4 MỨC ĐỘ
  // ═══════════════════════════════════════════
  console.log("📝 Đang tạo câu hỏi Vật lý 12...");

  const topics12 = await prisma.topic.findMany({
    where: { chapter: { gradeId: 12 } },
    orderBy: [{ chapter: { order: "asc" } }, { order: "asc" }],
  });

  // Helper
  const opt = (a: string, b: string, c: string, d: string) =>
    JSON.stringify([
      { id: "A", text: a }, { id: "B", text: b },
      { id: "C", text: c }, { id: "D", text: d },
    ]);

  const tfOpt = (a: string, b: string, c: string, d: string) =>
    JSON.stringify([
      { id: "a", text: a }, { id: "b", text: b },
      { id: "c", text: c }, { id: "d", text: d },
    ]);

  const tfAns = (a: boolean, b: boolean, c: boolean, d: boolean) =>
    JSON.stringify({ a, b, c, d });

  // Chương I: Vật lý nhiệt & Khí lý tưởng
  const t = topics12; // shorthand
  // t[0] = Cấu trúc chất, t[1] = Nội năng, t[2] = Nhiệt dung riêng, t[3] = Mô hình ĐHPT, t[4] = PT trạng thái

  const questions12 = [
    // ─── CHƯƠNG I: NHIỆT & KHÍ LÝ TƯỞNG ───
    // TN - Mức 1
    { code: "V12.01.01.NB-01", topicId: t[0].id, difficulty: 1, format: "MULTIPLE_CHOICE",
      content: "Trong các chất sau đây, chất nào có cấu trúc tinh thể?",
      options: opt("Nước đá", "Thủy tinh", "Nhựa đường", "Cao su"), correctAnswer: "A",
      explanation: "Nước đá (đông đặc ở $0^\\circ\\text{C}$) có cấu trúc tinh thể. Thủy tinh, nhựa đường, cao su là chất vô định hình." },
    { code: "V12.01.01.NB-02", topicId: t[0].id, difficulty: 1, format: "MULTIPLE_CHOICE",
      content: "Chất rắn vô định hình có đặc điểm nào sau đây?",
      options: opt("Có dạng hình học xác định", "Có nhiệt độ nóng chảy xác định", "Có tính đẳng hướng", "Có cấu trúc tuần hoàn"), correctAnswer: "C",
      explanation: "Chất rắn vô định hình không có dạng hình học xác định, không có nhiệt độ nóng chảy xác định, có tính đẳng hướng." },
    { code: "V12.01.02.NB-03", topicId: t[1].id, difficulty: 1, format: "MULTIPLE_CHOICE",
      content: "Nội năng của một vật là",
      options: opt("tổng động năng và thế năng của vật", "tổng động năng phân tử và thế năng tương tác phân tử", "nhiệt lượng vật nhận được", "công mà vật thực hiện"), correctAnswer: "B",
      explanation: "Nội năng = tổng động năng chuyển động nhiệt của các phân tử + thế năng tương tác giữa các phân tử." },
    { code: "V12.01.04.NB-04", topicId: t[3].id, difficulty: 1, format: "MULTIPLE_CHOICE",
      content: "Theo mô hình động học phân tử, các phân tử khí lý tưởng",
      options: opt("hút nhau rất mạnh", "đẩy nhau rất mạnh", "không tương tác với nhau (trừ khi va chạm)", "liên kết chặt chẽ với nhau"), correctAnswer: "C",
      explanation: "Khí lý tưởng: các phân tử coi là chất điểm, không tương tác (trừ va chạm), chuyển động hỗn loạn." },
    { code: "V12.01.05.NB-05", topicId: t[4].id, difficulty: 1, format: "MULTIPLE_CHOICE",
      content: "Phương trình trạng thái khí lý tưởng có dạng",
      options: opt("$\\dfrac{pV}{T} = \\text{const}$", "$pV = \\text{const}$", "$\\dfrac{p}{T} = \\text{const}$", "$\\dfrac{V}{T} = \\text{const}$"), correctAnswer: "A",
      explanation: "Phương trình Clapeyron: $\\dfrac{pV}{T} = \\text{const}$ (cho một lượng khí xác định)." },

    // TN - Mức 2
    { code: "V12.01.02.TH-01", topicId: t[1].id, difficulty: 2, format: "MULTIPLE_CHOICE",
      content: "Theo định luật I nhiệt động lực học, hệ thức $\\Delta U = A + Q$ áp dụng cho quá trình nào?",
      options: opt("Chỉ quá trình đẳng tích", "Chỉ quá trình đoạn nhiệt", "Chỉ quá trình đẳng nhiệt", "Mọi quá trình biến đổi trạng thái"), correctAnswer: "D",
      explanation: "Định luật I NĐLH là nguyên lý tổng quát, áp dụng cho mọi quá trình biến đổi trạng thái." },
    { code: "V12.01.03.TH-02", topicId: t[2].id, difficulty: 2, format: "MULTIPLE_CHOICE",
      content: "Nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn $m\\,\\text{kg}$ chất rắn kết tinh tại nhiệt độ nóng chảy được tính bằng công thức",
      options: opt("$Q = mc\\Delta t$", "$Q = m\\lambda$", "$Q = mL$", "$Q = m\\lambda + mc\\Delta t$"), correctAnswer: "B",
      explanation: "Tại nhiệt độ nóng chảy: $Q = m\\lambda$ với $\\lambda$ là nhiệt nóng chảy riêng. $Q = mL$ là nhiệt hóa hơi." },
    { code: "V12.01.05.TH-03", topicId: t[4].id, difficulty: 2, format: "MULTIPLE_CHOICE",
      content: "Một lượng khí xác định biến đổi đẳng nhiệt từ trạng thái $(p_1, V_1)$ sang $(p_2, V_2)$. Nếu $V_2 = 2V_1$ thì",
      options: opt("$p_2 = 2p_1$", "$p_2 = p_1/2$", "$p_2 = p_1$", "$p_2 = 4p_1$"), correctAnswer: "B",
      explanation: "Đẳng nhiệt: $p_1V_1 = p_2V_2 \\Rightarrow p_2 = p_1V_1/(2V_1) = p_1/2$." },
    { code: "V12.01.04.TH-04", topicId: t[3].id, difficulty: 2, format: "MULTIPLE_CHOICE",
      content: "Áp suất chất khí tác dụng lên thành bình là do",
      options: opt("các phân tử khí hút thành bình", "các phân tử khí va chạm vào thành bình", "các phân tử khí dao động quanh vị trí cân bằng", "trọng lượng của khí tác dụng lên thành bình"), correctAnswer: "B",
      explanation: "Áp suất = kết quả va chạm liên tục của rất nhiều phân tử khí lên thành bình." },

    // TN - Mức 3
    { code: "V12.01.05.VD-01", topicId: t[4].id, difficulty: 3, format: "MULTIPLE_CHOICE",
      content: "Một lượng khí lý tưởng ở $27^\\circ\\text{C}$, áp suất $2\\cdot 10^5\\,\\text{Pa}$, thể tích $3\\,\\text{lít}$. Nung nóng đẳng áp đến $127^\\circ\\text{C}$. Thể tích khí sau khi nung là",
      options: opt("$4\\,\\text{lít}$", "$3{,}5\\,\\text{lít}$", "$6\\,\\text{lít}$", "$12{,}7\\,\\text{lít}$"), correctAnswer: "A",
      explanation: "Đẳng áp: $V_1/T_1 = V_2/T_2 \\Rightarrow V_2 = 3 \\times 400/300 = 4\\,\\text{lít}$." },
    { code: "V12.01.02.VD-02", topicId: t[1].id, difficulty: 3, format: "MULTIPLE_CHOICE",
      content: "Người ta cung cấp cho khí trong xi lanh nhiệt lượng $Q = 100\\,\\text{J}$. Khí nở ra thực hiện công $A' = 70\\,\\text{J}$. Độ biến thiên nội năng của khí là",
      options: opt("$170\\,\\text{J}$", "$30\\,\\text{J}$", "$-30\\,\\text{J}$", "$-170\\,\\text{J}$"), correctAnswer: "B",
      explanation: "Khí nhận nhiệt: $Q > 0$. Khí sinh công: $A' > 0 \\Rightarrow A = -A' = -70\\,\\text{J}$.\n$\\Delta U = Q + A = 100 + (-70) = 30\\,\\text{J}$." },
    { code: "V12.01.03.VD-03", topicId: t[2].id, difficulty: 3, format: "MULTIPLE_CHOICE",
      content: "Cần cung cấp nhiệt lượng bao nhiêu để đun $2\\,\\text{kg}$ nước từ $25^\\circ\\text{C}$ đến sôi? Biết $c = 4200\\,\\text{J/(kg·K)}$.",
      options: opt("$630\\,\\text{kJ}$", "$210\\,\\text{kJ}$", "$840\\,\\text{kJ}$", "$420\\,\\text{kJ}$"), correctAnswer: "A",
      explanation: "$Q = mc\\Delta t = 2 \\times 4200 \\times (100-25) = 2 \\times 4200 \\times 75 = 630\\,000\\,\\text{J} = 630\\,\\text{kJ}$." },

    // TN - Mức 4
    { code: "V12.01.05.VDC-01", topicId: t[4].id, difficulty: 4, format: "MULTIPLE_CHOICE",
      content: "Một bình kín chứa $0{,}02\\,\\text{mol}$ khí lý tưởng ở $27^\\circ\\text{C}$, áp suất $10^5\\,\\text{Pa}$. Nung bình đến khi áp suất tăng gấp 3 lần. Biết $R = 8{,}31\\,\\text{J/(mol·K)}$. Thể tích bình và nhiệt độ sau khi nung là",
      options: opt("$V \\approx 5\\,\\text{lít}$; $T_2 = 900\\,\\text{K}$", "$V \\approx 5\\,\\text{lít}$; $T_2 = 627^\\circ\\text{C}$", "$V \\approx 15\\,\\text{lít}$; $T_2 = 900\\,\\text{K}$", "$V \\approx 5\\,\\text{lít}$; $T_2 = 900^\\circ\\text{C}$"), correctAnswer: "B",
      explanation: "$V = nRT_1/p_1 = 0{,}02 \\times 8{,}31 \\times 300/10^5 \\approx 4{,}986 \\times 10^{-4}\\,\\text{m}^3 \\approx 5\\,\\text{lít}$.\nĐẳng tích: $T_2 = 3T_1 = 900\\,\\text{K} = 627^\\circ\\text{C}$." },

    // ─── CHƯƠNG II: TỪ TRƯỜNG & CẢM ỨNG ĐIỆN TỪ ───
    // TN - Mức 1
    { code: "V12.02.01.NB-01", topicId: t[5].id, difficulty: 1, format: "MULTIPLE_CHOICE",
      content: "Từ trường tồn tại ở đâu?",
      options: opt("Xung quanh nam châm", "Xung quanh dòng điện", "Xung quanh điện tích đứng yên", "Cả A và B"), correctAnswer: "D",
      explanation: "Từ trường tồn tại xung quanh nam châm và xung quanh dòng điện (điện tích chuyển động)." },
    { code: "V12.02.01.NB-02", topicId: t[5].id, difficulty: 1, format: "MULTIPLE_CHOICE",
      content: "Đơn vị của cảm ứng từ $B$ trong hệ SI là",
      options: opt("Vôn (V)", "Tesla (T)", "Henry (H)", "Weber (Wb)"), correctAnswer: "B",
      explanation: "Cảm ứng từ đo bằng Tesla (T). $1\\,\\text{T} = 1\\,\\text{Wb/m}^2$." },
    { code: "V12.02.03.NB-03", topicId: t[7].id, difficulty: 1, format: "MULTIPLE_CHOICE",
      content: "Hiện tượng cảm ứng điện từ là hiện tượng",
      options: opt("tạo ra từ trường bởi dòng điện", "tạo ra dòng điện bởi từ trường biến thiên", "tạo ra điện tích bởi nam châm", "tạo ra lực từ bởi dòng điện"), correctAnswer: "B",
      explanation: "Cảm ứng điện từ: khi từ thông qua mạch kín biến thiên → sinh ra suất điện động cảm ứng → dòng điện cảm ứng." },

    // TN - Mức 2
    { code: "V12.02.02.TH-01", topicId: t[6].id, difficulty: 2, format: "MULTIPLE_CHOICE",
      content: "Lực từ tác dụng lên đoạn dây dẫn mang dòng điện đặt trong từ trường đều có độ lớn được tính bằng",
      options: opt("$F = qvB\\sin\\alpha$", "$F = BIl\\sin\\alpha$", "$F = BIl\\cos\\alpha$", "$F = BI/l$"), correctAnswer: "B",
      explanation: "Lực Ampere: $F = BIl\\sin\\alpha$, với $\\alpha$ là góc giữa $\\vec{l}$ và $\\vec{B}$." },
    { code: "V12.02.04.TH-02", topicId: t[8].id, difficulty: 2, format: "MULTIPLE_CHOICE",
      content: "Suất điện động xoay chiều do máy phát điện tạo ra có biểu thức $e = E_0\\cos(\\omega t + \\varphi)$, trong đó $E_0$ phụ thuộc vào",
      options: opt("tần số quay của rôto", "số vòng dây và từ thông cực đại", "điện trở của mạch ngoài", "cường độ dòng điện"), correctAnswer: "B",
      explanation: "$E_0 = NBS\\omega$ phụ thuộc số vòng $N$, cảm ứng từ $B$, diện tích $S$ và tần số góc $\\omega$." },

    // TN - Mức 3
    { code: "V12.02.02.VD-01", topicId: t[6].id, difficulty: 3, format: "MULTIPLE_CHOICE",
      content: "Đoạn dây dẫn thẳng $l = 20\\,\\text{cm}$ mang dòng điện $I = 5\\,\\text{A}$ đặt trong từ trường đều $B = 0{,}04\\,\\text{T}$, vuông góc với các đường sức từ. Lực từ tác dụng lên đoạn dây là",
      options: opt("$0{,}04\\,\\text{N}$", "$0{,}4\\,\\text{N}$", "$0{,}004\\,\\text{N}$", "$4\\,\\text{N}$"), correctAnswer: "A",
      explanation: "$F = BIl\\sin 90^\\circ = 0{,}04 \\times 5 \\times 0{,}2 \\times 1 = 0{,}04\\,\\text{N}$." },
    { code: "V12.02.03.VD-02", topicId: t[7].id, difficulty: 3, format: "MULTIPLE_CHOICE",
      content: "Một khung dây phẳng diện tích $S = 200\\,\\text{cm}^2$ đặt trong từ trường đều $B = 0{,}1\\,\\text{T}$, mặt phẳng khung vuông góc với $\\vec{B}$. Nếu từ trường giảm đều về 0 trong $0{,}01\\,\\text{s}$ thì suất điện động cảm ứng trong khung là",
      options: opt("$0{,}2\\,\\text{V}$", "$0{,}02\\,\\text{V}$", "$2\\,\\text{V}$", "$0{,}002\\,\\text{V}$"), correctAnswer: "A",
      explanation: "$|e_c| = |\\Delta\\Phi/\\Delta t| = BS/\\Delta t = 0{,}1 \\times 200 \\times 10^{-4}/0{,}01 = 0{,}2\\,\\text{V}$." },

    // TN - Mức 4
    { code: "V12.02.04.VDC-01", topicId: t[8].id, difficulty: 4, format: "MULTIPLE_CHOICE",
      content: "Mạch RLC nối tiếp: $R = 50\\,\\Omega$, $L = \\dfrac{1}{\\pi}\\,\\text{H}$, $C = \\dfrac{10^{-4}}{\\pi}\\,\\text{F}$. Đặt $u = 200\\sqrt{2}\\cos(100\\pi t)\\,\\text{V}$. Cường độ dòng điện hiệu dụng là",
      options: opt("$1\\,\\text{A}$", "$2\\,\\text{A}$", "$2\\sqrt{2}\\,\\text{A}$", "$\\sqrt{2}\\,\\text{A}$"), correctAnswer: "B",
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
      explanation: "$Z_L = 100\\,\\Omega$, $Z_C = 100\\,\\Omega$. Cộng hưởng: $Z = R = 50\\,\\Omega$. $I = U/R = 200/50 = 2\\,\\text{A}$." },

    // ─── CHƯƠNG III: VẬT LÝ HẠT NHÂN ───
    // TN - Mức 1
    { code: "V12.03.01.NB-01", topicId: t[9].id, difficulty: 1, format: "MULTIPLE_CHOICE",
      content: "Hạt nhân nguyên tử $^{A}_{Z}X$ được cấu tạo từ",
      options: opt("$Z$ proton và $A$ neutron", "$Z$ proton và $(A-Z)$ neutron", "$A$ proton và $Z$ neutron", "$(A-Z)$ proton và $Z$ neutron"), correctAnswer: "B",
      explanation: "Hạt nhân gồm $Z$ proton và $N = A - Z$ neutron, với $A$ là số khối." },
    { code: "V12.03.02.NB-02", topicId: t[10].id, difficulty: 1, format: "MULTIPLE_CHOICE",
      content: "Trong phóng xạ $\\beta^-$, hạt nhân con so với hạt nhân mẹ có",
      options: opt("số khối giảm 4, số proton giảm 2", "số khối không đổi, số proton tăng 1", "số khối không đổi, số proton giảm 1", "số khối giảm 4, số proton tăng 1"), correctAnswer: "B",
      explanation: "Phóng xạ $\\beta^-$: $n \\to p + e^- + \\bar{\\nu}_e$. Số khối $A$ không đổi, $Z$ tăng 1." },

    // TN - Mức 2
    { code: "V12.03.01.TH-01", topicId: t[9].id, difficulty: 2, format: "MULTIPLE_CHOICE",
      content: "Năng lượng liên kết riêng của hạt nhân",
      options: opt("càng lớn thì hạt nhân càng bền vững", "càng nhỏ thì hạt nhân càng bền vững", "của mọi hạt nhân đều bằng nhau", "tỉ lệ với số khối $A$"), correctAnswer: "A",
      explanation: "Năng lượng liên kết riêng = $\\Delta E/A$. Giá trị này càng lớn → hạt nhân càng bền." },

    // TN - Mức 3
    { code: "V12.03.02.VD-01", topicId: t[10].id, difficulty: 3, format: "MULTIPLE_CHOICE",
      content: "Chất phóng xạ $^{210}_{84}\\text{Po}$ có chu kì bán rã $T = 138$ ngày. Ban đầu có $100\\,\\text{g}$, sau $414$ ngày khối lượng còn lại là",
      options: opt("$50\\,\\text{g}$", "$25\\,\\text{g}$", "$12{,}5\\,\\text{g}$", "$6{,}25\\,\\text{g}$"), correctAnswer: "C",
      explanation: "$t/T = 414/138 = 3$. $m = m_0 \\cdot 2^{-3} = 100/8 = 12{,}5\\,\\text{g}$." },

    // TN - Mức 4
    { code: "V12.03.03.VDC-01", topicId: t[11].id, difficulty: 4, format: "MULTIPLE_CHOICE",
      content: "Trong phản ứng nhiệt hạch $^{2}_{1}\\text{H} + ^{3}_{1}\\text{H} \\to ^{4}_{2}\\text{He} + ^{1}_{0}n$, biết khối lượng: $m_D = 2{,}0141\\,u$; $m_T = 3{,}0160\\,u$; $m_{He} = 4{,}0026\\,u$; $m_n = 1{,}0087\\,u$; $1\\,u = 931{,}5\\,\\text{MeV/c}^2$. Năng lượng tỏa ra là",
      options: opt("$17{,}5\\,\\text{MeV}$", "$17{,}6\\,\\text{MeV}$", "$18{,}1\\,\\text{MeV}$", "$15{,}2\\,\\text{MeV}$"), correctAnswer: "B",
      explanation: "$\\Delta m = (m_D + m_T) - (m_{He} + m_n) = 5{,}0301 - 5{,}0113 = 0{,}0188\\,u$.\n$E = 0{,}0188 \\times 931{,}5 \\approx 17{,}6\\,\\text{MeV}$." },

    // ─── ĐÚNG/SAI — đủ mức 1-4, phủ 3 chương ───
    { code: "V12.01.05.DS-01", topicId: t[4].id, difficulty: 2, format: "TRUE_FALSE",
      content: "Cho một lượng khí lý tưởng xác định. Xét tính đúng/sai:",
      options: tfOpt("Trong quá trình đẳng nhiệt, khi thể tích tăng thì áp suất giảm.", "Trong quá trình đẳng tích, áp suất tỉ lệ thuận với nhiệt độ tuyệt đối.", "Trong quá trình đẳng áp, thể tích tỉ lệ nghịch với nhiệt độ tuyệt đối.", "Phương trình trạng thái: $pV/T = \\text{const}$ (đúng cho mọi quá trình)."),
      correctAnswer: tfAns(true, true, false, true),
      explanation: "a) Đúng: $pV = \\text{const} \\Rightarrow V \\uparrow \\Rightarrow p \\downarrow$.\nb) Đúng: $p/T = \\text{const}$.\nc) Sai: Đẳng áp → $V$ tỉ lệ thuận (không phải nghịch) với $T$.\nd) Đúng: PT trạng thái tổng quát." },
    { code: "V12.02.02.DS-01", topicId: t[6].id, difficulty: 2, format: "TRUE_FALSE",
      content: "Một đoạn dây dẫn thẳng dài $L = 0{,}2\\,\\text{m}$ mang dòng điện $I = 5\\,\\text{A}$ đặt trong từ trường đều $B = 0{,}04\\,\\text{T}$:",
      options: tfOpt("Lực từ vuông góc với cả đoạn dây và véctơ $\\vec{B}$.", "Khi dây vuông góc $\\vec{B}$: $F_{\\max} = 0{,}04\\,\\text{N}$.", "Tăng $I$ lên 2 lần thì lực từ tăng 4 lần.", "Khi $\\alpha = 30^\\circ$: $F = 0{,}02\\,\\text{N}$."),
      correctAnswer: tfAns(true, true, false, true),
      explanation: "a) Đúng. b) $F = BIl = 0{,}04\\,\\text{N}$. c) Sai: $F \\propto I$ (tuyến tính). d) $F = 0{,}04\\sin 30^\\circ = 0{,}02\\,\\text{N}$." },
    { code: "V12.03.02.DS-01", topicId: t[10].id, difficulty: 3, format: "TRUE_FALSE",
      content: "Về hiện tượng phóng xạ, xét các phát biểu sau:",
      options: tfOpt("Phóng xạ là phản ứng hạt nhân tỏa năng lượng.", "Chu kì bán rã phụ thuộc vào nhiệt độ và áp suất.", "Tia $\\alpha$ có bản chất là hạt nhân $^{4}_{2}\\text{He}$.", "Số hạt nhân phóng xạ giảm theo hàm mũ: $N = N_0 e^{-\\lambda t}$."),
      correctAnswer: tfAns(true, false, true, true),
      explanation: "a) Đúng: phóng xạ tỏa năng lượng (hạt nhân mẹ → con + tia).\nb) Sai: $T$ không phụ thuộc điều kiện bên ngoài.\nc) Đúng.\nd) Đúng: định luật phân rã." },
    { code: "V12.01.02.DS-02", topicId: t[1].id, difficulty: 1, format: "TRUE_FALSE",
      content: "Về nội năng và nhiệt động lực học, xét các phát biểu:",
      options: tfOpt("Nội năng là tổng động năng và thế năng của vật.", "Nội năng phụ thuộc vào nhiệt độ và thể tích.", "Truyền nhiệt là cách thay đổi nội năng không có thực hiện công.", "Trong quá trình đoạn nhiệt, nội năng không đổi."),
      correctAnswer: tfAns(false, true, true, false),
      explanation: "a) Sai: Nội năng = tổng Eđ phân tử + Et tương tác phân tử (không phải Eđ, Et vĩ mô).\nb) Đúng.\nc) Đúng.\nd) Sai: đoạn nhiệt → $Q = 0$, $\\Delta U = A \\neq 0$." },
    { code: "V12.02.03.DS-02", topicId: t[7].id, difficulty: 3, format: "TRUE_FALSE",
      content: "Về hiện tượng cảm ứng điện từ:",
      options: tfOpt("Suất điện động cảm ứng tỉ lệ với tốc độ biến thiên từ thông.", "Dòng điện cảm ứng chỉ xuất hiện khi mạch kín.", "Định luật Lenz xác định chiều dòng điện cảm ứng.", "Suất điện động tự cảm: $e_{tc} = -L \\cdot \\Delta I / \\Delta t$."),
      correctAnswer: tfAns(true, false, true, true),
      explanation: "a) Đúng: $|e_c| = |d\\Phi/dt|$.\nb) Sai: mạch hở vẫn có suất điện động cảm ứng, chỉ không có dòng điện.\nc) Đúng.\nd) Đúng." },
    { code: "V12.03.01.DS-01", topicId: t[9].id, difficulty: 1, format: "TRUE_FALSE",
      content: "Về cấu trúc hạt nhân nguyên tử:",
      options: tfOpt("Hạt nhân gồm proton và neutron.", "Số proton bằng số neutron trong mọi hạt nhân.", "Lực hạt nhân là lực tương tác mạnh, phạm vi tác dụng rất ngắn.", "Đồng vị là các hạt nhân có cùng số proton nhưng khác số neutron."),
      correctAnswer: tfAns(true, false, true, true),
      explanation: "a) Đúng.\nb) Sai: chỉ đúng với hạt nhân nhẹ, hạt nhân nặng có $N > Z$.\nc) Đúng: $r \\sim 10^{-15}\\,\\text{m}$.\nd) Đúng." },

    // ─── TRẢ LỜI NGẮN — đủ mức 2-4, phủ 3 chương ───
    { code: "V12.01.05.TLN-01", topicId: t[4].id, difficulty: 2, format: "SHORT_ANSWER",
      content: "Một lượng khí lý tưởng ở $0^\\circ\\text{C}$ được nung nóng đẳng tích. Hỏi cần nung đến bao nhiêu $^\\circ\\text{C}$ để áp suất tăng gấp đôi?",
      correctAnswer: "273",
      explanation: "Đẳng tích: $p/T = \\text{const}$. $p_2 = 2p_1 \\Rightarrow T_2 = 2T_1 = 2 \\times 273 = 546\\,\\text{K} = 273^\\circ\\text{C}$." },
    { code: "V12.01.03.TLN-02", topicId: t[2].id, difficulty: 3, format: "SHORT_ANSWER",
      content: "Cần nhiệt lượng bao nhiêu $\\text{kJ}$ để đun $0{,}5\\,\\text{kg}$ nước từ $20^\\circ\\text{C}$ đến sôi? ($c = 4200\\,\\text{J/(kg·K)}$). Kết quả làm tròn đến hàng đơn vị.",
      correctAnswer: "168",
      explanation: "$Q = mc\\Delta t = 0{,}5 \\times 4200 \\times 80 = 168\\,000\\,\\text{J} = 168\\,\\text{kJ}$." },
    { code: "V12.02.02.TLN-01", topicId: t[6].id, difficulty: 3, format: "SHORT_ANSWER",
      content: "Đoạn dây dẫn dài $10\\,\\text{cm}$ mang dòng điện $I = 10\\,\\text{A}$ đặt vuông góc với $\\vec{B}$ đều có $B = 0{,}5\\,\\text{T}$. Lực từ (N) tác dụng lên đoạn dây bằng bao nhiêu?",
      correctAnswer: "0.5",
      explanation: "$F = BIl = 0{,}5 \\times 10 \\times 0{,}1 = 0{,}5\\,\\text{N}$." },
    { code: "V12.03.02.TLN-01", topicId: t[10].id, difficulty: 3, format: "SHORT_ANSWER",
      content: "$^{210}_{84}\\text{Po}$ có $T = 138$ ngày. Có $m_0 = 100\\,\\text{g}$, sau bao nhiêu ngày thì còn $12{,}5\\,\\text{g}$?",
      correctAnswer: "414",
      explanation: "$12{,}5/100 = 1/8 = 2^{-3} \\Rightarrow t = 3T = 414$ ngày." },
    { code: "V12.03.03.TLN-02", topicId: t[11].id, difficulty: 4, format: "SHORT_ANSWER",
      content: "Cho $^{2}_{1}D + ^{3}_{1}T \\to ^{4}_{2}He + ^{1}_{0}n$. Biết $\\Delta m = 0{,}0189\\,u$, $1\\,u = 931{,}5\\,\\text{MeV/c}^2$. Năng lượng tỏa ra (MeV) là bao nhiêu? (Làm tròn 1 chữ số thập phân)",
      correctAnswer: "17.6",
      explanation: "$E = \\Delta m \\times 931{,}5 = 0{,}0189 \\times 931{,}5 \\approx 17{,}6\\,\\text{MeV}$." },
    { code: "V12.01.05.TLN-03", topicId: t[4].id, difficulty: 4, format: "SHORT_ANSWER",
      content: "Một xi lanh chứa $1\\,\\text{mol}$ khí lý tưởng ở $27^\\circ\\text{C}$, $V = 24{,}93\\,\\text{lít}$. Nung đẳng áp đến $127^\\circ\\text{C}$. Công khí thực hiện ($\\text{J}$) là bao nhiêu? ($R = 8{,}31\\,\\text{J/(mol·K)}$). Làm tròn đến hàng đơn vị.",
      correctAnswer: "831",
      explanation: "Đẳng áp: $A = p\\Delta V = nR\\Delta T = 1 \\times 8{,}31 \\times (400 - 300) = 831\\,\\text{J}$." },
  ];

  for (const q of questions12) {
    await prisma.question.create({
      data: {
        code: q.code,
        grade: 12,
        topicId: q.topicId,
        difficulty: q.difficulty,
        format: q.format,
        content: q.content,
        options: q.options || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || null,
        tikzCode: (q as any).tikzCode || null,
        source: "ScisPhy Ngân hàng chuẩn Vật lý 12",
      },
    });
  }

  console.log(`✅ Đã tạo ${questions12.length} câu hỏi Vật lý 12.`);

  // ═══════════════════════════════════════════
  // 6. THỐNG KÊ TỔNG KẾT
  // ═══════════════════════════════════════════
  const totalQ = await prisma.question.count();
  const totalT = await prisma.topic.count();
  const totalC = await prisma.chapter.count();

  console.log(`\n📊 TỔNG KẾT SEED:`);
  console.log(`   Khối lớp: 3 (VL10, VL11, VL12)`);
  console.log(`   Chương: ${totalC}`);
  console.log(`   Bài: ${totalT}`);
  console.log(`   Câu hỏi: ${totalQ}`);

  const mc = await prisma.question.count({ where: { format: "MULTIPLE_CHOICE" } });
  const tf = await prisma.question.count({ where: { format: "TRUE_FALSE" } });
  const sa = await prisma.question.count({ where: { format: "SHORT_ANSWER" } });
  console.log(`   ├── Trắc nghiệm: ${mc}`);
  console.log(`   ├── Đúng/Sai: ${tf}`);
  console.log(`   └── Trả lời ngắn: ${sa}`);

  for (const lv of [1, 2, 3, 4]) {
    const c = await prisma.question.count({ where: { difficulty: lv } });
    console.log(`   Mức ${lv}: ${c} câu`);
  }

  console.log("\n🎉 Seed hoàn tất!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
