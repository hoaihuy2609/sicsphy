import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/utilities/latex-to-text — Module 6: Chuyển LaTeX sang Unicode/Plain text
 * 
 * Body: { latex: string }
 * Returns: { text: string, html: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'latex-to-unicode' } = body;
    const latex = body.latex || body.text || '';

    switch (action) {
      case 'latex-to-unicode':
      case 'latex-to-text': {
        if (!latex) {
          return NextResponse.json({ success: false, error: 'Thiếu nội dung LaTeX.' }, { status: 400 });
        }

        const text = convertLatexToUnicode(latex);

        return NextResponse.json({
          success: true,
          original: latex,
          text,
          charCount: text.length,
        });
      }

      case 'extract-math':
      case 'detect-math': {
        // Detect and extract all math expressions from text
        if (!latex) {
          return NextResponse.json({ success: false, error: 'Thiếu nội dung văn bản.' }, { status: 400 });
        }

        const expressions = extractMathExpressions(latex);
        return NextResponse.json({
          success: true,
          expressions,
          count: expressions.length,
        });
      }

      case 'validate-latex': {
        if (!latex) {
          return NextResponse.json({ success: false, error: 'Thiếu nội dung LaTeX.' }, { status: 400 });
        }

        const validation = validateLatex(latex);
        return NextResponse.json({
          success: true,
          ...validation,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Action "${action}" không hợp lệ. Dùng: latex-to-unicode, extract-math, validate-latex.` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════
// LaTeX → Unicode converter
// ═══════════════════════════════════════════

function convertLatexToUnicode(latex: string): string {
  let r = latex;

  // Strip math delimiters
  r = r.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  r = r.replace(/\\\[([\s\S]*?)\\\]/g, '$1');
  r = r.replace(/\$([^\$\n]+?)\$/g, '$1');
  r = r.replace(/\\\(([\s\S]*?)\\\)/g, '$1');

  // Greek letters
  const greekMap: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε',
    '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π',
    '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
    '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ', '\\Xi': 'Ξ',
    '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Phi': 'Φ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
  };
  for (const [cmd, char] of Object.entries(greekMap)) {
    r = r.split(cmd).join(char);
  }

  // Math operators & symbols
  const symbolMap: Record<string, string> = {
    '\\pm': '±', '\\mp': '∓', '\\times': '×', '\\div': '÷', '\\cdot': '·',
    '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈', '\\equiv': '≡',
    '\\sim': '∼', '\\propto': '∝', '\\infty': '∞', '\\partial': '∂',
    '\\nabla': '∇', '\\forall': '∀', '\\exists': '∃', '\\in': '∈', '\\notin': '∉',
    '\\subset': '⊂', '\\supset': '⊃', '\\cup': '∪', '\\cap': '∩',
    '\\rightarrow': '→', '\\Rightarrow': '⇒', '\\leftarrow': '←',
    '\\Leftarrow': '⇐', '\\leftrightarrow': '↔', '\\Leftrightarrow': '⇔',
    '\\uparrow': '↑', '\\downarrow': '↓',
    '\\circ': '°', '\\degree': '°', '\\bullet': '•', '\\star': '★',
    '\\angle': '∠', '\\perp': '⊥', '\\parallel': '∥',
    '\\sum': 'Σ', '\\prod': 'Π', '\\int': '∫',
  };
  for (const [cmd, char] of Object.entries(symbolMap)) {
    r = r.split(cmd).join(char);
  }

  // Superscript digits: ^0 → ⁰, ^1 → ¹, etc.
  const supDigits: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', 'n': 'ⁿ',
  };

  // Subscript digits
  const subDigits: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋',
  };

  // ^{...} → superscript
  r = r.replace(/\^{([^}]+)}/g, (_, content) => {
    return content.split('').map((c: string) => supDigits[c] || c).join('');
  });
  r = r.replace(/\^(\d)/g, (_, d) => supDigits[d] || d);

  // _{...} → subscript
  r = r.replace(/_{([^}]+)}/g, (_, content) => {
    return content.split('').map((c: string) => subDigits[c] || c).join('');
  });
  r = r.replace(/_(\d)/g, (_, d) => subDigits[d] || d);

  // Fractions
  r = r.replace(/\\d?frac{([^}]+)}{([^}]+)}/g, '($1)/($2)');

  // sqrt
  r = r.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  r = r.replace(/\\sqrt/g, '√');

  // vec, overline
  r = r.replace(/\\vec{([^}]+)}/g, '$1⃗');
  r = r.replace(/\\overline{([^}]+)}/g, '$1̄');
  r = r.replace(/\\hat{([^}]+)}/g, '$1̂');
  r = r.replace(/\\dot{([^}]+)}/g, '$1̇');

  // Text commands
  r = r.replace(/\\text{([^}]+)}/g, '$1');
  r = r.replace(/\\mathrm{([^}]+)}/g, '$1');
  r = r.replace(/\\textbf{([^}]+)}/g, '$1');
  r = r.replace(/\\textit{([^}]+)}/g, '$1');

  // Spacing
  r = r.replace(/\\,/g, ' ');
  r = r.replace(/\\;/g, ' ');
  r = r.replace(/\\!/g, '');
  r = r.replace(/\\quad/g, '  ');
  r = r.replace(/\\qquad/g, '    ');
  r = r.replace(/\\\\/g, '\n');

  // Clean remaining commands
  r = r.replace(/\\[a-zA-Z]+/g, '');
  r = r.replace(/[{}]/g, '');
  r = r.replace(/\s+/g, ' ').trim();

  return r;
}

// ═══════════════════════════════════════════
// Math expression extractor
// ═══════════════════════════════════════════

function extractMathExpressions(text: string): Array<{ type: string; raw: string; converted: string }> {
  const results: Array<{ type: string; raw: string; converted: string }> = [];

  // Display math $$...$$
  const displayRegex = /\$\$([\s\S]*?)\$\$/g;
  let match;
  while ((match = displayRegex.exec(text)) !== null) {
    results.push({ type: 'display', raw: match[0], converted: convertLatexToUnicode(match[1]) });
  }

  // Inline math $...$
  const inlineRegex = /\$([^\$\n]+?)\$/g;
  while ((match = inlineRegex.exec(text)) !== null) {
    results.push({ type: 'inline', raw: match[0], converted: convertLatexToUnicode(match[1]) });
  }

  return results;
}

// ═══════════════════════════════════════════
// LaTeX validator
// ═══════════════════════════════════════════

function validateLatex(latex: string): { valid: boolean; issues: string[]; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check balanced braces
  let braceCount = 0;
  for (const char of latex) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount < 0) {
      errors.push('Dấu } thừa (không có { tương ứng).');
      break;
    }
  }
  if (braceCount > 0) {
    errors.push(`Thiếu ${braceCount} dấu }.`);
  }

  // Check balanced $ delimiters
  const dollarCount = (latex.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    errors.push('Số dấu $ lẻ — thiếu dấu $ đóng/mở.');
  }

  // Check common errors
  if (latex.includes('\\frac{') && !latex.includes('}{')) {
    errors.push('\\frac có thể thiếu tham số thứ 2.');
  }

  // Check for unsupported TikZ packages
  if (latex.includes('circuitikz')) {
    warnings.push('Package circuitikz không được hỗ trợ trong TikZJax. Dùng TikZ thủ công.');
  }
  if (latex.includes('pgfplots')) {
    warnings.push('Package pgfplots không được hỗ trợ trong TikZJax.');
  }

  const issues = [
    ...errors,
    ...warnings.map(w => `⚠️ ${w}`)
  ];

  return { valid: errors.length === 0, issues, errors, warnings };
}
