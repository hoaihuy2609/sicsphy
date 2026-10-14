'use client';

import React, { useState, useEffect, useRef } from 'react';

// ============================================
// TYPES
// ============================================

interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  structure: {
    mc: number;
    tf: number;
    sa: number;
    total: number;
  };
  duration: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface TemplateFormData {
  schoolName: string;
  examTitle: string;
  subject: string;
  grade: number;
  duration: number;
  schoolYear: string;
  examCode: string;
  includeAnswerKey: boolean;
}

// ============================================
// SAMPLE PHYSICS LATEX
// ============================================

const SAMPLE_LATEX = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\usepackage{multicol}
\\usepackage{enumitem}

\\geometry{left=2cm,right=2cm,top=2cm,bottom=2cm}

\\begin{document}

\\begin{center}
\\textbf{SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI}\\\\
\\textbf{TRƯỜNG THPT CHUYÊN HÀ NỘI - AMSTERDAM}\\\\[0.5em]
\\rule{0.6\\textwidth}{0.5pt}\\\\[0.5em]
{\\Large \\textbf{ĐỀ KHẢO SÁT CHẤT LƯỢNG HỌC KỲ I - VẬT LÝ 12}}\\\\[0.3em]
\\textbf{Năm học 2024 - 2025}\\\\
\\textit{Thời gian làm bài: 50 phút (không kể thời gian phát đề)}\\\\[0.3em]
\\textbf{Mã đề: 101}
\\end{center}

\\vspace{0.5em}
\\hrule
\\vspace{0.5em}

\\section*{PHẦN I. Câu trắc nghiệm nhiều lựa chọn (4,5 điểm)}
\\textit{Thí sinh trả lời từ Câu 1 đến Câu 4. Mỗi câu hỏi thí sinh chỉ chọn một phương án.}

\\begin{enumerate}[label=\\textbf{Câu \\arabic*.}]
  \\item Một vật dao động điều hòa theo phương trình $x = A \\cos(\\omega t + \\varphi)$. Đại lượng $\\omega$ được gọi là
  \\begin{multicols}{4}
    \\begin{enumerate}[label=\\textbf{\\Alph*.}]
      \\item pha dao động.
      \\item chu kì dao động.
      \\item tần số góc.
      \\item biên độ dao động.
    \\end{enumerate}
  \\end{multicols}

  \\item Một con lắc lò xo gồm vật nhỏ khối lượng $m = 200\\text{ g}$ và lò xo có độ cứng $k = 50\\text{ N/m}$. Tần số góc riêng của dao động là
  \\begin{multicols}{4}
    \\begin{enumerate}[label=\\textbf{\\Alph*.}]
      \\item $15{,}8\\text{ rad/s}$.
      \\item $25\\text{ rad/s}$.
      \\item $5\\text{ rad/s}$.
      \\item $50\\text{ rad/s}$.
    \\end{enumerate}
  \\end{multicols}

  \\item Trong quá trình biến đổi đẳng nhiệt của một lượng khí lý tưởng xác định, phương trình trạng thái thỏa mãn hệ thức:
  \\begin{multicols}{4}
    \\begin{enumerate}[label=\\textbf{\\Alph*.}]
      \\item $p \\cdot V = \\text{hằng số}$.
      \\item $\\frac{p}{V} = \\text{hằng số}$.
      \\item $\\frac{V}{T} = \\text{hằng số}$.
      \\item $p \\cdot T = \\text{hằng số}$.
    \\end{enumerate}
  \\end{multicols}

  \\item Một sóng cơ lan truyền với bước sóng $\\lambda = 20\\text{ cm}$. Khoảng cách ngắn nhất giữa hai điểm trên cùng phương truyền sóng dao động ngược pha là
  \\begin{multicols}{4}
    \\begin{enumerate}[label=\\textbf{\\Alph*.}]
      \\item $10\\text{ cm}$.
      \\item $20\\text{ cm}$.
      \\item $5\\text{ cm}$.
      \\item $40\\text{ cm}$.
    \\end{enumerate}
  \\end{multicols}
\\end{enumerate}

\\section*{PHẦN II. Câu trắc nghiệm đúng sai (2,0 điểm)}
\\textit{Thí sinh trả lời câu hỏi sau. Trong mỗi ý a), b), c), d), thí sinh chọn đúng hoặc sai.}

\\begin{enumerate}[label=\\textbf{Câu \\arabic*.}]
  \\item Cho một lượng khí lý tưởng chứa trong xi lanh kín có pít-tông di động. Khi truyền cho chất khí nhiệt lượng $Q = 120\\text{ J}$, chất khí dãn nở và sinh công $A' = 40\\text{ J}$ đẩy pít-tông.
  \\begin{enumerate}[label=\\textbf{\\alph*)}]
    \\item Theo quy ước dấu nhiệt động lực học, công chất khí nhận là $A = -40\\text{ J}$.
    \\item Độ biến thiên nội năng của lượng khí trong quá trình là $\\Delta U = 80\\text{ J}$.
    \\item Nhiệt độ tuyệt đối của lượng khí giảm đi sau quá trình này.
    \\item Quá trình giãn nở này là một chu trình tuần hoàn kín.
  \\end{enumerate}
\\end{enumerate}

\\section*{PHẦN III. Câu trắc nghiệm trả lời ngắn (1,5 điểm)}
\\textit{Thí sinh điền kết quả dạng số vào bài làm.}

\\begin{enumerate}[label=\\textbf{Câu \\arabic*.}]
  \\item Một dây đàn hồi căng ngang có chiều dài $L = 1{,}2\\text{ m}$ hai đầu cố định, trên dây xuất hiện sóng dừng với 3 bụng sóng. Biết tốc độ truyền sóng là $v = 24\\text{ m/s}$. Tần số dao động của sóng trên dây là bao nhiêu Hertz (Hz)?
\\end{enumerate}

\\vfill
\\begin{center}
\\rule{0.4\\textwidth}{0.5pt}\\\\
\\textbf{--- HẾT ---}
\\end{center}

\\end{document}`;

// Common physics sample questions for template generator
const DEFAULT_QUESTIONS_BY_GRADE: Record<number, { mc: any[]; tf: any[]; sa: any[] }> = {
  12: {
    mc: [
      {
        content: 'Một vật dao động điều hòa theo phương trình $x = A\\cos(\\omega t + \\varphi)$. Gia tốc cực đại của vật có độ lớn là',
        options: ['$\\omega^2 A$', '$\\omega A$', '$\\frac{1}{2}\\omega^2 A$', '$\\omega A^2$'],
        correctAnswer: 'A',
      },
      {
        content: 'Nhiệt độ Celsius ($^\\circ\\text{C}$) và nhiệt độ Kelvin ($\\text{K}$) liên hệ với nhau theo công thức',
        options: ['$T = t + 273{,}15$', '$T = t - 273{,}15$', '$T = 273{,}15 - t$', '$T = 1{,}8t + 32$'],
        correctAnswer: 'A',
      },
      {
        content: 'Một lượng khí lý tưởng có áp suất $p_1 = 1\\text{ atm}$, thể tích $V_1 = 4\\text{ lít}$. Giãn nở đẳng nhiệt đến thể tích $V_2 = 8\\text{ lít}$. Áp suất $p_2$ là',
        options: ['$0{,}5\\text{ atm}$', '$2{,}0\\text{ atm}$', '$1{,}5\\text{ atm}$', '$4{,}0\\text{ atm}$'],
        correctAnswer: 'A',
      },
      {
        content: 'Một sóng cơ có tần số $f = 50\\text{ Hz}$ truyền với tốc độ $v = 150\\text{ m/s}$. Bước sóng của sóng bằng',
        options: ['$3\\text{ m}$', '$7500\\text{ m}$', '$0{,}33\\text{ m}$', '$100\\text{ m}$'],
        correctAnswer: 'A',
      },
      {
        content: 'Đại lượng nào sau đây đặc trưng cho mức độ trật tự hay hỗn loạn của hệ nhiệt động lực học?',
        options: ['Entropy ($S$)', 'Áp suất ($p$)', 'Thể tích ($V$)', 'Khối lượng ($m$)'],
        correctAnswer: 'A',
      },
      {
        content: 'Nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn $m\\text{ (kg)}$ chất rắn kết tinh ở nhiệt độ nóng chảy là',
        options: ['$Q = \\lambda m$', '$Q = mc\\Delta T$', '$Q = L m$', '$Q = \\frac{m}{\\lambda}$'],
        correctAnswer: 'A',
      },
      {
        content: 'Từ thông qua một khung dây kín biến thiên theo thời gian tạo ra suất điện động cảm ứng có độ lớn tính theo định luật Faraday:',
        options: ['$e_c = -\\frac{\\Delta\\Phi}{\\Delta t}$', '$e_c = -L\\frac{\\Delta i}{\\Delta t}$', '$e_c = B \\cdot S$', '$e_c = I \\cdot R$'],
        correctAnswer: 'A',
      },
      {
        content: 'Hạt nhân nguyên tử $^{238}_{92}\\text{U}$ có số neutron bằng',
        options: ['146', '92', '238', '330'],
        correctAnswer: 'A',
      },
    ],
    tf: [
      {
        content: 'Xét khối khí lý tưởng trong xilanh kín. Khi làm lạnh đẳng tích lượng khí:',
        options: [
          'Thể tích chất khí không đổi.',
          'Áp suất chất khí tăng lên.',
          'Động năng tịnh tiến trung bình của phân tử khí giảm.',
          'Nội năng của khối khí giảm.',
        ],
        correctAnswer: 'Đ-S-Đ-Đ',
      },
      {
        content: 'Một con lắc đơn dao động điều hòa tự do tại nơi có $g = 9{,}8\\text{ m/s}^2$:',
        options: [
          'Chu kì dao động phụ thuộc khối lượng vật nặng.',
          'Khi qua vị trí cân bằng, lực căng dây đạt cực đại.',
          'Cơ năng của con lắc bảo toàn nếu bỏ qua ma sát.',
          'Gia tốc của vật bằng 0 tại vị trí biên.',
        ],
        correctAnswer: 'S-Đ-Đ-S',
      },
    ],
    sa: [
      {
        content: 'Một bình kín chứa $2\\text{ mol}$ khí lý tưởng ở nhiệt độ $27^\\circ\\text{C}$ và thể tích $0{,}05\\text{ m}^3$. Cho $R = 8{,}31\\text{ J/(mol}\\cdot\\text{K)}$. Áp suất chất khí xấp xỉ bằng bao nhiêu kiloPascal (kPa)? (Làm tròn đến hàng đơn vị)',
        correctAnswer: '100',
      },
      {
        content: 'Một vật dao động điều hòa với biên độ $A = 6\\text{ cm}$. Khi thế năng bằng 3 lần động năng, độ lớn li độ $|x|$ của vật bằng bao nhiêu cm? (Làm tròn đến 1 chữ số thập phân)',
        correctAnswer: '5.2',
      },
    ],
  },
  11: {
    mc: [
      {
        content: 'Phương trình dao động điều hòa là $x = 5\\cos(4\\pi t - \\pi/3)\\text{ cm}$. Pha ban đầu của dao động là',
        options: ['$-\\pi/3\\text{ rad}$', '$\\pi/3\\text{ rad}$', '$4\\pi\\text{ rad/s}$', '$5\\text{ cm}$'],
        correctAnswer: 'A',
      },
      {
        content: 'Trong hiện tượng giao thoa sóng nước với hai nguồn cùng pha, những điểm dao động cực đại thỏa mãn điều kiện',
        options: ['$d_2 - d_1 = k\\lambda$', '$d_2 - d_1 = (k+0{,}5)\\lambda$', '$d_2 - d_1 = (2k+1)\\frac{\\lambda}{4}$', '$d_2 - d_1 = 2k\\lambda$'],
        correctAnswer: 'A',
      },
    ],
    tf: [
      {
        content: 'Về sóng điện từ:',
        options: [
          'Sóng điện từ lan truyền được trong chân không.',
          'Vectơ cường độ điện trường $\\vec{E}$ luôn song song với vectơ cảm ứng từ $\\vec{B}$.',
          'Sóng điện từ là sóng ngang.',
          'Tốc độ sóng điện từ trong chân không là $c = 3 \\times 10^8\\text{ m/s}$.',
        ],
        correctAnswer: 'Đ-S-Đ-Đ',
      },
    ],
    sa: [
      {
        content: 'Tại một điểm cách nguồn âm một khoảng $r = 10\\text{ m}$, mức cường độ âm là $L = 60\\text{ dB}$. Biết cường độ âm chuẩn $I_0 = 10^{-12}\\text{ W/m}^2$. Cường độ âm $I$ tại điểm đó bằng bao nhiêu $\\mu\\text{W/m}^2$?',
        correctAnswer: '1',
      },
    ],
  },
  10: {
    mc: [
      {
        content: 'Công thức tính độ dịch chuyển trong chuyển động thẳng biến đổi đều là',
        options: ['$d = v_0 t + \\frac{1}{2}at^2$', '$d = v_0 t + at^2$', '$d = \\frac{1}{2}at^2$', '$d = v_0 t - at^2$'],
        correctAnswer: 'A',
      },
      {
        content: 'Gia tốc trọng trường tại mặt đất thường lấy $g \\approx 9{,}8\\text{ m/s}^2$. Đơn vị đo gia tốc là',
        options: ['$\\text{m/s}^2$', '$\\text{m/s}$', '$\\text{N}$', '$\\text{J}$'],
        correctAnswer: 'A',
      },
    ],
    tf: [
      {
        content: 'Xét một vật trượt xuống mặt phẳng nghiêng có ma sát:',
        options: [
          'Trọng lực tác dụng lên vật sinh công dương.',
          'Lực ma sát trượt sinh công âm cản trở chuyển động.',
          'Cơ năng của vật bảo toàn tuyệt đối.',
          'Phản lực vuông góc của mặt dốc không sinh công.',
        ],
        correctAnswer: 'Đ-Đ-S-Đ',
      },
    ],
    sa: [
      {
        content: 'Một ô tô khối lượng $m = 1200\\text{ kg}$ đang chạy với tốc độ $20\\text{ m/s}$ thì hãm phanh dừng lại sau $5\\text{ s}$. Độ lớn lực hãm trung bình tác dụng lên xe bằng bao nhiêu Newton (N)?',
        correctAnswer: '4800',
      },
    ],
  },
};

export default function LatexCompilerPage() {
  // Left Panel State
  const [editorTab, setEditorTab] = useState<'editor' | 'templates'>('editor');
  const [latexSource, setLatexSource] = useState<string>(SAMPLE_LATEX);
  const [fontSize, setFontSize] = useState<number>(12);
  const [lineCount, setLineCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Right Panel State
  const [previewTab, setPreviewTab] = useState<'html' | 'pdf' | 'math'>('html');
  const [htmlOutput, setHtmlOutput] = useState<string>('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [mathPreviewHtml, setMathPreviewHtml] = useState<string>('');
  const [previewScale, setPreviewScale] = useState<number>(100);

  // Status & Compilation State
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileMode, setCompileMode] = useState<string>('html');
  const [compilationTime, setCompilationTime] = useState<number | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: [],
  });
  const [showStatusDrawer, setShowStatusDrawer] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Template Data & Selection State
  const [templates, setTemplates] = useState<TemplateInfo[]>([
    {
      id: 'THPTQG_2025',
      name: 'Đề thi THPT Quốc Gia 2025',
      description: 'Cấu trúc chuẩn Bộ GD&ĐT: 18 Trắc nghiệm + 4 Đúng sai + 6 Trả lời ngắn',
      structure: { mc: 18, tf: 4, sa: 6, total: 28 },
      duration: 50,
    },
    {
      id: 'LEGACY',
      name: 'Đề kiểm tra truyền thống',
      description: 'Cấu trúc 22 câu: 12 Trắc nghiệm + 4 Đúng sai + 6 Trả lời ngắn',
      structure: { mc: 12, tf: 4, sa: 6, total: 22 },
      duration: 50,
    },
    {
      id: 'QUICK_15',
      name: 'Kiểm tra nhanh 15 phút',
      description: '10 câu trắc nghiệm nhanh, đánh giá định kỳ trên lớp',
      structure: { mc: 10, tf: 0, sa: 0, total: 10 },
      duration: 15,
    },
    {
      id: 'MIDTERM_45',
      name: 'Kiểm tra định kỳ 1 tiết',
      description: 'Cấu trúc 15 câu: 10 Trắc nghiệm + 2 Đúng sai + 3 Trả lời ngắn',
      structure: { mc: 10, tf: 2, sa: 3, total: 15 },
      duration: 45,
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [templateForm, setTemplateForm] = useState<TemplateFormData>({
    schoolName: 'SỞ GD&ĐT HÀ NỘI - TRƯỜNG THPT CHUYÊN HÀ NỘI - AMSTERDAM',
    examTitle: 'ĐỀ KIỂM TRA ĐỊNH KỲ VẬT LÝ',
    subject: 'VẬT LÝ',
    grade: 12,
    duration: 50,
    schoolYear: '2024 - 2025',
    examCode: '102',
    includeAnswerKey: true,
  });

  // Compiler PDF Options
  const [pdfCompiler, setPdfCompiler] = useState<'pdflatex' | 'xelatex'>('pdflatex');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Toast auto-clear
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Update line and char counts
  useEffect(() => {
    const lines = latexSource.split('\n');
    setLineCount(lines.length);
    setCharCount(latexSource.length);
  }, [latexSource]);

  // Load templates from API on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/latex/compile');
        if (res.ok) {
          const data = await res.json();
          if (data.templates && Array.isArray(data.templates) && data.templates.length > 0) {
            setTemplates(data.templates);
          }
        }
      } catch (err) {
        console.warn('Using default template list', err);
      }
    }
    fetchTemplates();
  }, []);

  // Initial compile HTML on mount so preview isn't blank
  useEffect(() => {
    handleCompileHtml();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      setLatexSource(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCompileHtml();
    }
  };

  const handleCursorTrack = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const pos = target.selectionStart;
    const lines = target.value.substring(0, pos).split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  // Quick insert macro at cursor
  const insertMacro = (macroText: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = el.value;
    const newText = current.substring(0, start) + macroText + current.substring(end);
    setLatexSource(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + macroText.length;
    }, 0);
  };

  // ============================================
  // API ACTIONS
  // ============================================

  // 1. Compile HTML
  const handleCompileHtml = async () => {
    if (!latexSource.trim()) {
      setToastMessage({ text: 'Vui lòng nhập nội dung mã LaTeX', type: 'error' });
      return;
    }
    setIsCompiling(true);
    setCompileMode('html');
    setPreviewTab('html');

    try {
      const res = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: latexSource, mode: 'html' }),
      });
      const data = await res.json();

      if (data.success && data.html) {
        setHtmlOutput(data.html);
        setCompilationTime(data.compilationTime || null);
        setValidation({
          valid: true,
          errors: data.errors || [],
          warnings: data.warnings || [],
        });
        setToastMessage({ text: 'Biên dịch HTML thành công!', type: 'success' });
      } else {
        const errs = data.errors || [data.error || 'Biên dịch HTML thất bại'];
        setValidation({
          valid: false,
          errors: errs,
          warnings: data.warnings || [],
        });
        if (data.html) {
          setHtmlOutput(data.html);
        }
        setShowStatusDrawer(true);
        setToastMessage({ text: 'Có lỗi khi biên dịch HTML', type: 'error' });
      }
    } catch (err: any) {
      setValidation({
        valid: false,
        errors: [err.message || 'Lỗi kết nối máy chủ'],
        warnings: [],
      });
      setShowStatusDrawer(true);
      setToastMessage({ text: 'Lỗi kết nối máy chủ biên dịch', type: 'error' });
    } finally {
      setIsCompiling(false);
    }
  };

  // 2. Compile PDF
  const handleCompilePdf = async () => {
    if (!latexSource.trim()) {
      setToastMessage({ text: 'Vui lòng nhập nội dung mã LaTeX', type: 'error' });
      return;
    }
    setIsCompiling(true);
    setCompileMode('pdf');
    setPreviewTab('pdf');

    try {
      const res = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latex: latexSource,
          mode: 'pdf',
          options: {
            compiler: pdfCompiler,
            paperSize: 'a4',
            fontSize: 12,
          },
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/pdf')) {
        const timeHeader = res.headers.get('x-compilation-time');
        const compTime = timeHeader ? parseInt(timeHeader.replace('ms', ''), 10) : 1200;
        setCompilationTime(compTime);

        const blob = await res.blob();
        if (pdfBlobUrl) {
          URL.revokeObjectURL(pdfBlobUrl);
        }
        const newUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(newUrl);
        setValidation({ valid: true, errors: [], warnings: [] });
        setToastMessage({ text: 'Biên dịch PDF thành công! Đã tạo bản xem trước.', type: 'success' });
      } else {
        const data = await res.json().catch(() => ({}));
        const errs = data.errors || [data.error || 'Dịch vụ biên dịch PDF bên ngoài không phản hồi hoặc gặp lỗi cú pháp.'];
        setValidation({
          valid: false,
          errors: errs,
          warnings: [
            'Gợi ý: Kiểm tra các gói \\usepackage hoặc sử dụng tính năng "In / Xuất PDF" từ bản xem trước HTML.',
          ],
        });
        setShowStatusDrawer(true);
        setToastMessage({ text: 'Không thể xuất PDF trực tiếp', type: 'error' });
      }
    } catch (err: any) {
      setValidation({
        valid: false,
        errors: [`Lỗi kết nối biên dịch PDF: ${err.message}`],
        warnings: ['Kiểm tra kết nối internet hoặc thử lại sau.'],
      });
      setShowStatusDrawer(true);
      setToastMessage({ text: 'Lỗi biên dịch PDF', type: 'error' });
    } finally {
      setIsCompiling(false);
    }
  };

  // 3. Preview Math
  const handlePreviewMath = async () => {
    setIsCompiling(true);
    setCompileMode('preview');
    setPreviewTab('math');

    // Get selected text or snippet
    let mathInput = '';
    if (textareaRef.current) {
      const el = textareaRef.current;
      if (el.selectionStart !== el.selectionEnd) {
        mathInput = el.value.substring(el.selectionStart, el.selectionEnd).trim();
      }
    }

    if (!mathInput) {
      // Find first math formula or default
      const match = latexSource.match(/\$([^$]+)\$/) || latexSource.match(/\\\[([^\]]+)\\\]/);
      mathInput = match ? match[1] : 'x = A \\cos(\\omega t + \\varphi)';
    }

    // Strip $ or \[ if wrapped
    mathInput = mathInput.replace(/^\$+|\$+$/g, '').replace(/^\\\[|\\\]$/g, '').trim();

    try {
      const res = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latex: mathInput,
          mode: 'preview',
          options: { displayMode: true },
        }),
      });
      const data = await res.json();

      if (data.success && data.html) {
        setMathPreviewHtml(data.html);
        setCompilationTime(data.compilationTime || null);
        setValidation({ valid: true, errors: [], warnings: [] });
        setToastMessage({ text: 'Đã kết xuất công thức bằng KaTeX', type: 'success' });
      } else {
        const errs = data.errors || [data.error || 'Lỗi render công thức KaTeX'];
        setValidation({ valid: false, errors: errs, warnings: [] });
        setShowStatusDrawer(true);
      }
    } catch (err: any) {
      setValidation({ valid: false, errors: [err.message], warnings: [] });
      setShowStatusDrawer(true);
    } finally {
      setIsCompiling(false);
    }
  };

  // 4. Validate LaTeX
  const handleValidate = async () => {
    setIsCompiling(true);
    setCompileMode('validate');

    try {
      const res = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: latexSource, mode: 'validate' }),
      });
      const data = await res.json();

      if (data.success) {
        setValidation({
          valid: data.valid,
          errors: data.errors || [],
          warnings: data.warnings || [],
        });
        setShowStatusDrawer(true);
        if (data.valid) {
          setToastMessage({ text: 'Cú pháp LaTeX hợp lệ, không phát hiện lỗi đóng mở ngoặc!', type: 'success' });
        } else {
          setToastMessage({ text: `Phát hiện ${data.errors?.length || 0} lỗi cú pháp`, type: 'error' });
        }
      }
    } catch (err: any) {
      setValidation({
        valid: false,
        errors: [err.message],
        warnings: [],
      });
      setShowStatusDrawer(true);
    } finally {
      setIsCompiling(false);
    }
  };

  // 5. Generate LaTeX from Template Form
  const handleGenerateFromTemplate = async () => {
    if (!selectedTemplate) return;
    setIsCompiling(true);

    try {
      const gradeQuestions = DEFAULT_QUESTIONS_BY_GRADE[templateForm.grade] || DEFAULT_QUESTIONS_BY_GRADE[12];
      const struct = selectedTemplate.structure;

      // Construct questions list according to structure
      const questions: any[] = [];
      let qNum = 1;

      // Multiple Choice
      for (let i = 0; i < struct.mc; i++) {
        const sample = gradeQuestions.mc[i % gradeQuestions.mc.length];
        questions.push({
          number: qNum++,
          content: sample.content,
          format: 'MULTIPLE_CHOICE',
          options: sample.options,
          correctAnswer: sample.correctAnswer || 'A',
          section: 'TN',
        });
      }

      // True/False
      for (let i = 0; i < struct.tf; i++) {
        const sample = gradeQuestions.tf[i % gradeQuestions.tf.length];
        questions.push({
          number: qNum++,
          content: sample.content,
          format: 'TRUE_FALSE',
          options: sample.options,
          correctAnswer: sample.correctAnswer || 'Đ-S-Đ-S',
          section: 'ĐS',
        });
      }

      // Short Answer
      for (let i = 0; i < struct.sa; i++) {
        const sample = gradeQuestions.sa[i % gradeQuestions.sa.length];
        questions.push({
          number: qNum++,
          content: sample.content,
          format: 'SHORT_ANSWER',
          correctAnswer: sample.correctAnswer || '100',
          section: 'TLN',
        });
      }

      const templateData = {
        schoolName: templateForm.schoolName,
        examTitle: templateForm.examTitle,
        subject: templateForm.subject,
        grade: templateForm.grade,
        duration: templateForm.duration,
        schoolYear: templateForm.schoolYear,
        examCode: templateForm.examCode,
        includeAnswerKey: templateForm.includeAnswerKey,
        questions,
      };

      const res = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'template', templateData }),
      });

      const data = await res.json();
      if (data.success && data.latex) {
        setLatexSource(data.latex);
        setIsTemplateModalOpen(false);
        setEditorTab('editor');
        setToastMessage({
          text: `Đã khởi tạo đề ${selectedTemplate.name} thành công (${struct.total} câu)`,
          type: 'success',
        });

        // Auto compile HTML preview
        setTimeout(() => {
          handleCompileHtml();
        }, 100);
      } else {
        setToastMessage({
          text: data.errors?.[0] || 'Lỗi khi tạo mã LaTeX từ mẫu',
          type: 'error',
        });
      }
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Lỗi tạo đề thi từ mẫu', type: 'error' });
    } finally {
      setIsCompiling(false);
    }
  };

  // Copy LaTeX code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(latexSource);
      setToastMessage({ text: 'Đã sao chép mã nguồn LaTeX vào clipboard', type: 'info' });
    } catch {
      setToastMessage({ text: 'Không thể sao chép tự động', type: 'error' });
    }
  };

  // Download .tex file
  const handleDownloadTex = () => {
    const blob = new Blob([latexSource], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scisphy_exam_${Date.now()}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage({ text: 'Đã tải tệp .tex về máy', type: 'success' });
  };

  // Open Template Modal
  const openTemplateModal = (tpl: TemplateInfo) => {
    setSelectedTemplate(tpl);
    setTemplateForm(prev => ({
      ...prev,
      duration: tpl.duration,
      examTitle: `ĐỀ THI ${tpl.name.toUpperCase()}`,
    }));
    setIsTemplateModalOpen(true);
  };

  // Print iframe HTML
  const handlePrintPreview = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] overflow-hidden bg-[#faf8f6]">
      {/* ============================================================ */}
      {/* TOP BURGUNDY TOOLBAR                                         */}
      {/* ============================================================ */}
      <header className="bg-[#59080b] text-white px-4 py-2 flex flex-wrap items-center justify-between border-b border-[#3a0002] shadow-sm select-none gap-2 z-20">
        {/* Left: Module title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#4a0a0c] border border-white/15 flex items-center justify-center text-[#f0a500]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide uppercase">BIÊN DỊCH LATEX & XUẤT BẢN ĐỀ THI</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f0a500] text-[#1a0a0a]">
                MODULE 7
              </span>
            </div>
            <p className="text-[11px] text-white/70 font-normal">
              Biên soạn chuẩn GDPT 2018 • Trình thông dịch TeX Live & KaTeX
            </p>
          </div>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Compile HTML */}
          <button
            onClick={handleCompileHtml}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#f0a500] hover:bg-[#d99200] active:scale-95 text-[#1a0a0a] text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Biên dịch LaTeX sang HTML bằng latex.js (Ctrl + Enter)"
          >
            {isCompiling && compileMode === 'html' ? (
              <svg className="animate-spin w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
            <span>Biên dịch HTML</span>
          </button>

          {/* Compile PDF */}
          <button
            onClick={handleCompilePdf}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#3a0002] hover:bg-[#4a0a0c] active:scale-95 border border-white/20 text-white text-xs font-semibold transition shadow-sm disabled:opacity-50"
            title="Biên dịch LaTeX sang định dạng PDF qua TeX Live Server"
          >
            {isCompiling && compileMode === 'pdf' ? (
              <svg className="animate-spin w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            )}
            <span>Biên dịch PDF</span>
          </button>

          {/* Preview Math */}
          <button
            onClick={handlePreviewMath}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-medium transition disabled:opacity-50"
            title="Xem trước công thức toán học nhanh bằng KaTeX"
          >
            <span className="font-serif italic font-bold text-[#f0a500]">fx</span>
            <span>Preview Math</span>
          </button>

          {/* Validate */}
          <button
            onClick={handleValidate}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-medium transition disabled:opacity-50"
            title="Kiểm tra đóng mở thẻ và cú pháp LaTeX"
          >
            <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Validate</span>
          </button>
        </div>

        {/* Right: Status & Quick Utils */}
        <div className="flex items-center gap-2">
          {compilationTime !== null && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#3a0002] border border-white/10 text-[11px] text-white/90">
              <svg className="w-3 h-3 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{compilationTime}ms</span>
            </div>
          )}

          {/* Error / Warning Badges */}
          <button
            onClick={() => setShowStatusDrawer(!showStatusDrawer)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition ${
              validation.errors.length > 0
                ? 'bg-red-500 text-white animate-pulse'
                : validation.warnings.length > 0
                ? 'bg-amber-400 text-black'
                : 'bg-emerald-600/80 text-white'
            }`}
            title="Xem bảng chi tiết lỗi & cảnh báo"
          >
            {validation.errors.length > 0 ? (
              <>
                <span>{validation.errors.length} Lỗi</span>
              </>
            ) : validation.warnings.length > 0 ? (
              <>
                <span>{validation.warnings.length} Cảnh báo</span>
              </>
            ) : (
              <>
                <span>Cú pháp OK</span>
              </>
            )}
          </button>

          <div className="h-4 w-px bg-white/20 mx-0.5" />

          {/* Quick Copy */}
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition"
            title="Sao chép toàn bộ mã LaTeX"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>

          {/* Download .tex */}
          <button
            onClick={handleDownloadTex}
            className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition"
            title="Tải tệp mã nguồn (.tex)"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          {/* Reset sample */}
          <button
            onClick={() => {
              if (window.confirm('Khôi phục lại mã LaTeX mẫu ban đầu?')) {
                setLatexSource(SAMPLE_LATEX);
                setToastMessage({ text: 'Đã khôi phục mã mẫu', type: 'info' });
              }
            }}
            className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition"
            title="Khôi phục lại mẫu mặc định"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* TOAST MESSAGE NOTIFICATION                                    */}
      {/* ============================================================ */}
      {toastMessage && (
        <div
          className={`fixed top-16 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-lg transition-all transform duration-200 border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : toastMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}
        >
          {toastMessage.type === 'success' && (
            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {toastMessage.type === 'error' && (
            <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {toastMessage.type === 'info' && (
            <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-stone-400 hover:text-stone-700">
            ×
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* SPLIT LAYOUT: LEFT = EDITOR, RIGHT = PREVIEW                 */}
      {/* ============================================================ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* ========================================================== */}
        {/* LEFT PANEL: EDITOR & TEMPLATES                             */}
        {/* ========================================================== */}
        <div className="flex flex-col h-full border-r border-[#e8ddd6] bg-[#1e1e1e] overflow-hidden">
          {/* Left Panel Tabs Header */}
          <div className="bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center justify-between px-3 py-1.5 select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditorTab('editor')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition ${
                  editorTab === 'editor'
                    ? 'bg-[#1e1e1e] text-[#f0a500] border-t-2 border-[#f0a500]'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-[#383838]'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Soạn thảo LaTeX</span>
              </button>

              <button
                onClick={() => setEditorTab('templates')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition ${
                  editorTab === 'templates'
                    ? 'bg-[#1e1e1e] text-[#f0a500] border-t-2 border-[#f0a500]'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-[#383838]'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Mẫu đề thi (Templates)</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-[#59080b] text-[#f0a500] font-bold">
                  {templates.length}
                </span>
              </button>
            </div>

            {/* Font size control */}
            {editorTab === 'editor' && (
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <span>Cỡ chữ:</span>
                <button
                  onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                  className="w-5 h-5 rounded bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white flex items-center justify-center font-bold"
                  title="Giảm cỡ chữ"
                >
                  -
                </button>
                <span className="text-white font-mono">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(18, fontSize + 1))}
                  className="w-5 h-5 rounded bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white flex items-center justify-center font-bold"
                  title="Tăng cỡ chữ"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Quick Math Macro Bar (Only visible in Editor tab) */}
          {editorTab === 'editor' && (
            <div className="bg-[#252526] border-b border-[#333333] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap mr-1">
                Chèn nhanh:
              </span>
              {[
                { label: '\\vect{F}', code: '\\vect{F}' },
                { label: '\\omega', code: '\\omega' },
                { label: '\\Delta', code: '\\Delta' },
                { label: '\\lambda', code: '\\lambda' },
                { label: '\\frac{a}{b}', code: '\\frac{a}{b}' },
                { label: '\\sqrt{x}', code: '\\sqrt{x}' },
                { label: 'm/s', code: '\\unit{m/s}' },
                { label: 'm/s²', code: '\\unit{m/s^2}' },
                { label: 'x = A cos...', code: 'x = A\\cos(\\omega t + \\varphi)' },
                { label: 'pV = nRT', code: 'pV = nRT' },
                { label: '\\degree C', code: '^\\circ\\text{C}' },
                { label: '4 Cột Đáp án', code: '\\begin{multicols}{4}\n  \\begin{enumerate}[label=\\textbf{\\Alph*.}]\n    \\item A\n    \\item B\n    \\item C\n    \\item D\n  \\end{enumerate}\n\\end{multicols}' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => insertMacro(item.code)}
                  className="px-2 py-0.5 rounded bg-[#333333] hover:bg-[#444444] text-[#fcd34d] hover:text-white font-mono whitespace-nowrap transition border border-transparent hover:border-[#555]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* CONTENT: EDITOR TAB */}
          {editorTab === 'editor' && (
            <div className="flex-1 relative flex flex-col overflow-hidden bg-[#1e1e1e]">
              <div className="flex-1 flex overflow-hidden">
                {/* Line Numbers Gutter */}
                <div
                  className="w-12 py-3 bg-[#1e1e1e] text-stone-600 font-mono text-xs text-right pr-2 select-none border-r border-[#2d2d2d] overflow-hidden"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
                >
                  {Array.from({ length: Math.min(lineCount, 500) }).map((_, i) => (
                    <div key={i} className={i + 1 === cursorPos.line ? 'text-[#f0a500] font-bold' : ''}>
                      {i + 1}
                    </div>
                  ))}
                  {lineCount > 500 && <div className="text-stone-700">...</div>}
                </div>

                {/* Main Textarea */}
                <textarea
                  ref={textareaRef}
                  value={latexSource}
                  onChange={e => setLatexSource(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleCursorTrack}
                  onClick={handleCursorTrack}
                  spellCheck={false}
                  className="flex-1 h-full p-3 bg-[#1e1e1e] text-[#e2e8f0] font-mono outline-none resize-none overflow-y-auto leading-relaxed border-none focus:ring-0 selection:bg-[#59080b]/70"
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.6',
                    tabSize: 2,
                  }}
                  placeholder="Nhập mã nguồn LaTeX tại đây..."
                />
              </div>

              {/* Editor Bottom Meta Subbar */}
              <div className="bg-[#252526] border-t border-[#333333] px-3 py-1 flex items-center justify-between text-[11px] text-stone-400 select-none">
                <div className="flex items-center gap-3">
                  <span>
                    Dòng <strong className="text-stone-200">{cursorPos.line}</strong>, Cột{' '}
                    <strong className="text-stone-200">{cursorPos.col}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Tổng: <strong className="text-stone-200">{lineCount}</strong> dòng,{' '}
                    <strong className="text-stone-200">{charCount}</strong> ký tự
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500">Ctrl + Enter: Biên dịch</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#333] text-stone-300 font-mono text-[10px]">
                    UTF-8 | LaTeX
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT: TEMPLATES TAB */}
          {editorTab === 'templates' && (
            <div className="flex-1 p-4 bg-[#18181b] overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white mb-1">Mẫu cấu trúc đề thi Vật lý GDPT 2018</h3>
                <p className="text-xs text-stone-400">
                  Chọn mẫu đề thi có sẵn để khởi tạo nhanh toàn bộ khung đề thi, phân chia phần trắc nghiệm, đúng/sai và trả lời ngắn chuẩn Bộ Giáo dục.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => openTemplateModal(tpl)}
                    className="p-3.5 rounded-lg bg-[#242427] hover:bg-[#2c2c31] border border-[#3f3f46] hover:border-[#f0a500] cursor-pointer transition shadow group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white group-hover:text-[#f0a500] transition">
                          {tpl.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#59080b] text-[#f0a500] border border-[#59080b]">
                          {tpl.duration} phút
                        </span>
                      </div>

                      <p className="text-xs text-stone-400 mb-3 leading-snug">
                        {tpl.description}
                      </p>
                    </div>

                    <div>
                      {/* Structure Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-stone-800 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800/50">
                          {tpl.structure.mc} Trắc nghiệm
                        </span>
                        {tpl.structure.tf > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-800/50">
                            {tpl.structure.tf} Đúng/Sai
                          </span>
                        )}
                        {tpl.structure.sa > 0 && (
                          <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800/50">
                            {tpl.structure.sa} Trả lời ngắn
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#f0a500]">
                        <span>Tạo đề theo mẫu này</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Template Usage Info Box */}
              <div className="mt-6 p-4 rounded-lg bg-[#242427]/60 border border-dashed border-[#3f3f46] text-xs text-stone-400 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-xs">
                  <svg className="w-4 h-4 text-[#f0a500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Quy trình hoạt động:</span>
                </div>
                <p>
                  1. Chọn một mẫu đề phù hợp (ví dụ: THPTQG 2025 gồm 28 câu).<br />
                  2. Điền thông tin trường, khối lớp (10, 11, 12), thời gian thi và mã đề.<br />
                  3. Bấm <strong>&quot;Tạo đề thi LaTeX&quot;</strong> để hệ thống tự động sinh tài liệu chuẩn và đưa vào trình soạn thảo.<br />
                  4. Biên dịch ngay sang định dạng HTML hoặc xuất file PDF in ấn.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* RIGHT PANEL: PREVIEW (HTML, PDF, MATH)                     */}
        {/* ========================================================== */}
        <div className="flex flex-col h-full bg-[#ffffff] overflow-hidden">
          {/* Right Panel Tabs Header */}
          <div className="bg-[#f5f0ec] border-b border-[#e8ddd6] flex items-center justify-between px-3 py-1.5 select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewTab('html')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition ${
                  previewTab === 'html'
                    ? 'bg-white text-[#59080b] shadow-sm border-t-2 border-[#59080b]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-[#59080b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span>Xem trước HTML</span>
              </button>

              <button
                onClick={() => setPreviewTab('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition ${
                  previewTab === 'pdf'
                    ? 'bg-white text-[#59080b] shadow-sm border-t-2 border-[#59080b]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Bản in PDF</span>
                {pdfBlobUrl && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                )}
              </button>

              <button
                onClick={() => setPreviewTab('math')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition ${
                  previewTab === 'math'
                    ? 'bg-white text-[#59080b] shadow-sm border-t-2 border-[#59080b]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <span className="font-serif italic font-bold text-[#59080b]">fx</span>
                <span>KaTeX Math</span>
              </button>
            </div>

            {/* Right Tools: Print, Zoom, Full */}
            <div className="flex items-center gap-2">
              {previewTab === 'html' && (
                <>
                  {/* Zoom controls */}
                  <div className="flex items-center gap-1 text-[11px] text-stone-600">
                    <button
                      onClick={() => setPreviewScale(Math.max(60, previewScale - 10))}
                      className="w-5 h-5 rounded bg-stone-200 hover:bg-stone-300 flex items-center justify-center font-bold"
                      title="Thu nhỏ xem trước"
                    >
                      -
                    </button>
                    <span className="font-mono text-[10px] w-9 text-center">{previewScale}%</span>
                    <button
                      onClick={() => setPreviewScale(Math.min(150, previewScale + 10))}
                      className="w-5 h-5 rounded bg-stone-200 hover:bg-stone-300 flex items-center justify-center font-bold"
                      title="Phóng to xem trước"
                    >
                      +
                    </button>
                  </div>

                  {/* Print Button */}
                  <button
                    onClick={handlePrintPreview}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#59080b] hover:bg-[#4a0a0c] text-white text-xs font-semibold shadow-sm transition"
                    title="In đề thi trực tiếp từ trình duyệt"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    <span>In đề thi</span>
                  </button>
                </>
              )}

              {previewTab === 'pdf' && pdfBlobUrl && (
                <a
                  href={pdfBlobUrl}
                  download="de_thi_scisphy.pdf"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#59080b] hover:bg-[#4a0a0c] text-white text-xs font-semibold shadow-sm transition"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Tải file PDF</span>
                </a>
              )}
            </div>
          </div>

          {/* PREVIEW TAB 1: HTML */}
          {previewTab === 'html' && (
            <div className="flex-1 relative flex flex-col overflow-hidden bg-[#e4ded9]/50">
              {isCompiling && compileMode === 'html' && (
                <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                  <div className="w-9 h-9 border-3 border-[#59080b] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-[#59080b]">Đang biên dịch LaTeX sang HTML...</p>
                </div>
              )}

              {htmlOutput ? (
                <div className="flex-1 w-full h-full overflow-auto flex justify-center p-4">
                  <div
                    className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-md border border-[#e8ddd6] transition-transform origin-top"
                    style={{ transform: `scale(${previewScale / 100})` }}
                  >
                    <iframe
                      ref={iframeRef}
                      srcDoc={htmlOutput}
                      title="HTML Preview"
                      sandbox="allow-same-origin allow-scripts allow-modals"
                      className="w-full min-h-[297mm] h-full border-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#59080b]/10 text-[#59080b] flex items-center justify-center mb-3">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-[#1a0a0a] mb-1">Chưa có bản xem trước HTML</h4>
                  <p className="text-xs text-stone-500 max-w-sm mb-4">
                    Nhấn nút &quot;Biên dịch HTML&quot; hoặc dùng tổ hợp phím Ctrl + Enter để xem kết quả trực quan ngay lập tức.
                  </p>
                  <button
                    onClick={handleCompileHtml}
                    className="px-4 py-2 rounded-lg bg-[#59080b] text-white hover:bg-[#4a0a0c] font-bold text-xs shadow transition"
                  >
                    Biên dịch ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PREVIEW TAB 2: PDF */}
          {previewTab === 'pdf' && (
            <div className="flex-1 relative flex flex-col overflow-hidden bg-stone-100">
              {/* PDF Settings subbar */}
              <div className="bg-white border-b border-[#e8ddd6] px-4 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-stone-700">Trình biên dịch:</span>
                  <select
                    value={pdfCompiler}
                    onChange={e => setPdfCompiler(e.target.value as any)}
                    className="px-2 py-1 rounded border border-[#e8ddd6] text-xs bg-white text-stone-800"
                  >
                    <option value="pdflatex">pdfLaTeX (Chuẩn)</option>
                    <option value="xelatex">XeLaTeX (Hỗ trợ font UTF-8 phong phú)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCompilePdf}
                    disabled={isCompiling}
                    className="px-3 py-1 rounded bg-[#f0a500] hover:bg-[#d99200] text-black font-bold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    {isCompiling && compileMode === 'pdf' ? 'Đang tạo PDF...' : 'Tạo lại PDF'}
                  </button>
                </div>
              </div>

              {isCompiling && compileMode === 'pdf' && (
                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                  <div className="w-9 h-9 border-3 border-[#59080b] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-[#59080b]">
                    Đang gửi mã LaTeX đến máy chủ TeX Live để biên dịch PDF...
                  </p>
                  <p className="text-[11px] text-stone-500">Quá trình này có thể mất 3 - 10 giây</p>
                </div>
              )}

              {pdfBlobUrl ? (
                <div className="flex-1 w-full h-full">
                  <iframe
                    src={pdfBlobUrl}
                    title="PDF Preview"
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mb-3">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-[#1a0a0a] mb-1">Chưa có bản xem trước PDF</h4>
                  <p className="text-xs text-stone-500 max-w-sm mb-4">
                    Nhấn nút &quot;Biên dịch PDF&quot; trên thanh công cụ để tạo tệp tài liệu PDF độ phân giải cao phục vụ in ấn đề thi.
                  </p>
                  <button
                    onClick={handleCompilePdf}
                    disabled={isCompiling}
                    className="px-4 py-2 rounded-lg bg-[#59080b] text-white hover:bg-[#4a0a0c] font-bold text-xs shadow transition disabled:opacity-50"
                  >
                    Biên dịch PDF ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PREVIEW TAB 3: KATEX MATH PREVIEW */}
          {previewTab === 'math' && (
            <div className="flex-1 p-6 bg-white overflow-y-auto flex flex-col">
              <div className="mb-4 pb-3 border-b border-[#e8ddd6]">
                <h3 className="text-sm font-bold text-[#59080b] flex items-center gap-2">
                  <span className="font-serif italic text-base">fx</span>
                  <span>Trình hiển thị công thức nhanh KaTeX</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Kiểm tra nhanh kết quả render của các công thức Vật lý độc lập hoặc đoạn công thức đang bôi đen.
                </p>
              </div>

              {mathPreviewHtml ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fff8eb] border border-[#f0a500]/30 rounded-xl my-4">
                  <div
                    className="text-lg md:text-xl text-[#1a0a0a] overflow-x-auto max-w-full py-4 px-6 bg-white rounded-lg shadow-xs border border-amber-200"
                    dangerouslySetInnerHTML={{ __html: mathPreviewHtml }}
                  />
                  <span className="text-[11px] text-stone-500 mt-3">Rendered via KaTeX Engine</span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-xs text-stone-500 max-w-sm mb-3">
                    Bôi đen một công thức trong Editor rồi nhấn &quot;Preview Math&quot; để kiểm tra hiển thị.
                  </p>
                  <button
                    onClick={handlePreviewMath}
                    className="px-3.5 py-1.5 rounded-lg bg-[#f0a500] text-black font-bold text-xs shadow transition"
                  >
                    Xem thử công thức mẫu
                  </button>
                </div>
              )}

              {/* Common Physics Formulas Cheatsheet */}
              <div className="mt-auto pt-4 border-t border-[#e8ddd6]">
                <h4 className="text-xs font-bold text-stone-700 mb-2 uppercase">Công thức Vật lý phổ biến:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {[
                    { name: 'Dao động ĐH', code: 'x = A \\cos(\\omega t + \\varphi)' },
                    { name: 'Gia tốc cực đại', code: 'a_{\\max} = \\omega^2 A' },
                    { name: 'Khí lý tưởng', code: 'p V = n R T' },
                    { name: 'Sóng cơ', code: '\\lambda = \\frac{v}{f}' },
                    { name: 'Nhiệt lượng', code: 'Q = m c \\Delta T' },
                    { name: 'Suất điện động', code: 'e_c = -\\frac{\\Delta\\Phi}{\\Delta t}' },
                    { name: 'Quang điện', code: 'h f = A + \\frac{1}{2}m v_0^2' },
                    { name: 'Năng lượng hạt nhân', code: 'E = m c^2' },
                  ].map((f, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        insertMacro(`$${f.code}$`);
                        setToastMessage({ text: `Đã chèn công thức: ${f.name}`, type: 'info' });
                      }}
                      className="p-2 rounded bg-stone-50 hover:bg-[#fff8eb] border border-[#e8ddd6] text-left transition hover:border-[#f0a500]"
                    >
                      <div className="text-[10px] font-bold text-[#59080b]">{f.name}</div>
                      <div className="text-[11px] font-mono text-stone-600 truncate">{f.code}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* COLLAPSIBLE STATUS / ERROR / WARNING DRAWER                  */}
      {/* ============================================================ */}
      {showStatusDrawer && (
        <div className="bg-[#242427] border-t-2 border-[#59080b] max-h-48 overflow-y-auto p-3 text-xs text-white z-20 shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-700">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#f0a500]">Báo cáo kiểm tra cú pháp & Biên dịch</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-stone-700 text-stone-300">
                {validation.errors.length} Lỗi • {validation.warnings.length} Cảnh báo
              </span>
            </div>
            <button
              onClick={() => setShowStatusDrawer(false)}
              className="text-stone-400 hover:text-white font-bold px-2 py-0.5 rounded bg-stone-800"
            >
              ✕ Đóng
            </button>
          </div>

          {validation.errors.length === 0 && validation.warnings.length === 0 ? (
            <p className="text-emerald-400 font-semibold flex items-center gap-1.5 py-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Mã nguồn hoàn toàn hợp lệ! Không có lỗi cú pháp hoặc cảnh báo nào.</span>
            </p>
          ) : (
            <div className="space-y-1.5 font-mono text-[11px]">
              {validation.errors.map((err, idx) => (
                <div key={idx} className="p-1.5 rounded bg-red-950/60 text-red-300 border-l-2 border-red-500">
                  <strong className="text-red-400">[LỖI]</strong> {err}
                </div>
              ))}
              {validation.warnings.map((warn, idx) => (
                <div key={idx} className="p-1.5 rounded bg-amber-950/60 text-amber-300 border-l-2 border-amber-500">
                  <strong className="text-amber-400">[CẢNH BÁO]</strong> {warn}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* BOTTOM STATUS BAR                                            */}
      {/* ============================================================ */}
      <footer className="h-8 bg-[#18181b] border-t border-[#2e2e33] px-3 flex items-center justify-between text-[11px] text-stone-400 select-none z-10">
        {/* Left: Validation status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStatusDrawer(!showStatusDrawer)}
            className="flex items-center gap-1.5 hover:text-white transition"
          >
            {validation.errors.length > 0 ? (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
            ) : validation.warnings.length > 0 ? (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            )}
            <span className="font-semibold">
              {validation.errors.length > 0
                ? `${validation.errors.length} lỗi biên dịch`
                : validation.warnings.length > 0
                ? `${validation.warnings.length} cảnh báo`
                : 'Cú pháp hợp lệ'}
            </span>
          </button>

          <span className="text-stone-600">|</span>

          <span>
            Trạng thái:{' '}
            <strong className="text-stone-200">
              {isCompiling ? 'Đang xử lý...' : 'Sẵn sàng'}
            </strong>
          </span>
        </div>

        {/* Right: Meta stats */}
        <div className="flex items-center gap-4">
          {compilationTime !== null && (
            <span>
              Thời gian biên dịch: <strong className="text-[#f0a500] font-mono">{compilationTime}ms</strong>
            </span>
          )}
          <span className="text-stone-600">|</span>
          <span>
            Khổ giấy: <strong className="text-stone-300">A4 (210×297mm)</strong>
          </span>
          <span className="text-stone-600">|</span>
          <span>
            Động cơ: <strong className="text-stone-300">latex.js + KaTeX</strong>
          </span>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* MODAL: TEMPLATE CONFIGURATION FORM                           */}
      {/* ============================================================ */}
      {isTemplateModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#e8ddd6] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#59080b] text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  Khởi tạo: {selectedTemplate.name}
                </h3>
                <p className="text-[11px] text-white/70">
                  {selectedTemplate.description}
                </p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tên trường / Đơn vị tổ chức:
                </label>
                <input
                  type="text"
                  value={templateForm.schoolName}
                  onChange={e => setTemplateForm({ ...templateForm, schoolName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded border border-[#e8ddd6] text-xs focus:ring-1 focus:ring-[#59080b] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tiêu đề đề thi:
                </label>
                <input
                  type="text"
                  value={templateForm.examTitle}
                  onChange={e => setTemplateForm({ ...templateForm, examTitle: e.target.value })}
                  className="w-full px-3 py-1.5 rounded border border-[#e8ddd6] text-xs focus:ring-1 focus:ring-[#59080b] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Khối lớp:
                  </label>
                  <select
                    value={templateForm.grade}
                    onChange={e => setTemplateForm({ ...templateForm, grade: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 rounded border border-[#e8ddd6] text-xs focus:ring-1 focus:ring-[#59080b] outline-none bg-white"
                  >
                    <option value={12}>Lớp 12 (GDPT 2018)</option>
                    <option value={11}>Lớp 11 (GDPT 2018)</option>
                    <option value={10}>Lớp 10 (GDPT 2018)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Năm học:
                  </label>
                  <input
                    type="text"
                    value={templateForm.schoolYear}
                    onChange={e => setTemplateForm({ ...templateForm, schoolYear: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-[#e8ddd6] text-xs focus:ring-1 focus:ring-[#59080b] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Thời gian làm bài (phút):
                  </label>
                  <input
                    type="number"
                    value={templateForm.duration}
                    onChange={e => setTemplateForm({ ...templateForm, duration: parseInt(e.target.value, 10) || 50 })}
                    className="w-full px-3 py-1.5 rounded border border-[#e8ddd6] text-xs focus:ring-1 focus:ring-[#59080b] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Mã đề thi:
                  </label>
                  <input
                    type="text"
                    value={templateForm.examCode}
                    onChange={e => setTemplateForm({ ...templateForm, examCode: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-[#e8ddd6] text-xs focus:ring-1 focus:ring-[#59080b] outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#fff8eb] border border-[#f0a500]/30 rounded-lg">
                <div className="text-xs font-bold text-[#59080b] mb-1">Cấu trúc câu hỏi tự động:</div>
                <div className="flex items-center gap-2 text-xs text-stone-700 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-white border border-[#e8ddd6] font-semibold">
                    {selectedTemplate.structure.mc} câu Trắc nghiệm
                  </span>
                  {selectedTemplate.structure.tf > 0 && (
                    <span className="px-2 py-0.5 rounded bg-white border border-[#e8ddd6] font-semibold">
                      {selectedTemplate.structure.tf} câu Đúng/Sai
                    </span>
                  )}
                  {selectedTemplate.structure.sa > 0 && (
                    <span className="px-2 py-0.5 rounded bg-white border border-[#e8ddd6] font-semibold">
                      {selectedTemplate.structure.sa} câu Trả lời ngắn
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="includeAnswerKey"
                  checked={templateForm.includeAnswerKey}
                  onChange={e => setTemplateForm({ ...templateForm, includeAnswerKey: e.target.checked })}
                  className="w-4 h-4 text-[#59080b] rounded border-[#e8ddd6] focus:ring-[#59080b]"
                />
                <label htmlFor="includeAnswerKey" className="text-xs font-medium text-stone-700 cursor-pointer">
                  Kèm bảng đáp án chi tiết ở cuối đề (Answer Key)
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-[#faf8f6] px-5 py-3 border-t border-[#e8ddd6] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs transition"
              >
                Hủy bỏ
              </button>

              <button
                onClick={handleGenerateFromTemplate}
                disabled={isCompiling}
                className="px-5 py-2 rounded-lg bg-[#59080b] hover:bg-[#4a0a0c] text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {isCompiling ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Đang tạo mã...</span>
                  </>
                ) : (
                  <span>Tạo mã LaTeX & Mở Editor</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
