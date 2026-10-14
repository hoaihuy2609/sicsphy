/**
 * ScisPhy LaTeX Compiler Engine
 * Module 7 — LaTeX Compiler
 * 
 * Hỗ trợ:
 * 1. LaTeX → HTML (via latex.js, server-side)
 * 2. LaTeX → PDF (via external API: latexonline.cc)
 * 3. KaTeX Math Rendering (quick preview)
 * 4. Template Engine (Tạo đề thi Vật lý chuẩn GDPT 2018)
 */

// ============================================
// TYPES
// ============================================

export interface CompileRequest {
  latex: string;
  mode: 'html' | 'pdf' | 'preview' | 'template';
  options?: CompileOptions;
}

export interface CompileOptions {
  // PDF options
  compiler?: 'pdflatex' | 'xelatex' | 'lualatex';
  // Template options
  templateName?: string;
  templateData?: Record<string, any>;
  // Output
  fontSize?: number;
  paperSize?: 'a4' | 'letter';
}

export interface CompileResult {
  success: boolean;
  mode: string;
  html?: string;
  pdfUrl?: string;
  pdfBuffer?: Buffer;
  preview?: string;
  latex?: string;
  errors?: string[];
  warnings?: string[];
  compilationTime?: number;
}

// ============================================
// LATEX → HTML (via latex.js)
// ============================================

export async function compileToHtml(latexSource: string): Promise<CompileResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Dynamic import latex.js (server-side)
    const latexjs = await import('latex.js');

    // Parse LaTeX → HTML generator
    const generator = latexjs.parse(latexSource, {
      generator: new latexjs.HtmlGenerator({
        hyphenate: false,
      }),
    });

    // Get HTML output
    const htmlDocument = generator.htmlDocument();
    const htmlString = htmlDocument.documentElement.outerHTML;

    // Extract CSS styles from latex.js
    const styles = generator.stylesAndScripts();

    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ScisPhy LaTeX Output</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      line-height: 1.6;
      color: #111;
      background: #fff;
    }
    ${styles || ''}
  </style>
</head>
<body>
  ${htmlString}
</body>
</html>`;

    return {
      success: true,
      mode: 'html',
      html: fullHtml,
      errors,
      warnings,
      compilationTime: Date.now() - startTime,
    };
  } catch (error: any) {
    errors.push(`LaTeX compilation error: ${error.message}`);
    
    // Fallback: try simple LaTeX → HTML conversion
    try {
      const fallbackHtml = simpleLatexToHtml(latexSource);
      warnings.push('Sử dụng fallback converter (không hỗ trợ đầy đủ LaTeX)');
      return {
        success: true,
        mode: 'html',
        html: fallbackHtml,
        errors: [],
        warnings,
        compilationTime: Date.now() - startTime,
      };
    } catch {
      return {
        success: false,
        mode: 'html',
        errors,
        warnings,
        compilationTime: Date.now() - startTime,
      };
    }
  }
}

// ============================================
// LATEX → PDF (via external API)
// ============================================

const LATEX_API_ENDPOINTS = [
  {
    name: 'latexonline',
    url: 'https://latexonline.cc/compile',
    method: 'POST' as const,
  },
  {
    name: 'texapi',
    url: 'https://texapi.ovh/api/latex/compile',
    method: 'POST' as const,
  },
];

export async function compileToPdf(
  latexSource: string,
  options: CompileOptions = {}
): Promise<CompileResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const compiler = options.compiler || 'pdflatex';

  // Ensure document has proper preamble
  const fullLatex = ensureDocumentPreamble(latexSource, options);

  // Try each endpoint
  for (const endpoint of LATEX_API_ENDPOINTS) {
    try {
      const result = await callLatexApi(endpoint, fullLatex, compiler);
      if (result.success) {
        return {
          ...result,
          mode: 'pdf',
          compilationTime: Date.now() - startTime,
        };
      }
      errors.push(`${endpoint.name}: ${result.errors?.join(', ') || 'Unknown error'}`);
    } catch (error: any) {
      errors.push(`${endpoint.name}: ${error.message}`);
    }
  }

  return {
    success: false,
    mode: 'pdf',
    errors: [`Tất cả API đều thất bại. Chi tiết: ${errors.join(' | ')}`],
    compilationTime: Date.now() - startTime,
  };
}

async function callLatexApi(
  endpoint: typeof LATEX_API_ENDPOINTS[0],
  latexSource: string,
  compiler: string
): Promise<CompileResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000); // 60s timeout

  try {
    let response: Response;

    if (endpoint.name === 'latexonline') {
      // latexonline.cc accepts text body
      const url = new URL(endpoint.url);
      url.searchParams.set('command', compiler);
      
      response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-tex' },
        body: latexSource,
        signal: controller.signal,
      });
    } else {
      // texapi.ovh accepts FormData
      const formData = new FormData();
      const blob = new Blob([latexSource], { type: 'application/x-tex' });
      formData.append('files', blob, 'main.tex');

      const url = `${endpoint.url}/file?compiler=${compiler}`;
      response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      return {
        success: false,
        mode: 'pdf',
        errors: [`HTTP ${response.status}: ${errorText.slice(0, 200)}`],
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/pdf')) {
      return {
        success: false,
        mode: 'pdf',
        errors: [`Server trả về ${contentType} thay vì PDF`],
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    return {
      success: true,
      mode: 'pdf',
      pdfBuffer,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================
// KATEX MATH PREVIEW (Quick)
// ============================================

export function renderMathPreview(latexMath: string, displayMode = false): CompileResult {
  const startTime = Date.now();
  
  try {
    // Import KaTeX (already in project)
    const katex = require('katex');
    
    const html = katex.renderToString(latexMath, {
      displayMode,
      throwOnError: false,
      errorColor: '#cc0000',
      trust: true,
      strict: false,
      macros: {
        // Physics macros
        '\\vect': '\\overrightarrow{#1}',
        '\\unit': '\\text{ #1}',
        '\\ms': '\\text{ m/s}',
        '\\mss': '\\text{ m/s}^2',
        '\\N': '\\text{ N}',
        '\\J': '\\text{ J}',
        '\\W': '\\text{ W}',
        '\\V': '\\text{ V}',
        '\\A': '\\text{ A}',
        '\\ohm': '\\Omega',
        '\\Hz': '\\text{ Hz}',
        '\\rad': '\\text{ rad}',
        '\\kg': '\\text{ kg}',
        '\\m': '\\text{ m}',
        '\\cm': '\\text{ cm}',
        '\\s': '\\text{ s}',
        '\\g': '\\text{ g}',
      },
    });

    return {
      success: true,
      mode: 'preview',
      preview: html,
      compilationTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      mode: 'preview',
      errors: [`KaTeX error: ${error.message}`],
      compilationTime: Date.now() - startTime,
    };
  }
}

// ============================================
// TEMPLATE ENGINE — Đề thi Vật lý GDPT 2018
// ============================================

export interface ExamTemplateData {
  schoolName?: string;
  examTitle: string;
  subject: string;
  grade: number;
  duration: number; // phút
  schoolYear?: string;
  examCode?: string;
  questions: TemplateQuestion[];
  includeAnswerKey?: boolean;
}

interface TemplateQuestion {
  number: number;
  content: string;
  format: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer?: string;
  section?: string; // 'TN' | 'ĐS' | 'TLN'
}

export function generateExamLatex(data: ExamTemplateData): CompileResult {
  const startTime = Date.now();

  try {
    const latex = buildExamDocument(data);
    return {
      success: true,
      mode: 'template',
      latex,
      compilationTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      mode: 'template',
      errors: [`Template error: ${error.message}`],
      compilationTime: Date.now() - startTime,
    };
  }
}

function buildExamDocument(data: ExamTemplateData): string {
  const {
    schoolName = 'TRƯỜNG THPT ...',
    examTitle,
    subject = 'VẬT LÝ',
    grade,
    duration,
    schoolYear = '2024-2025',
    examCode,
    questions,
    includeAnswerKey = false,
  } = data;

  // Separate questions by section
  const mcQuestions = questions.filter(q => q.format === 'MULTIPLE_CHOICE');
  const tfQuestions = questions.filter(q => q.format === 'TRUE_FALSE');
  const saQuestions = questions.filter(q => q.format === 'SHORT_ANSWER');

  let doc = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\usepackage{multicol}
\\usepackage{enumitem}
\\usepackage{graphicx}
\\usepackage{fancyhdr}
\\usepackage{array}

\\geometry{left=2cm,right=2cm,top=2cm,bottom=2cm}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\footnotesize ${subject} ${grade}}
\\fancyhead[R]{\\footnotesize Trang \\thepage}
\\fancyfoot[C]{\\footnotesize ${schoolName}}
\\renewcommand{\\headrulewidth}{0.4pt}

\\begin{document}

% ═══════════════════════════════════════════
% HEADER
% ═══════════════════════════════════════════
\\begin{center}
\\textbf{${schoolName.toUpperCase()}}\\\\
\\textbf{NĂM HỌC ${schoolYear}}\\\\[0.5em]
\\rule{0.6\\textwidth}{0.5pt}\\\\[0.5em]
{\\Large \\textbf{${examTitle.toUpperCase()}}}\\\\[0.3em]
\\textbf{Môn: ${subject} ${grade}}\\\\
\\textit{Thời gian làm bài: ${duration} phút (không kể thời gian phát đề)}
${examCode ? `\\\\[0.3em]\\textbf{Mã đề: ${examCode}}` : ''}
\\end{center}

\\vspace{0.5em}
\\hrule
\\vspace{0.5em}

`;

  // ═══════════════════════════════════════════
  // PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN
  // ═══════════════════════════════════════════
  if (mcQuestions.length > 0) {
    doc += `% ─── PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN (${mcQuestions.length} câu) ───
\\section*{PHẦN I. Câu trắc nghiệm nhiều lựa chọn}
\\textit{Thí sinh trả lời từ Câu 1 đến Câu ${mcQuestions.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.}

\\begin{enumerate}[label=\\textbf{Câu \\arabic*.}]
`;
    for (const q of mcQuestions) {
      doc += `  \\item ${escapeLatex(q.content)}\n`;
      if (q.options && q.options.length === 4) {
        doc += `  \\begin{multicols}{4}\n`;
        doc += `    \\begin{enumerate}[label=\\textbf{\\Alph*.}]\n`;
        for (const opt of q.options) {
          doc += `      \\item ${escapeLatex(opt)}\n`;
        }
        doc += `    \\end{enumerate}\n`;
        doc += `  \\end{multicols}\n`;
      }
    }
    doc += `\\end{enumerate}\n\n`;
  }

  // ═══════════════════════════════════════════
  // PHẦN II: TRẮC NGHIỆM ĐÚNG SAI
  // ═══════════════════════════════════════════
  if (tfQuestions.length > 0) {
    doc += `% ─── PHẦN II: TRẮC NGHIỆM ĐÚNG SAI (${tfQuestions.length} câu) ───
\\section*{PHẦN II. Câu trắc nghiệm đúng sai}
\\textit{Thí sinh trả lời từ Câu ${mcQuestions.length + 1} đến Câu ${mcQuestions.length + tfQuestions.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.}

\\begin{enumerate}[label=\\textbf{Câu \\arabic*.},start=${mcQuestions.length + 1}]
`;
    for (const q of tfQuestions) {
      doc += `  \\item ${escapeLatex(q.content)}\n`;
      if (q.options && q.options.length === 4) {
        doc += `  \\begin{enumerate}[label=\\textbf{\\alph*)}]\n`;
        for (const opt of q.options) {
          doc += `    \\item ${escapeLatex(opt)}\n`;
        }
        doc += `  \\end{enumerate}\n`;
      }
    }
    doc += `\\end{enumerate}\n\n`;
  }

  // ═══════════════════════════════════════════
  // PHẦN III: TRẢ LỜI NGẮN
  // ═══════════════════════════════════════════
  if (saQuestions.length > 0) {
    const saStart = mcQuestions.length + tfQuestions.length + 1;
    doc += `% ─── PHẦN III: TRẢ LỜI NGẮN (${saQuestions.length} câu) ───
\\section*{PHẦN III. Câu trắc nghiệm trả lời ngắn}
\\textit{Thí sinh trả lời từ Câu ${saStart} đến Câu ${saStart + saQuestions.length - 1}. Thí sinh điền đáp số (dạng số) vào bài làm.}

\\begin{enumerate}[label=\\textbf{Câu \\arabic*.},start=${saStart}]
`;
    for (const q of saQuestions) {
      doc += `  \\item ${escapeLatex(q.content)}\n`;
    }
    doc += `\\end{enumerate}\n\n`;
  }

  // ═══════════════════════════════════════════
  // ĐÁP ÁN (nếu cần)
  // ═══════════════════════════════════════════
  if (includeAnswerKey) {
    doc += `\\newpage
\\section*{ĐÁP ÁN${examCode ? ` - Mã đề ${examCode}` : ''}}

\\begin{center}
\\begin{tabular}{|c|c|c|c|c|c|c|c|c|c|c|}
\\hline
`;
    const allQuestions = [...mcQuestions, ...tfQuestions, ...saQuestions];
    const cols = 10;
    for (let i = 0; i < allQuestions.length; i += cols) {
      const row = allQuestions.slice(i, i + cols);
      doc += row.map(q => `\\textbf{${q.number}}`).join(' & ');
      if (row.length < cols) doc += ' & '.repeat(cols - row.length);
      doc += ' \\\\\n\\hline\n';
      doc += row.map(q => q.correctAnswer || '').join(' & ');
      if (row.length < cols) doc += ' & '.repeat(cols - row.length);
      doc += ' \\\\\n\\hline\n';
    }
    doc += `\\end{tabular}
\\end{center}\n`;
  }

  doc += `
\\vfill
\\begin{center}
\\rule{0.4\\textwidth}{0.5pt}\\\\
\\textbf{--- HẾT ---}
\\end{center}

\\end{document}`;

  return doc;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Đảm bảo LaTeX source có preamble đầy đủ
 */
function ensureDocumentPreamble(latexSource: string, options: CompileOptions = {}): string {
  // Nếu đã có \documentclass thì giữ nguyên
  if (latexSource.includes('\\documentclass')) return latexSource;

  const fontSize = options.fontSize || 12;
  const paperSize = options.paperSize || 'a4';

  return `\\documentclass[${fontSize}pt,${paperSize}paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\geometry{left=2cm,right=2cm,top=2cm,bottom=2cm}

\\begin{document}
${latexSource}
\\end{document}`;
}

/**
 * Escape special LaTeX characters (nhưng giữ nguyên các command LaTeX)
 */
function escapeLatex(text: string): string {
  // Nếu đã có LaTeX commands thì giữ nguyên
  if (text.includes('\\') || text.includes('$') || text.includes('{')) {
    return text;
  }
  
  return text
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_');
}

/**
 * Simple LaTeX → HTML fallback converter
 * Cho trường hợp latex.js fail
 */
function simpleLatexToHtml(latexSource: string): string {
  let html = latexSource;

  // Remove preamble
  html = html.replace(/\\documentclass\{[^}]*\}/g, '');
  html = html.replace(/\\usepackage(\[[^\]]*\])?\{[^}]*\}/g, '');
  html = html.replace(/\\begin\{document\}/g, '');
  html = html.replace(/\\end\{document\}/g, '');
  html = html.replace(/\\geometry\{[^}]*\}/g, '');

  // Sections
  html = html.replace(/\\section\*?\{([^}]*)\}/g, '<h2>$1</h2>');
  html = html.replace(/\\subsection\*?\{([^}]*)\}/g, '<h3>$1</h3>');
  html = html.replace(/\\subsubsection\*?\{([^}]*)\}/g, '<h4>$1</h4>');

  // Text formatting
  html = html.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
  html = html.replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>');
  html = html.replace(/\\texttt\{([^}]*)\}/g, '<code>$1</code>');

  // Math (wrap in KaTeX spans)
  html = html.replace(/\$\$([^$]+)\$\$/g, '<div class="math-display">$$$$1$$</div>');
  html = html.replace(/\$([^$]+)\$/g, '<span class="math-inline">$$1$</span>');

  // Lists
  html = html.replace(/\\begin\{enumerate\}(\[[^\]]*\])?/g, '<ol>');
  html = html.replace(/\\end\{enumerate\}/g, '</ol>');
  html = html.replace(/\\begin\{itemize\}/g, '<ul>');
  html = html.replace(/\\end\{itemize\}/g, '</ul>');
  html = html.replace(/\\item\s*/g, '<li>');

  // Line breaks and spacing
  html = html.replace(/\\\\/g, '<br>');
  html = html.replace(/\\vspace\{[^}]*\}/g, '<br>');
  html = html.replace(/\\hfill/g, '');
  html = html.replace(/\\noindent/g, '');
  html = html.replace(/\\newpage/g, '<hr>');
  html = html.replace(/\\rule\{[^}]*\}\{[^}]*\}/g, '<hr>');

  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');

  // Wrap in full HTML
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .math-display { text-align: center; margin: 1em 0; }
    .math-inline { font-style: italic; }
    ol, ul { margin: 0.5em 0; }
  </style>
</head>
<body>
  <p>${html}</p>
</body>
</html>`;
}

// ============================================
// PHYSICS TEMPLATES — Mẫu đề thi Vật lý
// ============================================

export const PHYSICS_TEMPLATES = {
  // Mẫu đề THPTQG 2025 (28 câu: 18TN + 4ĐS + 6TLN)
  THPTQG_2025: {
    name: 'Đề thi THPTQG 2025',
    description: 'Cấu trúc 28 câu: 18 Trắc nghiệm + 4 Đúng sai + 6 Trả lời ngắn',
    structure: { mc: 18, tf: 4, sa: 6, total: 28 },
    duration: 50,
  },
  
  // Mẫu đề thường (22 câu: 12TN + 4ĐS + 6TLN) — LEGACY
  LEGACY: {
    name: 'Đề thi truyền thống',
    description: 'Cấu trúc 22 câu: 12 Trắc nghiệm + 4 Đúng sai + 6 Trả lời ngắn',
    structure: { mc: 12, tf: 4, sa: 6, total: 22 },
    duration: 50,
  },

  // Đề kiểm tra 15 phút
  QUICK_15: {
    name: 'Kiểm tra 15 phút',
    description: '10 câu trắc nghiệm',
    structure: { mc: 10, tf: 0, sa: 0, total: 10 },
    duration: 15,
  },

  // Đề kiểm tra 1 tiết
  MIDTERM_45: {
    name: 'Kiểm tra 1 tiết',
    description: '15 câu: 10TN + 2ĐS + 3TLN',
    structure: { mc: 10, tf: 2, sa: 3, total: 15 },
    duration: 45,
  },
} as const;

/**
 * LaTeX validator — kiểm tra cú pháp LaTeX cơ bản
 */
export function validateLatex(latexSource: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check matching braces
  let braceCount = 0;
  for (let i = 0; i < latexSource.length; i++) {
    if (latexSource[i] === '{' && (i === 0 || latexSource[i-1] !== '\\')) braceCount++;
    if (latexSource[i] === '}' && (i === 0 || latexSource[i-1] !== '\\')) braceCount--;
    if (braceCount < 0) {
      errors.push(`Dấu } thừa tại vị trí ${i}`);
      break;
    }
  }
  if (braceCount > 0) errors.push(`Thiếu ${braceCount} dấu } đóng`);

  // Check matching begin/end
  const beginRegex = /\\begin\{(\w+)\}/g;
  const endRegex = /\\end\{(\w+)\}/g;
  const envStack: string[] = [];
  
  let match;
  while ((match = beginRegex.exec(latexSource)) !== null) {
    envStack.push(match[1]);
  }
  
  const endEnvs: string[] = [];
  while ((match = endRegex.exec(latexSource)) !== null) {
    endEnvs.push(match[1]);
  }
  
  if (envStack.length !== endEnvs.length) {
    errors.push(`Số lượng \\begin (${envStack.length}) và \\end (${endEnvs.length}) không khớp`);
  }

  // Check for common issues
  if (latexSource.includes('\\documentclass') && !latexSource.includes('\\begin{document}')) {
    errors.push('Có \\documentclass nhưng thiếu \\begin{document}');
  }

  // Warnings
  if (!latexSource.includes('\\usepackage[utf8]{inputenc}') && latexSource.includes('\\documentclass')) {
    warnings.push('Nên thêm \\usepackage[utf8]{inputenc} để hỗ trợ tiếng Việt');
  }

  if (latexSource.includes('\\includegraphics') && !latexSource.includes('\\usepackage{graphicx}')) {
    warnings.push('Cần \\usepackage{graphicx} để dùng \\includegraphics');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
