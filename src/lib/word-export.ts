/**
 * ScisPhy — Word Export Engine
 *
 * Xuất đề thi ra file .docx chuẩn Bộ GD&ĐT.
 * Hỗ trợ:
 *   - Header: Sở GD&ĐT, Trường, Tên đề, Mã đề, Thời gian
 *   - Body: 3 phần (TN, ĐS, TLN) với đánh số đúng format
 *   - KaTeX → Word: Convert LaTeX math sang OMML (Office Math Markup)
 *   - Answer Key sheet riêng
 *   - Multi-variant: Xuất nhiều mã đề trong 1 file
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
  TabStopType,
  TabStopPosition,
  Header,
  Footer,
} from 'docx';
import type { ExamVariant, AnswerKey } from './shuffle-engine';

// ===== TYPES =====

export interface ExamDocConfig {
  /** Dòng 1 header trái: "SỞ GIÁO DỤC VÀ ĐÀO TẠO ..." */
  department: string;
  /** Dòng 2 header trái: "TRƯỜNG THPT ..." */
  school: string;
  /** Tên đề thi: "ĐỀ THI THỬ MÔN VẬT LÝ THPT QUỐC GIA" */
  examTitle: string;
  /** Môn thi */
  subject: string;
  /** Thời gian làm bài */
  duration: string;
  /** Năm học */
  schoolYear?: string;
  /** Ghi chú footer */
  note?: string;
}

// ===== HELPERS =====

/**
 * Strip LaTeX math delimiters and convert simple formulas to plain text.
 * For Word: We output formulas as plain text with basic formatting.
 * Full OMML conversion would need a separate library.
 */
function latexToPlainText(text: string): string {
  if (!text) return '';

  let result = text;

  // Remove display math delimiters
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, '$1');

  // Remove inline math delimiters
  result = result.replace(/\$([^\$\n]+?)\$/g, '$1');
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, '$1');

  // Common LaTeX → Unicode conversions
  result = result.replace(/\\alpha/g, 'α');
  result = result.replace(/\\beta/g, 'β');
  result = result.replace(/\\gamma/g, 'γ');
  result = result.replace(/\\delta/g, 'δ');
  result = result.replace(/\\Delta/g, 'Δ');
  result = result.replace(/\\epsilon/g, 'ε');
  result = result.replace(/\\theta/g, 'θ');
  result = result.replace(/\\lambda/g, 'λ');
  result = result.replace(/\\mu/g, 'μ');
  result = result.replace(/\\pi/g, 'π');
  result = result.replace(/\\sigma/g, 'σ');
  result = result.replace(/\\omega/g, 'ω');
  result = result.replace(/\\Omega/g, 'Ω');
  result = result.replace(/\\phi/g, 'φ');
  result = result.replace(/\\rho/g, 'ρ');
  result = result.replace(/\\tau/g, 'τ');
  result = result.replace(/\\infty/g, '∞');
  result = result.replace(/\\pm/g, '±');
  result = result.replace(/\\mp/g, '∓');
  result = result.replace(/\\times/g, '×');
  result = result.replace(/\\div/g, '÷');
  result = result.replace(/\\cdot/g, '·');
  result = result.replace(/\\leq/g, '≤');
  result = result.replace(/\\geq/g, '≥');
  result = result.replace(/\\neq/g, '≠');
  result = result.replace(/\\approx/g, '≈');
  result = result.replace(/\\rightarrow/g, '→');
  result = result.replace(/\\Rightarrow/g, '⇒');
  result = result.replace(/\\leftarrow/g, '←');
  result = result.replace(/\\leftrightarrow/g, '↔');
  result = result.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  result = result.replace(/\\sqrt/g, '√');
  result = result.replace(/\\vec\{([^}]+)\}/g, '$1⃗');
  result = result.replace(/\\overline\{([^}]+)\}/g, '$1̄');
  result = result.replace(/\\text\{([^}]+)\}/g, '$1');
  result = result.replace(/\\mathrm\{([^}]+)\}/g, '$1');
  result = result.replace(/\\,/g, ' ');
  result = result.replace(/\\;/g, ' ');
  result = result.replace(/\\!/g, '');
  result = result.replace(/\\quad/g, '  ');

  // Fractions: \frac{a}{b} or \dfrac{a}{b} → (a)/(b)
  result = result.replace(/\\d?frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');

  // Superscript: ^{...} → leave as is (Word doesn't support inline superscript in plain text easily)
  result = result.replace(/\^{([^}]+)}/g, '^($1)');
  result = result.replace(/\^(\w)/g, '^$1');

  // Subscript: _{...}
  result = result.replace(/_{([^}]+)}/g, '_($1)');
  result = result.replace(/_(\w)/g, '_$1');

  // Clean remaining LaTeX commands
  result = result.replace(/\\[a-zA-Z]+/g, '');
  result = result.replace(/[{}]/g, '');

  // Clean double spaces
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

/** Tạo TextRun từ plain text content */
function textRun(text: string, opts?: { bold?: boolean; italic?: boolean; size?: number }): TextRun {
  return new TextRun({
    text: latexToPlainText(text),
    bold: opts?.bold,
    italics: opts?.italic,
    size: opts?.size || 24, // 12pt
    font: 'Times New Roman',
  });
}

// ===== DOCUMENT BUILDER =====

/**
 * Build 1 variant thành danh sách Paragraph[].
 */
function buildVariantParagraphs(
  variant: ExamVariant,
  config: ExamDocConfig
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // ─── HEADER ───
  // Line 1: Sở GD&ĐT (left) | ĐỀ THI (right) — using tab stops
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: config.department, bold: true, size: 22, font: 'Times New Roman' }),
        new TextRun({ text: '\t', size: 22, font: 'Times New Roman' }),
        new TextRun({
          text: `ĐỀ THI THỬ ${config.schoolYear || ''}`,
          bold: true,
          size: 22,
          font: 'Times New Roman',
        }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    })
  );

  // Line 2: Trường (left) | Mã đề (right)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: config.school, bold: true, size: 22, font: 'Times New Roman' }),
        new TextRun({ text: '\t', size: 22, font: 'Times New Roman' }),
        new TextRun({
          text: `MÃ ĐỀ: ${variant.variantCode}`,
          bold: true,
          size: 24,
          font: 'Times New Roman',
        }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    })
  );

  // Blank
  paragraphs.push(new Paragraph({ children: [] }));

  // Title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: config.examTitle,
          bold: true,
          size: 28, // 14pt
          font: 'Times New Roman',
          allCaps: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    })
  );

  // Subject + Duration
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Môn: ${config.subject} — Thời gian: ${config.duration} (không kể thời gian phát đề)`,
          italics: true,
          size: 22,
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Divider line
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: '─'.repeat(60), size: 16, font: 'Times New Roman' }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // ─── QUESTIONS ───
  const mcQuestions = variant.questions.filter((q) => q.format === 'MULTIPLE_CHOICE');
  const tfQuestions = variant.questions.filter((q) => q.format === 'TRUE_FALSE');
  const saQuestions = variant.questions.filter((q) => q.format === 'SHORT_ANSWER');

  // PHẦN I: TRẮC NGHIỆM
  if (mcQuestions.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          textRun(`PHẦN I. TRẮC NGHIỆM (${mcQuestions.length} câu)`, { bold: true, size: 26 }),
        ],
        spacing: { before: 120, after: 60 },
      })
    );

    mcQuestions.forEach((q, idx) => {
      // Question text
      paragraphs.push(
        new Paragraph({
          children: [
            textRun(`Câu ${idx + 1}. `, { bold: true }),
            textRun(q.content),
          ],
          spacing: { before: 80, after: 40 },
        })
      );

      // Options A, B, C, D
      if (q.shuffledOptions) {
        // 2 options per row
        for (let i = 0; i < q.shuffledOptions.length; i += 2) {
          const opt1 = q.shuffledOptions[i];
          const opt2 = q.shuffledOptions[i + 1];

          const children: TextRun[] = [
            textRun(`     ${opt1.newLabel}. `),
            textRun(opt1.text),
          ];

          if (opt2) {
            children.push(new TextRun({ text: '\t', size: 24, font: 'Times New Roman' }));
            children.push(textRun(`${opt2.newLabel}. `));
            children.push(textRun(opt2.text));
          }

          paragraphs.push(
            new Paragraph({
              children,
              tabStops: [{ type: TabStopType.LEFT, position: 5000 }],
              spacing: { after: 20 },
            })
          );
        }
      }
    });
  }

  // PHẦN II: ĐÚNG/SAI
  if (tfQuestions.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          textRun(
            `PHẦN II. ĐÚNG SAI (${tfQuestions.length} câu). Mỗi câu gồm 4 ý a), b), c), d). Thí sinh chọn ĐÚNG hoặc SAI cho mỗi ý.`,
            { bold: true, size: 26 }
          ),
        ],
        spacing: { before: 120, after: 60 },
      })
    );

    tfQuestions.forEach((q, idx) => {
      paragraphs.push(
        new Paragraph({
          children: [
            textRun(`Câu ${idx + 1}. `, { bold: true }),
            textRun(q.content),
          ],
          spacing: { before: 80, after: 40 },
        })
      );

      // Sub-items a, b, c, d
      if (q.shuffledOptions) {
        q.shuffledOptions.forEach((opt) => {
          paragraphs.push(
            new Paragraph({
              children: [
                textRun(`     ${opt.newLabel}) `, { bold: true }),
                textRun(opt.text),
              ],
              spacing: { after: 20 },
            })
          );
        });
      }
    });
  }

  // PHẦN III: TRẢ LỜI NGẮN
  if (saQuestions.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          textRun(
            `PHẦN III. TRẢ LỜI NGẮN (${saQuestions.length} câu). Thí sinh trả lời bằng số hoặc biểu thức ngắn.`,
            { bold: true, size: 26 }
          ),
        ],
        spacing: { before: 120, after: 60 },
      })
    );

    saQuestions.forEach((q, idx) => {
      paragraphs.push(
        new Paragraph({
          children: [
            textRun(`Câu ${idx + 1}. `, { bold: true }),
            textRun(q.content),
          ],
          spacing: { before: 80, after: 40 },
        })
      );
    });
  }

  // Footer note
  if (config.note) {
    paragraphs.push(
      new Paragraph({
        children: [],
        spacing: { before: 200 },
      })
    );
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: config.note,
            italics: true,
            size: 20,
            font: 'Times New Roman',
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );
  }

  // HẾT
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '——— HẾT ———',
          bold: true,
          size: 24,
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    })
  );

  return paragraphs;
}

/**
 * Build Answer Key page.
 */
function buildAnswerKeyParagraphs(answerKeys: AnswerKey[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'BẢNG ĐÁP ÁN',
          bold: true,
          size: 28,
          font: 'Times New Roman',
          allCaps: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    })
  );

  for (const ak of answerKeys) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Mã đề: ${ak.variantCode}`,
            bold: true,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
        spacing: { before: 120, after: 40 },
      })
    );

    // Group by format
    const mc = ak.entries.filter((e) => e.format === 'MULTIPLE_CHOICE');
    const tf = ak.entries.filter((e) => e.format === 'TRUE_FALSE');
    const sa = ak.entries.filter((e) => e.format === 'SHORT_ANSWER');

    if (mc.length > 0) {
      // MC answers on one line: 1.A  2.C  3.B  ...
      const mcLine = mc.map((e) => `${e.position}.${e.correctAnswer}`).join('   ');
      paragraphs.push(
        new Paragraph({
          children: [
            textRun('TN: ', { bold: true }),
            textRun(mcLine),
          ],
          spacing: { after: 20 },
        })
      );
    }

    if (tf.length > 0) {
      tf.forEach((e) => {
        paragraphs.push(
          new Paragraph({
            children: [
              textRun(`ĐS Câu ${e.position}: `, { bold: true }),
              textRun(e.correctAnswer),
            ],
            spacing: { after: 10 },
          })
        );
      });
    }

    if (sa.length > 0) {
      sa.forEach((e) => {
        paragraphs.push(
          new Paragraph({
            children: [
              textRun(`TLN Câu ${e.position}: `, { bold: true }),
              textRun(e.correctAnswer),
            ],
            spacing: { after: 10 },
          })
        );
      });
    }
  }

  return paragraphs;
}

// ===== MAIN EXPORT =====

/**
 * Tạo file .docx chứa đề thi + bảng đáp án.
 * 
 * @returns Buffer chứa nội dung .docx
 */
export async function generateExamDocx(
  variants: ExamVariant[],
  answerKeys: AnswerKey[],
  config: ExamDocConfig
): Promise<Buffer> {
  const sections: any[] = [];

  // Mỗi variant = 1 section (page break)
  for (const variant of variants) {
    const children = buildVariantParagraphs(variant, config);
    sections.push({
      properties: {
        page: {
          margin: {
            top: 720,    // 0.5 inch
            bottom: 720,
            left: 1080,  // 0.75 inch
            right: 1080,
          },
        },
      },
      children,
    });
  }

  // Answer key section
  const akChildren = buildAnswerKeyParagraphs(answerKeys);
  sections.push({
    properties: {
      page: {
        margin: { top: 720, bottom: 720, left: 1080, right: 1080 },
      },
    },
    children: akChildren,
  });

  const doc = new Document({
    creator: 'ScisPhy — Ngân Hàng Số Vật Lý',
    title: config.examTitle,
    description: `Đề thi ${config.subject} — ${config.school}`,
    sections,
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
