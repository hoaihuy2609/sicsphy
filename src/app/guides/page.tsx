'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  FileDown,
  GraduationCap,
  FolderKanban,
  Wrench,
  Code,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Lightbulb,
  CheckCircle2,
  Terminal,
  Zap,
  ArrowRight,
  ShieldCheck,
  FileText,
  Sparkles,
} from 'lucide-react';

interface GuideModule {
  id: string;
  title: string;
  subTitle: string;
  badge: string;
  icon: any;
  path: string;
  description: string;
  steps: Array<{
    title: string;
    details: string;
  }>;
  endpoints: Array<{
    method: 'GET' | 'POST' | 'DELETE' | 'PUT';
    path: string;
    description: string;
    payload?: string;
  }>;
  tips: string[];
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const MODULES_DATA: GuideModule[] = [
  {
    id: 'question-bank',
    title: 'Ngân hàng đề (Question Bank)',
    subTitle: 'Kho dữ liệu câu hỏi số hóa chuẩn GDPT 2018 K10-K11-K12',
    badge: 'Phân hệ 1',
    icon: BookOpen,
    path: '/question-bank',
    description:
      'Hệ thống quản lý và tra cứu ngân hàng câu hỏi Vật lý thông minh được chuẩn hóa theo Chương, Bài học, Mức độ nhận thức (1: Nhận biết, 2: Thông hiểu, 3: Vận dụng, 4: Vận dụng cao) và 4 Dạng thức thi cử mới nhất của Bộ GD&ĐT (Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Trả lời ngắn, Tự luận).',
    steps: [
      {
        title: 'Bước 1: Điều hướng cây phân phối chương trình',
        details:
          'Tại thanh điều hướng bên trái, bấm chọn khối lớp (Vật lý 10, 11 hoặc 12). Hệ thống sẽ mở rộng danh mục Chương và từng Bài học cụ thể kèm số lượng câu hỏi hiện có trong kho.',
      },
      {
        title: 'Bước 2: Lọc đa chiều theo mức độ & dạng thức',
        details:
          'Sử dụng thanh công cụ lọc để chọn nhanh mức độ (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) hoặc dạng thức (Trắc nghiệm, Đúng/Sai, Trả lời ngắn). Có thể kết hợp ô tìm kiếm toàn văn để tra cứu từ khóa trong câu hỏi hoặc mã câu (ví dụ: V12.01.01.NB-01).',
      },
      {
        title: 'Bước 3: Xem công thức KaTeX & hình vẽ TikZ',
        details:
          'Mỗi thẻ câu hỏi hỗ trợ hiển thị công thức toán học và vật lý sắc nét theo chuẩn KaTeX. Bấm nút "Xem lời giải" để mở rộng hướng dẫn giải chi tiết và đáp án chấm điểm.',
      },
      {
        title: 'Bước 4: Chọn câu hỏi vào giỏ ma trận đề',
        details:
          'Tích chọn từng câu hỏi hoặc bấm "CHỌN TẤT CẢ (TỐI ĐA 22/28 CÂU)" trên thanh công cụ để đưa nhanh bộ câu hỏi vào giỏ chuẩn bị cho việc đảo đề và xuất bản.',
      },
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/api/questions?grade=12&difficulty=1&format=MULTIPLE_CHOICE&page=1&limit=20',
        description: 'Lọc, tìm kiếm toàn văn và phân trang danh sách câu hỏi kèm thống kê dạng thức.',
      },
      {
        method: 'POST',
        path: '/api/questions',
        description: 'Thêm mới câu hỏi vào cơ sở dữ liệu với mã định danh duy nhất và công thức KaTeX.',
        payload: '{\n  "code": "V12.01.01.NB-05",\n  "grade": 12,\n  "topicId": "topic_cuid",\n  "difficulty": 1,\n  "format": "MULTIPLE_CHOICE",\n  "content": "Một vật dao động điều hòa...",\n  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },\n  "correctAnswer": "A"\n}',
      },
      {
        method: 'GET',
        path: '/api/taxonomy',
        description: 'Lấy toàn bộ cây cấu trúc chương trình học: Khối lớp → Chương → Bài học.',
      },
      {
        method: 'POST',
        path: '/api/questions/batch',
        description: 'Tra cứu hàng loạt câu hỏi dựa trên danh sách ID hoặc mã câu (codes).',
        payload: '{ "ids": ["V12.01.01.NB-01", "V12.01.01.TH-02"] }',
      },
    ],
    tips: [
      'Gõ mã câu hỏi vào ô tìm kiếm (ví dụ V12.01) để lọc nhanh toàn bộ câu hỏi thuộc bài học mà không cần duyệt thủ công.',
      'Các câu hỏi có gắn nhãn [TikZ] tích hợp mã vector SVG tự động co giãn nét vẽ khi in mà không bị vỡ hạt như hình ảnh thông thường.',
    ],
  },
  {
    id: 'matrix-engine',
    title: 'Ma trận đề (Matrix Engine)',
    subTitle: 'Thiết kế & kiểm định ma trận đề thi theo chuẩn Bộ GD&ĐT 2025',
    badge: 'Phân hệ 2',
    icon: Layers,
    path: '/matrix',
    description:
      'Động cơ xây dựng cấu trúc đề thi Vật lý thông minh. Tự động kiểm tra và cảnh báo theo quy tắc 70/30 (70% mức độ nhận thức cơ bản, 30% mức độ nâng cao với dung sai ±5%). Hỗ trợ tự động bốc câu hỏi từ ngân hàng lấp đầy ma trận trong 1 thao tác.',
    steps: [
      {
        title: 'Bước 1: Chọn mẫu đề thi chuẩn hoặc tùy chỉnh',
        details:
          'Khởi tạo ma trận mới với định dạng chuẩn THPTQG 2025 (28 câu: 18 TN + 4 ĐS + 6 TLN), chuẩn truyền thống (22 câu: 12 TN + 4 ĐS + 6 TLN) hoặc cấu trúc đề kiểm tra định kỳ tùy chỉnh.',
      },
      {
        title: 'Bước 2: Gán chuyên đề và mức độ nhận thức cho từng slot',
        details:
          'Chọn từng vị trí câu trong ma trận để chỉ định bài học mục tiêu và mức độ nhận thức (Mức 1 đến Mức 4).',
      },
      {
        title: 'Bước 3: Kiểm định chuẩn 70/30',
        details:
          'Thanh tiến trình kiểm định phản hồi thời gian thực: Hiển thị tỉ lệ % Cơ bản (Nhận biết + Thông hiểu) và % Nâng cao (Vận dụng + Vận dụng cao). Khi đạt chuẩn, hệ thống gắn nhãn hợp lệ màu xanh lục.',
      },
      {
        title: 'Bước 4: Tự động gắp câu hỏi (Auto-Fill)',
        details:
          'Nhấn nút "Tự động chọn câu hỏi", thuật toán quét kho câu hỏi và bốc chính xác câu hỏi thỏa mãn đúng bài học và mức độ đã quy định trong từng slot.',
      },
      {
        title: 'Bước 5: Lưu ma trận vào thư viện',
        details:
          'Lưu ma trận đã kiểm định vào kho dữ liệu cá nhân để sử dụng lặp lại cho các đợt thi học kỳ hoặc chuyển tiếp sang phân hệ Trộn đề.',
      },
    ],
    endpoints: [
      {
        method: 'POST',
        path: '/api/matrix',
        description: 'Thao tác tạo, kiểm định 70/30, tự động phân bổ và lưu trữ cấu trúc ma trận.',
        payload: '{\n  "action": "validate",\n  "matrix": { ... }\n}',
      },
      {
        method: 'GET',
        path: '/api/matrix?grade=12',
        description: 'Lấy danh sách các ma trận đã lưu trữ của khối lớp chỉ định.',
      },
    ],
    tips: [
      'Công thức kiểm định chuẩn MathTIAD: Math.abs(basicPercent - 70) <= 5. Tỉ lệ cơ bản nằm từ 65% đến 75% được coi là hợp lệ.',
      'Cấu trúc điểm thi chuẩn Bộ 2025: Phần I (18 câu x 0.25đ = 4.5đ), Phần II (4 câu x 1.0đ = 4.0đ), Phần III (6 câu x 0.25đ = 1.5đ). Tổng 10.0 điểm.',
    ],
  },
  {
    id: 'shuffle-export',
    title: 'Trộn đề & Xuất Word (Shuffle & Export)',
    subTitle: 'Thuật toán đảo đề sư phạm & xuất file .docx chuẩn văn bản Bộ',
    badge: 'Phân hệ 3',
    icon: FileDown,
    path: '/word-editor',
    description:
      'Hệ thống trộn câu hỏi giữ nguyên tính trật tự sư phạm (không đảo lẫn giữa các phần trắc nghiệm, đúng/sai và điền số), hoán vị ngẫu nhiên các phương án lựa chọn và tự động tái lập bảng ma trận đáp án tương ứng cho từng mã đề thi.',
    steps: [
      {
        title: 'Bước 1: Thiết lập thông tin hành chính',
        details:
          'Điền tiêu đề đề thi, tên Trường THPT, Sở Giáo dục và thời gian làm bài (ví dụ: 50 phút). Các thông tin này sẽ được in trang trọng tại góc trên của tệp Word.',
      },
      {
        title: 'Bước 2: Cài đặt số lượng mã đề xáo trộn',
        details:
          'Kéo thanh trượt để chọn số lượng mã đề cần tạo từ 1 đến 24 mã đề (thường chọn 4 hoặc 8 mã đề: 101, 102, 103, 104...).',
      },
      {
        title: 'Bước 3: Nạp danh sách câu hỏi',
        details:
          'Dán danh sách mã câu hỏi vào khung nhập văn bản, hoặc bấm "Chọn từ ma trận" để nạp trực tiếp toàn bộ câu hỏi từ ma trận đã thiết kế.',
      },
      {
        title: 'Bước 4: Xem trước đề thi & Bảng đáp án',
        details:
          'Kiểm tra định dạng trang bìa, nội dung các phần thi và bảng đáp án dự kiến trước khi xuất tài liệu.',
      },
      {
        title: 'Bước 5: Tải về tệp Word (.docx)',
        details:
          'Bấm "Xuất Word (.docx)", hệ thống đóng gói tệp tin Office Open XML hoàn chỉnh kèm mã đề thi và bảng ma trận đáp án riêng biệt để giáo viên in ấn trực tiếp.',
      },
    ],
    endpoints: [
      {
        method: 'POST',
        path: '/api/exam/export/word',
        description: 'Biên dịch danh sách câu hỏi thành tệp tin Word (.docx) đa mã đề tải xuống.',
        payload: '{\n  "questionIds": ["cuid1", "cuid2", ...],\n  "examTitle": "ĐỀ THI VẬT LÝ 12",\n  "schoolName": "THPT CHUYÊN KHTN",\n  "mixCount": 4,\n  "grade": 12,\n  "duration": 50\n}',
      },
      {
        method: 'POST',
        path: '/api/exam/shuffle',
        description: 'Trộn câu hỏi và trả về dữ liệu JSON các biến thể mã đề và bảng đáp án rút gọn.',
      },
    ],
    tips: [
      'File Word sinh ra có bảng đáp án tự động nằm ở các trang cuối, sẵn sàng cho công tác chấm thi tự động bằng máy quét phiếu trắc nghiệm.',
      'Các câu hỏi Đúng/Sai (Phần II) được giữ nguyên mệnh đề chính và xáo trộn vị trí 4 phát biểu a, b, c, d với điểm số tương ứng: 1 ý đúng (0.1đ), 2 ý (0.25đ), 3 ý (0.5đ), 4 ý (1.0đ).',
    ],
  },
  {
    id: 'exam-papers',
    title: 'Đề thi trường/sở (Exam Papers)',
    subTitle: 'Ngân hàng đề thi thử THPT Quốc gia & đề thi tuyển sinh toàn quốc',
    badge: 'Phân hệ 4',
    icon: GraduationCap,
    path: '/principal-exam',
    description:
      'Thư viện đề thi thực tế được sưu tầm và số hóa từ các trường THPT Chuyên, các Sở GD&ĐT danh tiếng trên cả nước (Hà Nội, TP.HCM, Nam Định, Nghệ An, Hải Phòng, Huế...). Hỗ trợ phân tích cấu trúc và gắp câu hỏi hay vào ngân hàng cá nhân.',
    steps: [
      {
        title: 'Bước 1: Tra cứu theo phân loại đề',
        details:
          'Chọn danh mục đề mong muốn: Đề Trường, Đề Sở GD&ĐT, Đề VIP, Đề thi chọn Học sinh giỏi hoặc Đề Tuyển sinh vào lớp 10 chuyên.',
      },
      {
        title: 'Bước 2: Tìm kiếm theo tỉnh thành & năm học',
        details:
          'Lọc nhanh theo tỉnh thành ra đề và năm học phát hành (ví dụ: 2024-2025) để bám sát xu thế ra đề đổi mới nhất.',
      },
      {
        title: 'Bước 3: Đọc đề & Xem đáp án chi tiết',
        details:
          'Mở chi tiết đề thi để duyệt qua từng câu hỏi kèm thang điểm chuẩn và phương pháp giải nhanh bằng máy tính cầm tay.',
      },
      {
        title: 'Bước 4: Tái cấu trúc thành đề kiểm tra của trường',
        details:
          'Chọn các câu hỏi đặc sắc từ đề thi trường/sở để đưa vào ma trận soạn đề mới cho trường mình giảng dạy.',
      },
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/api/library?type=papers&grade=12&page=1&limit=20',
        description: 'Lấy danh sách các đề thi trường/sở đã lưu trữ trong hệ thống.',
      },
    ],
    tips: [
      'Đề thi từ các Sở Giáo dục (Nam Định, Hà Tĩnh, Bắc Ninh) thường có các câu hỏi Đúng/Sai và Trả lời ngắn rất sáng tạo theo mô hình ứng dụng thực tiễn.',
    ],
  },
  {
    id: 'library',
    title: 'Quản lý (Library)',
    subTitle: 'Trung tâm quản trị nội dung, dữ liệu lưu trữ & lịch sử làm việc',
    badge: 'Phân hệ 5',
    icon: FolderKanban,
    path: '/library',
    description:
      'Trung tâm điều hành dữ liệu cá nhân của giáo viên: Quản lý toàn bộ danh sách ma trận đã tạo, các bộ đề thi đã xáo trộn, đề thi trường/sở yêu thích và theo dõi toàn bộ nhật ký thao tác lịch sử làm việc.',
    steps: [
      {
        title: 'Bước 1: Xem thẻ thống kê tổng quan',
        details:
          'Theo dõi số lượng câu hỏi trong ngân hàng, số ma trận đã lưu trữ, số đề thi đã xuất bản và dung lượng tệp tin đính kèm.',
      },
      {
        title: 'Bước 2: Quản lý danh mục ma trận',
        details:
          'Tìm kiếm, xem lại cấu trúc chi tiết, nạp vào trình soạn thảo Word hoặc xóa bỏ các ma trận cũ không còn sử dụng.',
      },
      {
        title: 'Bước 3: Quản lý đề thi đã tạo',
        details:
          'Xem lại các bộ đề thi đã đảo trong quá khứ kèm danh sách mã câu hỏi ban đầu, tải lại file Word khi cần bổ sung mã đề in thêm cho học sinh.',
      },
      {
        title: 'Bước 4: Giám sát nhật ký hoạt động (Work History)',
        details:
          'Nhật ký lưu vết chi tiết từng thao tác: thời gian xuất đề Word, tạo ma trận, xóa tài liệu hoặc nhập dữ liệu câu hỏi.',
      },
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/api/library?type=all',
        description: 'Lấy dữ liệu tổng hợp: thống kê số lượng, ma trận, đề thi và lịch sử làm việc gần nhất.',
      },
      {
        method: 'GET',
        path: '/api/library?type=history&limit=20',
        description: 'Lấy danh sách nhật ký thao tác người dùng (Work History).',
      },
      {
        method: 'DELETE',
        path: '/api/library',
        description: 'Xóa một mục lưu trữ khỏi cơ sở dữ liệu theo loại và mã ID.',
        payload: '{ "type": "matrix", "id": "matrix_cuid" }',
      },
    ],
    tips: [
      'Có thể sao chép nhanh ID câu hỏi từ các bản ghi lịch sử xuất đề cũ để tái sử dụng ngay trong trang Soạn Word.',
    ],
  },
  {
    id: 'utilities',
    title: 'Tiện ích (Utilities)',
    subTitle: 'Bộ công cụ phân tích văn bản, chuẩn hóa công thức & nhập hàng loạt',
    badge: 'Phân hệ 6',
    icon: Wrench,
    path: '/utilities',
    description:
      'Tập hợp các công cụ chuyên dụng cho giáo viên Vật lý: Nhận diện tự động câu hỏi từ văn bản thô, chuyển đổi công thức MathType sang LaTeX chuẩn, phát hiện trùng lặp nội dung câu hỏi và hỗ trợ gán mã chuẩn.',
    steps: [
      {
        title: 'Bước 1: Dán văn bản câu hỏi thô từ Word/PDF',
        details:
          'Sao chép nội dung bài kiểm tra hoặc tài liệu có sẵn vào khung phân tích tiện ích.',
      },
      {
        title: 'Bước 2: Tự động tách câu & phương án A-B-C-D',
        details:
          'Hệ thống dùng thuật toán biểu thức chính quy (Regex) bóc tách tiêu đề câu hỏi, các phương án lựa chọn và từ khóa đáp án đúng.',
      },
      {
        title: 'Bước 3: Chuẩn hóa công thức sang KaTeX',
        details:
          'Tự động thay thế các ký hiệu toán học phổ biến (phân số, căn bậc hai, vecto, tích phân, đơn vị đo) sang cú pháp LaTeX chuẩn.',
      },
      {
        title: 'Bước 4: Đẩy trực tiếp vào Ngân hàng câu hỏi',
        details:
          'Kiểm tra lại kết quả nhận diện và bấm "Lưu vào ngân hàng" với khối lớp và bài học tương ứng.',
      },
    ],
    endpoints: [
      {
        method: 'POST',
        path: '/api/utilities/parse',
        description: 'Tiện ích bóc tách văn bản câu hỏi thô thành danh sách đối tượng câu hỏi chuẩn hóa.',
      },
    ],
    tips: [
      'Định dạng văn bản khuyên dùng: Câu hỏi bắt đầu bằng "Câu 1.", các phương án viết "A. ", "B. ", "C. ", "D. " ở đầu dòng để bộ parser nhận diện đạt độ chính xác 100%.',
    ],
  },
  {
    id: 'latex-compiler',
    title: 'Biên dịch LaTeX & TikZ (LaTeX Compiler)',
    subTitle: 'Trình biên dịch mã nguồn TikZ trực quan cho sơ đồ & hình vẽ Vật lý',
    badge: 'Phân hệ 7',
    icon: Code,
    path: '/latex-compiler',
    description:
      'Môi trường soạn thảo và biên dịch mã nguồn LaTeX / TikZ chuyên dụng cho môn Vật lý. Hỗ trợ sẵn các thư viện mẫu vẽ đồ thị dao động, sơ đồ mạch điện xoay chiều R-L-C, con lắc lò xo và hiện tượng quang hình học.',
    steps: [
      {
        title: 'Bước 1: Truy cập trình biên dịch LaTeX',
        details:
          'Mở mục "BIÊN DỊCH LATEX" từ thanh menu bên trái để truy cập không gian làm việc.',
      },
      {
        title: 'Bước 2: Chọn mẫu hình vẽ Vật lý có sẵn',
        details:
          'Bấm chọn trong danh mục thư viện mẫu: Mạch điện RLC nối tiếp, Sơ đồ phản xạ ánh sáng, Đồ thị thế năng đàn hồi, Sơ đồ phóng xạ hạt nhân...',
      },
      {
        title: 'Bước 3: Chỉnh sửa mã nguồn TikZ',
        details:
          'Điều chỉnh trực tiếp các thông số tọa độ, tên linh kiện hoặc màu sắc của đường đồ thị ngay trên khung soạn thảo mã nguồn.',
      },
      {
        title: 'Bước 4: Xem trước hình ảnh vector sắc nét',
        details:
          'Màn hình hiển thị kết quả render tức thời dạng đồ họa vector SVG chất lượng cao không bị méo mó hạt ảnh.',
      },
      {
        title: 'Bước 5: Nhúng vào câu hỏi trong ngân hàng',
        details:
          'Sao chép đoạn mã TikZ đã kiểm tra và dán vào trường `tikzCode` của câu hỏi tương ứng trong ngân hàng câu hỏi.',
      },
    ],
    endpoints: [
      {
        method: 'POST',
        path: '/api/latex/compile',
        description: 'Biên dịch mã nguồn LaTeX / TikZ sang hình ảnh SVG vector hiển thị trên web.',
      },
    ],
    tips: [
      'Nên dùng cú pháp chuẩn \\begin{tikzpicture} ... \\end{tikzpicture} để đảm bảo tính tương thích tuyệt đối cả trên giao diện web lẫn khi xuất ra văn bản Word.',
    ],
  },
];

const FAQS_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Xuất Word & Đề thi',
    question: 'Tài liệu Word (.docx) xuất ra từ hệ thống có bị lỗi font hoặc mất công thức toán học không?',
    answer:
      'Hoàn toàn không. Động cơ Word Export của ScisPhy sử dụng thư viện docx chuẩn Office Open XML, xuất trực tiếp sang chuẩn văn bản Unicode tương thích 100% với Microsoft Word 2016, 2019, 2021 và Microsoft 365. Các công thức toán học và vật lý được định dạng rõ ràng, căn lề chuẩn trang A4 và hỗ trợ sẵn bảng chấm trắc nghiệm ở cuối file.',
  },
  {
    id: 'faq-2',
    category: 'Ma trận & Kiểm định',
    question: 'Quy tắc kiểm định 70/30 trong ma trận đề thi là gì và vì sao cần tuân thủ?',
    answer:
      'Quy tắc 70/30 là quy chuẩn phân hóa đề thi chính thức của Bộ Giáo dục & Đào tạo. Theo đó, 70% tổng số điểm thuộc nhóm mức độ nhận thức cơ bản (Nhận biết + Thông hiểu) nhằm xét công nhận tốt nghiệp THPT; 30% còn lại thuộc nhóm nâng cao (Vận dụng + Vận dụng cao) nhằm mục đích phân loại học sinh cho xét tuyển đại học. Hệ thống ScisPhy tự động tính toán và cho phép dung sai an toàn ±5% (tức tỉ lệ cơ bản từ 65% đến 75%).',
  },
  {
    id: 'faq-3',
    category: 'Trộn đề thi',
    question: 'Hệ thống xáo trộn đề thi như thế nào để đảm bảo tính sư phạm?',
    answer:
      'Khác với các phần mềm đảo đề đơn thuần xáo tung mọi câu hỏi, thuật toán Shuffle Engine của ScisPhy bảo toàn nguyên vẹn 3 phần thi theo chuẩn Bộ GD&ĐT 2025: Phần I (Trắc nghiệm nhiều lựa chọn), Phần II (Đúng/Sai) và Phần III (Trả lời ngắn). Trong từng phần, các câu hỏi và phương án A-B-C-D được xáo trộn ngẫu nhiên, đồng thời hệ thống tự động sinh bảng ma trận đáp án tương ứng cho từng mã đề thi.',
  },
  {
    id: 'faq-4',
    category: 'Ngân hàng câu hỏi',
    question: 'Làm thế nào để thêm một câu hỏi mới kèm công thức Toán/Lý phức tạp?',
    answer:
      'Tại trang Ngân hàng đề, bấm "Thêm câu hỏi". Bạn có thể nhập công thức theo cú pháp LaTeX quen thuộc: đặt giữa dấu $...$ cho công thức nằm trong dòng (ví dụ: $x = A\\cos(\\omega t + \\varphi)$) hoặc $$...$$ cho công thức nằm riêng một dòng độc lập. Hệ thống sẽ hiển thị bản xem trước tức thời qua trình render KaTeX.',
  },
  {
    id: 'faq-5',
    category: 'Lưu trữ & Thư viện',
    question: 'Tôi có thể tải lại file Word của đề thi đã xuất từ tuần trước không?',
    answer:
      'Hoàn toàn được. Bạn chỉ cần vào mục "QUẢN LÝ" (Library) hoặc mở trang "SOẠN WORD", cuộn xuống phần "3. Lịch sử xuất đề & Hoạt động gần đây". Tất cả các đợt xuất đề thi đều được lưu trữ đầy đủ kèm thông tin số mã đề, danh sách mã câu hỏi và thời gian xuất bản để bạn có thể tái tạo hoặc xuất lại bất cứ lúc nào.',
  },
  {
    id: 'faq-6',
    category: 'Cấu trúc đề 2025',
    question: 'Điểm số của phần thi Trắc nghiệm Đúng/Sai (Phần II) được tính như thế nào?',
    answer:
      'Theo quy chế thi tốt nghiệp THPT từ năm 2025 của Bộ GD&ĐT, mỗi câu trắc nghiệm Đúng/Sai có 4 lệnh hỏi a, b, c, d với thang điểm lũy tiến: Đúng 1 ý được 0.1 điểm; Đúng 2 ý được 0.25 điểm; Đúng 3 ý được 0.5 điểm; Đúng cả 4 ý được 1.0 điểm tròn. Tổng điểm toàn bộ 4 câu Phần II là 4.0 điểm.',
  },
];

export default function GuidesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'question-bank': true,
    'matrix-engine': true,
    'shuffle-export': true,
  });
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': true,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFaq = (id: string) => {
    setExpandedFaqs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allSec: Record<string, boolean> = {};
    MODULES_DATA.forEach((m) => {
      allSec[m.id] = true;
    });
    setExpandedSections(allSec);

    const allFaqs: Record<string, boolean> = {};
    FAQS_DATA.forEach((f) => {
      allFaqs[f.id] = true;
    });
    setExpandedFaqs(allFaqs);
  };

  const collapseAll = () => {
    setExpandedSections({});
    setExpandedFaqs({});
  };

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return MODULES_DATA;
    const q = searchQuery.toLowerCase();
    return MODULES_DATA.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subTitle.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.steps.some((s) => s.title.toLowerCase().includes(q) || s.details.toLowerCase().includes(q)) ||
        m.tips.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Filter FAQs based on search
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS_DATA;
    const q = searchQuery.toLowerCase();
    return FAQS_DATA.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto text-[#1a0a0a]">
      {/* 1. TOP HERO HEADER */}
      <div className="bg-[#59080b] text-white rounded-2xl p-6 shadow-sm border border-[#3a0002] relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#f0a500]/15 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#f0a500] text-stone-900 text-[11px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                Tài liệu hướng dẫn
              </span>
              <span className="text-stone-300 text-xs">• Phiên bản GDPT 2018 / 2025</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition"
              >
                Mở rộng tất cả
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition"
              >
                Thu gọn tất cả
              </button>
            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <span>HƯỚNG DẪN SỬ DỤNG HỆ THỐNG SCISPHY</span>
          </h1>

          <p className="text-xs md:text-sm text-stone-200 max-w-3xl leading-relaxed">
            Tài liệu hướng dẫn nghiệp vụ toàn diện dành cho giáo viên và ban chuyên môn Vật lý. Bao gồm 7 phân hệ cốt lõi: Quản lý ngân hàng câu hỏi, thiết kế ma trận chuẩn Bộ GD&ĐT 2025, đảo đề thi thông minh, xuất văn bản Word (.docx), tham khảo đề trường/sở và biên dịch mã nguồn LaTeX.
          </p>

          {/* Quick Search Bar */}
          <div className="pt-2 max-w-xl">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nội dung hướng dẫn, phân hệ hoặc câu hỏi thường gặp..."
                className="w-full pl-9 pr-4 py-2.5 bg-white text-[#1a0a0a] rounded-xl text-xs placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#f0a500] shadow-sm font-medium"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-stone-400 hover:text-stone-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUICK NAVIGATION PILLS */}
      <div className="bg-white p-3 rounded-xl border border-[#e8ddd6] shadow-sm flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-stone-600 text-[11px] uppercase mr-1">Phân hệ:</span>
        {MODULES_DATA.map((m) => (
          <a
            key={m.id}
            href={`#${m.id}`}
            onClick={(e) => {
              e.preventDefault();
              setExpandedSections((prev) => ({ ...prev, [m.id]: true }));
              const el = document.getElementById(m.id);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-2.5 py-1 rounded-lg border border-[#e8ddd6] bg-stone-50 hover:bg-[#fff8eb] hover:border-[#f0a500] hover:text-[#59080b] font-semibold text-stone-700 text-[11px] transition flex items-center gap-1.5"
          >
            <span>{m.title.split('(')[0].trim()}</span>
          </a>
        ))}
        <a
          href="#faqs"
          className="px-2.5 py-1 rounded-lg border border-[#f0a500] bg-[#fff8eb] font-bold text-[#59080b] text-[11px] hover:bg-[#ffeec2] transition flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#f0a500]" />
          <span>Hỏi đáp (FAQ)</span>
        </a>
      </div>

      {/* 3. ACCORDION SECTIONS FOR EACH MODULE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#59080b] uppercase tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#59080b]" />
            <span>HƯỚNG DẪN CHI TIẾT 7 PHÂN HỆ NGHIỆP VỤ</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium">
            Hiển thị {filteredModules.length} / {MODULES_DATA.length} phân hệ
          </span>
        </div>

        {filteredModules.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#e8ddd6] text-center text-stone-400 space-y-2">
            <Search className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-xs font-semibold text-stone-700">Không tìm thấy phân hệ nào khớp với từ khóa</p>
            <p className="text-[11px]">Vui lòng thử tìm với từ khóa khác như: ma trận, xuất word, tikz, câu hỏi...</p>
          </div>
        ) : (
          filteredModules.map((module, index) => {
            const isExpanded = !!expandedSections[module.id];
            const IconComponent = module.icon;

            return (
              <div
                key={module.id}
                id={module.id}
                className="bg-white rounded-xl border border-[#e8ddd6] shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(module.id)}
                  className={`w-full p-4 text-left flex items-center justify-between gap-3 transition ${
                    isExpanded
                      ? 'bg-[#59080b] text-white'
                      : 'bg-white hover:bg-stone-50 text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                        isExpanded
                          ? 'bg-[#f0a500] text-stone-900 shadow-sm'
                          : 'bg-[#fff8eb] text-[#59080b] border border-[#f0a500]/40'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isExpanded
                              ? 'bg-white/20 text-white'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {module.badge}
                        </span>
                        <h3 className="text-sm font-bold tracking-tight">
                          {module.title}
                        </h3>
                      </div>
                      <p
                        className={`text-xs mt-0.5 line-clamp-1 ${
                          isExpanded ? 'text-stone-200' : 'text-stone-500'
                        }`}
                      >
                        {module.subTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold hidden sm:inline ${
                        isExpanded ? 'text-stone-200' : 'text-stone-400'
                      }`}
                    >
                      {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        isExpanded ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="p-5 space-y-5 border-t border-[#e8ddd6] bg-white text-xs">
                    {/* Description */}
                    <div className="bg-[#faf8f6] p-3.5 rounded-lg border border-[#e8ddd6] flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#f0a500]/20 text-[#59080b] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#59080b]" />
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-[#59080b] block uppercase text-[11px]">
                          Tổng quan phân hệ:
                        </span>
                        <p className="text-stone-700 leading-relaxed font-normal">
                          {module.description}
                        </p>
                      </div>
                      <Link
                        href={module.path}
                        className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-[#59080b] text-white rounded-md font-bold text-[11px] hover:bg-[#4a0a0c] transition flex-shrink-0 shadow-sm"
                      >
                        <span>Mở phân hệ</span>
                        <ArrowRight className="w-3 h-3 text-[#f0a500]" />
                      </Link>
                    </div>

                    {/* Step-by-step Instructions */}
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-stone-900 uppercase tracking-wide text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Quy trình thao tác từng bước (Step-by-step instructions)</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {module.steps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-lg border border-stone-200 bg-stone-50/70 hover:bg-white hover:border-stone-300 transition space-y-1"
                          >
                            <span className="font-bold text-[#59080b] text-xs block">
                              {step.title}
                            </span>
                            <p className="text-stone-600 leading-relaxed text-[11px]">
                              {step.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* API Endpoints Reference */}
                    <div className="space-y-2 pt-1">
                      <h4 className="font-bold text-stone-900 uppercase tracking-wide text-xs flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-[#59080b]" />
                        <span>Đặc tả giao diện API (API Endpoints Reference)</span>
                      </h4>

                      <div className="space-y-2">
                        {module.endpoints.map((ep, eIdx) => (
                          <div
                            key={eIdx}
                            className="p-3 bg-stone-900 text-stone-100 rounded-lg font-mono text-[11px] space-y-1.5 shadow-inner"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  ep.method === 'GET'
                                    ? 'bg-blue-600 text-white'
                                    : ep.method === 'POST'
                                    ? 'bg-emerald-600 text-white'
                                    : ep.method === 'DELETE'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-600 text-white'
                                }`}
                              >
                                {ep.method}
                              </span>
                              <span className="text-[#f0a500] font-semibold break-all">
                                {ep.path}
                              </span>
                            </div>
                            <p className="text-stone-300 font-sans text-xs">
                              {ep.description}
                            </p>
                            {ep.payload && (
                              <div className="mt-1 pt-1 border-t border-stone-700">
                                <span className="text-stone-400 text-[10px] font-sans block mb-1">
                                  Request Payload mẫu (JSON):
                                </span>
                                <pre className="bg-black/40 p-2 rounded text-[10px] text-emerald-400 overflow-x-auto">
                                  {ep.payload}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips and Notes */}
                    <div className="space-y-2 pt-1">
                      <h4 className="font-bold text-stone-900 uppercase tracking-wide text-xs flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-[#f0a500]" />
                        <span>Mẹo & Lưu ý quan trọng (Tips and notes)</span>
                      </h4>

                      <div className="space-y-1.5">
                        {module.tips.map((tip, tIdx) => (
                          <div
                            key={tIdx}
                            className="bg-[#fff8eb] p-2.5 rounded-lg border border-[#f0a500]/50 text-stone-800 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f0a500] mt-1.5 flex-shrink-0" />
                            <p className="text-xs leading-relaxed font-medium">
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. FAQ SECTION AT THE BOTTOM */}
      <div id="faqs" className="bg-white rounded-2xl border border-[#e8ddd6] shadow-sm overflow-hidden space-y-4 p-5 md:p-6">
        <div className="border-b border-[#e8ddd6] pb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#fff8eb] border border-[#f0a500] flex items-center justify-center text-[#59080b]">
              <HelpCircle className="w-5 h-5 text-[#f0a500]" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-[#59080b] uppercase tracking-wide">
                CÂU HỎI THƯỜNG GẶP (FAQ)
              </h2>
              <p className="text-xs text-stone-500">
                Giải đáp các thắc mắc phổ biến về quy chế thi 2025, xuất file Word và kỹ thuật biên dịch
              </p>
            </div>
          </div>

          <span className="text-xs font-bold bg-[#fff8eb] text-[#59080b] px-3 py-1 rounded-full border border-[#f0a500]/40">
            {filteredFaqs.length} câu hỏi
          </span>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isFaqExpanded = !!expandedFaqs[faq.id];

            return (
              <div
                key={faq.id}
                className="border border-[#e8ddd6] rounded-xl overflow-hidden hover:border-stone-400 transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-3.5 text-left bg-stone-50/60 hover:bg-[#fff8eb]/40 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="bg-[#59080b] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {faq.category}
                    </span>
                    <span className="text-xs font-bold text-stone-900">
                      {faq.question}
                    </span>
                  </div>
                  <div className="text-stone-500 flex-shrink-0">
                    {isFaqExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isFaqExpanded && (
                  <div className="p-4 bg-white border-t border-[#e8ddd6] text-xs text-stone-700 leading-relaxed font-normal">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Banner Footer */}
        <div className="bg-[#faf8f6] p-4 rounded-xl border border-[#e8ddd6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-stone-700">
              Bạn có câu hỏi hoặc cần hỗ trợ chuyên sâu về nghiệp vụ Vật lý? Liên hệ ban quản trị ScisPhy.
            </p>
          </div>
          <Link
            href="/question-bank"
            className="px-4 py-2 bg-[#59080b] hover:bg-[#440003] text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <span>Bắt đầu trải nghiệm ngay</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#f0a500]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
