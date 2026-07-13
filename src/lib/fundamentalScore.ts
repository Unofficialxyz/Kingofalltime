import type { Fundamentals } from './types';

export interface FundamentalScore {
  score: number; // 0..100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  pillars: { name: string; score: number; note: string }[];
  verdict: string;
}

function gradeFor(score: number): FundamentalScore['grade'] {
  if (score >= 85) return 'A+';
  if (score >= 72) return 'A';
  if (score >= 58) return 'B';
  if (score >= 44) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function clamp(n: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)); }

export function scoreFundamentals(f: Fundamentals): FundamentalScore {
  const pillars: FundamentalScore['pillars'] = [];

  // Valuation (lower P/E, P/B, PEG, EV/EBITDA is better)
  const valScore = clamp(
    100
    - Math.max(0, f.pe - 15) * 1.6
    - Math.max(0, f.pb - 3) * 4
    - Math.max(0, f.peg - 1.5) * 14
    - Math.max(0, f.evEbitda - 12) * 1.4,
  );
  pillars.push({ name: 'Valuation', score: +valScore.toFixed(0), note: valScore > 60 ? 'Reasonably priced' : 'Premium / richly valued' });

  // Profitability
  const profScore = clamp(
    f.grossMargin * 120 + f.netMargin * 220 + f.roe * 110,
  );
  pillars.push({ name: 'Profitability', score: +profScore.toFixed(0), note: profScore > 60 ? 'Strong margins & returns' : 'Thin profitability' });

  // Growth
  const growthScore = clamp(50 + f.revenueGrowth * 120 + f.earningsGrowth * 100);
  pillars.push({ name: 'Growth', score: +growthScore.toFixed(0), note: growthScore > 60 ? 'Growing top & bottom line' : 'Stagnant or declining' });

  // Financial health
  const healthScore = clamp(
    60
    - Math.max(0, f.debtToEquity - 1) * 22
    + (f.currentRatio - 1.2) * 14
    + (f.quickRatio - 1) * 10,
  );
  pillars.push({ name: 'Financial Health', score: +healthScore.toFixed(0), note: healthScore > 60 ? 'Healthy balance sheet' : 'Elevated leverage risk' });

  // Cash return
  const cashScore = clamp(f.fcfYield * 900 + f.roic * 90);
  pillars.push({ name: 'Cash Return', score: +cashScore.toFixed(0), note: cashScore > 60 ? 'Strong free cash conversion' : 'Weak cash generation' });

  const overall = clamp(pillars.reduce((a, p) => a + p.score, 0) / pillars.length);
  const grade = gradeFor(overall);
  const verdict =
    overall >= 80 ? 'High-quality compounder trading at a fair price.'
    : overall >= 65 ? 'Solid business; monitor valuation entry point.'
    : overall >= 50 ? 'Mixed quality — strengths offset by weaknesses.'
    : overall >= 35 ? 'Below-average fundamentals; higher risk.'
    : 'Weak fundamentals; speculative.';

  return { score: +overall.toFixed(0), grade, pillars, verdict };
}
