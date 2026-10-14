/**
 * API Route: /api/latex/compile
 * Module 7 — LaTeX Compiler
 * 
 * Endpoints:
 * POST /api/latex/compile
 *   - mode: 'html' → LaTeX → HTML (via latex.js)
 *   - mode: 'pdf'  → LaTeX → PDF (via external API)
 *   - mode: 'preview' → Math → KaTeX HTML
 *   - mode: 'template' → Generate exam LaTeX source
 *   - mode: 'validate' → Validate LaTeX syntax
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  compileToHtml,
  compileToPdf,
  renderMathPreview,
  generateExamLatex,
  validateLatex,
  PHYSICS_TEMPLATES,
} from '@/lib/latex-compiler';
import type { ExamTemplateData } from '@/lib/latex-compiler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latex, mode = 'html', options = {} } = body;

    // ─── Validate input ───
    if (mode === 'template') {
      // Template mode doesn't need latex input, needs templateData
      if (!body.templateData) {
        return NextResponse.json(
          { success: false, error: 'Thiếu templateData cho mode template' },
          { status: 400 }
        );
      }
    } else if (mode === 'validate') {
      if (!latex || typeof latex !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Thiếu nội dung LaTeX cần validate' },
          { status: 400 }
        );
      }
    } else {
      if (!latex || typeof latex !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Thiếu nội dung LaTeX' },
          { status: 400 }
        );
      }
    }

    // ─── Route by mode ───
    switch (mode) {
      // ═══════════════════════════════════════
      // MODE: HTML — LaTeX → HTML (via latex.js)
      // ═══════════════════════════════════════
      case 'html': {
        const result = await compileToHtml(latex);
        return NextResponse.json({
          success: result.success,
          mode: 'html',
          html: result.html,
          errors: result.errors,
          warnings: result.warnings,
          compilationTime: result.compilationTime,
        });
      }

      // ═══════════════════════════════════════
      // MODE: PDF — LaTeX → PDF binary
      // ═══════════════════════════════════════
      case 'pdf': {
        const result = await compileToPdf(latex, options);
        
        if (!result.success || !result.pdfBuffer) {
          return NextResponse.json({
            success: false,
            mode: 'pdf',
            errors: result.errors,
            compilationTime: result.compilationTime,
          }, { status: 500 });
        }

        // Return PDF as binary
        return new NextResponse(new Uint8Array(result.pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="scisphy_${Date.now()}.pdf"`,
            'Content-Length': result.pdfBuffer.length.toString(),
            'X-Compilation-Time': `${result.compilationTime}ms`,
          },
        });
      }

      // ═══════════════════════════════════════
      // MODE: PREVIEW — Math → KaTeX HTML
      // ═══════════════════════════════════════
      case 'preview': {
        const displayMode = options.displayMode ?? false;
        const result = renderMathPreview(latex, displayMode);
        return NextResponse.json({
          success: result.success,
          mode: 'preview',
          html: result.preview,
          errors: result.errors,
          compilationTime: result.compilationTime,
        });
      }

      // ═══════════════════════════════════════
      // MODE: TEMPLATE — Generate exam LaTeX
      // ═══════════════════════════════════════
      case 'template': {
        const templateData: ExamTemplateData = body.templateData;
        const result = generateExamLatex(templateData);
        return NextResponse.json({
          success: result.success,
          mode: 'template',
          latex: result.latex,
          errors: result.errors,
          compilationTime: result.compilationTime,
        });
      }

      // ═══════════════════════════════════════
      // MODE: VALIDATE — Check LaTeX syntax
      // ═══════════════════════════════════════
      case 'validate': {
        const validation = validateLatex(latex);
        return NextResponse.json({
          success: true,
          mode: 'validate',
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Mode không hợp lệ: ${mode}. Hỗ trợ: html, pdf, preview, template, validate` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[LaTeX Compile API Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi server' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════
// GET — Lấy danh sách templates + info
// ═══════════════════════════════════════
export async function GET() {
  return NextResponse.json({
    success: true,
    module: 'LaTeX Compiler',
    version: '1.0.0',
    modes: [
      { name: 'html', description: 'LaTeX → HTML (via latex.js)' },
      { name: 'pdf', description: 'LaTeX → PDF (via external API)' },
      { name: 'preview', description: 'Math → KaTeX HTML (quick preview)' },
      { name: 'template', description: 'Generate exam LaTeX from template' },
      { name: 'validate', description: 'Validate LaTeX syntax' },
    ],
    templates: Object.entries(PHYSICS_TEMPLATES).map(([key, tpl]) => ({
      id: key,
      name: tpl.name,
      description: tpl.description,
      structure: tpl.structure,
      duration: tpl.duration,
    })),
    physicsMacros: {
      '\\vect{F}': 'Vector F (→)',
      '\\unit{m/s}': 'Đơn vị m/s',
      '\\ms': 'm/s',
      '\\mss': 'm/s²',
      '\\N': 'Newton',
      '\\J': 'Joule',
      '\\W': 'Watt',
      '\\V': 'Volt',
      '\\A': 'Ampere',
      '\\ohm': 'Ω (Ohm)',
      '\\Hz': 'Hertz',
    },
  });
}
