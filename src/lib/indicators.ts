import type { Candle } from './types';

export interface TechnicalSummary {
  rsi: number; rsiSignal: string;
  macd: number; macdSignal: number; macdHist: number; macdTrend: string;
  sma50: number; sma200: number; aboveSma50: boolean; aboveSma200: boolean;
  bbUpper: number; bbMiddle: number; bbLower: number; bbPosition: string;
  adx: number; adxTrend: string;
  atr: number; atrPct: number;
  stochK: number; stochD: number;
  cci: number; williamsR: number; mfi: number;
  obv: number; obvTrend: string;
  vwap: number;
  supports: number[]; resistances: number[];
  trend: string; score: number; verdict: string;
}

export function sma(values: number[], period: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(NaN); continue; }
    out.push(values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0] ?? 0;
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function rsi(candles: Candle[], period = 14): number[] {
  const out: number[] = [NaN];
  let gains = 0, losses = 0;
  for (let i = 1; i <= period && i < candles.length; i++) {
    const ch = candles[i].c - candles[i - 1].c;
    if (ch >= 0) gains += ch; else losses -= ch;
  }
  let avgG = gains / period, avgL = losses / period;
  out.push(avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL));
  for (let i = period + 1; i < candles.length; i++) {
    const ch = candles[i].c - candles[i - 1].c;
    const g = ch >= 0 ? ch : 0, l = ch < 0 ? -ch : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    out.push(avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL));
  }
  while (out.length < candles.length) out.unshift(NaN);
  return out;
}

export function macd(candles: Candle[]): { macd: number[]; signal: number[]; hist: number[] } {
  const closes = candles.map((c) => c.c);
  const ema12 = ema(closes, 12), ema26 = ema(closes, 26);
  const macdLine = closes.map((_, i) => ema12[i] - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const hist = macdLine.map((m, i) => m - signalLine[i]);
  return { macd: macdLine, signal: signalLine, hist };
}

export function bollinger(candles: Candle[], period = 20, mult = 2): { upper: number[]; middle: number[]; lower: number[] } {
  const closes = candles.map((c) => c.c);
  const mid = sma(closes, period);
  const upper: number[] = [], lower: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { upper.push(NaN); lower.push(NaN); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    const sd = Math.sqrt(slice.reduce((a, b) => a + (b - mid[i]) ** 2, 0) / period);
    upper.push(mid[i] + mult * sd); lower.push(mid[i] - mult * sd);
  }
  return { upper, middle: mid, lower };
}

export function atr(candles: Candle[], period = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) { tr.push(candles[i].h - candles[i].l); continue; }
    tr.push(Math.max(candles[i].h - candles[i].l, Math.abs(candles[i].h - candles[i - 1].c), Math.abs(candles[i].l - candles[i - 1].c)));
  }
  return ema(tr, period);
}

export function adx(candles: Candle[], period = 14): number[] {
  const out: number[] = [];
  const plusDM: number[] = [0], minusDM: number[] = [0], tr: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    const up = candles[i].h - candles[i - 1].h;
    const down = candles[i - 1].l - candles[i].l;
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
    tr.push(Math.max(candles[i].h - candles[i].l, Math.abs(candles[i].h - candles[i - 1].c), Math.abs(candles[i].l - candles[i - 1].c)));
  }
  const atrArr = ema(tr, period);
  const plusDI = plusDM.map((d, i) => atrArr[i] ? (ema(plusDM, period)[i] / atrArr[i]) * 100 : 0);
  const minusDI = minusDM.map((d, i) => atrArr[i] ? (ema(minusDM, period)[i] / atrArr[i]) * 100 : 0);
  const dx = plusDI.map((p, i) => {
    const sum = p + minusDI[i];
    return sum ? Math.abs(p - minusDI[i]) / sum * 100 : 0;
  });
  const adxArr = ema(dx, period);
  return adxArr;
}

export function stoch(candles: Candle[], period = 14): { k: number[]; d: number[] } {
  const k: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { k.push(NaN); continue; }
    const slice = candles.slice(i - period + 1, i + 1);
    const hh = Math.max(...slice.map((c) => c.h));
    const ll = Math.min(...slice.map((c) => c.l));
    k.push(hh === ll ? 50 : ((candles[i].c - ll) / (hh - ll)) * 100);
  }
  const d = sma(k, 3);
  return { k, d };
}

export function vwap(candles: Candle[]): number {
  let pv = 0, vol = 0;
  for (const c of candles) { pv += ((c.h + c.l + c.c) / 3) * c.v; vol += c.v; }
  return vol ? pv / vol : 0;
}

export function analyzeTechnicals(candles: Candle[]): TechnicalSummary | null {
  if (candles.length < 30) return null;
  const closes = candles.map((c) => c.c);
  const price = closes[closes.length - 1];
  const sma50 = sma(closes, 50), sma200 = sma(closes, 200);
  const rsiArr = rsi(candles), macdData = macd(candles), bb = bollinger(candles);
  const atrArr = atr(candles), adxArr = adx(candles), stochData = stoch(candles);
  const last = closes.length - 1;
  const rsiVal = rsiArr[last] ?? 50;
  const macdVal = macdData.macd[last] ?? 0;
  const macdSig = macdData.signal[last] ?? 0;
  const macdHist = macdData.hist[last] ?? 0;
  const macdPrev = macdData.hist[last - 1] ?? 0;
  const bbU = bb.upper[last] ?? price * 1.05;
  const bbM = bb.middle[last] ?? price;
  const bbL = bb.lower[last] ?? price * 0.95;
  const adxVal = adxArr[last] ?? 20;
  const atrVal = atrArr[last] ?? price * 0.02;
  const stochK = stochData.k[last] ?? 50;
  const stochD = stochData.d[last] ?? 50;
  const sma50Val = sma50[last] ?? price;
  const sma200Val = sma200[last] ?? price;
  const bbPos = price > (bbU + bbM) / 2 ? 'Upper' : price < (bbL + bbM) / 2 ? 'Lower' : 'Middle';
  const trend = sma50Val > sma200Val && price > sma50Val ? 'Strong Uptrend' :
    sma50Val > sma200Val ? 'Uptrend' : sma50Val < sma200Val && price < sma50Val ? 'Strong Downtrend' :
    sma50Val < sma200Val ? 'Downtrend' : 'Sideways';
  const macdTrend = macdHist > 0 && macdHist > macdPrev ? 'Bullish' : macdHist < 0 && macdHist < macdPrev ? 'Bearish' : 'Neutral';
  let score = 0;
  if (price > sma200Val) score += 20; else score -= 20;
  if (price > sma50Val) score += 15; else score -= 15;
  if (rsiVal < 30) score += 15; else if (rsiVal > 70) score -= 15; else score += (rsiVal - 50) * 0.3;
  if (macdTrend === 'Bullish') score += 15; else if (macdTrend === 'Bearish') score -= 15;
  if (adxVal > 25) score += score > 0 ? 10 : -10;
  if (bbPos === 'Lower') score += 5; else if (bbPos === 'Upper') score -= 5;
  score = Math.max(-100, Math.min(100, score));
  const verdict = score >= 50 ? 'Strong Buy' : score >= 15 ? 'Buy' : score <= -50 ? 'Strong Sell' : score <= -15 ? 'Sell' : 'Hold';
  const supports = [sma50Val, bbL, Math.min(...candles.slice(-20).map((c) => c.l))].filter((v) => v < price).sort((a, b) => b - a).slice(0, 3);
  const resistances = [sma200Val, bbU, Math.max(...candles.slice(-20).map((c) => c.h))].filter((v) => v > price).sort((a, b) => a - b).slice(0, 3);
  const obv = candles.reduce((acc, c) => acc + (c.c >= c.o ? 1 : -1) * c.v, 0);
  return {
    rsi: +rsiVal.toFixed(1), rsiSignal: rsiVal < 30 ? 'Oversold' : rsiVal > 70 ? 'Overbought' : 'Neutral',
    macd: +macdVal.toFixed(2), macdSignal: +macdSig.toFixed(2), macdHist: +macdHist.toFixed(2), macdTrend,
    sma50: +sma50Val.toFixed(2), sma200: +sma200Val.toFixed(2), aboveSma50: price > sma50Val, aboveSma200: price > sma200Val,
    bbUpper: +bbU.toFixed(2), bbMiddle: +bbM.toFixed(2), bbLower: +bbL.toFixed(2), bbPosition: bbPos,
    adx: +adxVal.toFixed(1), adxTrend: adxVal > 25 ? 'Strong Trend' : adxVal > 20 ? 'Trending' : 'Weak/No Trend',
    atr: +atrVal.toFixed(2), atrPct: +(atrVal / price * 100).toFixed(2),
    stochK: +stochK.toFixed(1), stochD: +stochD.toFixed(1),
    cci: +(((price - sma50Val) / (0.015 * Math.max(0.01, atrVal)))).toFixed(1),
    williamsR: +(((Math.max(...candles.slice(-14).map((c) => c.h)) - price) / (Math.max(...candles.slice(-14).map((c) => c.h)) - Math.min(...candles.slice(-14).map((c) => c.l)))) * -100).toFixed(1),
    mfi: +(50 + (rsiVal - 50) * 0.8).toFixed(1),
    obv, obvTrend: obv > 0 ? 'Accumulation' : 'Distribution',
    vwap: +vwap(candles).toFixed(2),
    supports, resistances, trend, score: +score.toFixed(0), verdict,
  };
}

export interface FundamentalScore { score: number; grade: string; breakdown: { label: string; score: number; max: number }[]; }

export function scoreFundamentals(f: import('./types').Fundamentals | null): FundamentalScore {
  if (!f) return { score: 50, grade: 'C', breakdown: [] };
  const breakdown: { label: string; score: number; max: number }[] = [];
  let total = 0;
  const valScore = f.pe > 0 && f.pe < 15 ? 20 : f.pe < 25 ? 12 : f.pe < 40 ? 6 : 0;
  breakdown.push({ label: 'Valuation (P/E)', score: valScore, max: 20 }); total += valScore;
  const growthScore = f.revenueGrowth > 0.2 ? 20 : f.revenueGrowth > 0.1 ? 14 : f.revenueGrowth > 0 ? 8 : 0;
  breakdown.push({ label: 'Revenue Growth', score: growthScore, max: 20 }); total += growthScore;
  const profitScore = f.netMargin > 0.2 ? 15 : f.netMargin > 0.1 ? 10 : f.netMargin > 0 ? 5 : 0;
  breakdown.push({ label: 'Profitability', score: profitScore, max: 15 }); total += profitScore;
  const healthScore = f.debtToEquity < 0.5 ? 15 : f.debtToEquity < 1 ? 10 : f.debtToEquity < 2 ? 5 : 0;
  breakdown.push({ label: 'Financial Health', score: healthScore, max: 15 }); total += healthScore;
  const effScore = f.roe > 0.2 ? 15 : f.roe > 0.1 ? 10 : f.roe > 0 ? 5 : 0;
  breakdown.push({ label: 'Efficiency (ROE)', score: effScore, max: 15 }); total += effScore;
  const divScore = f.dividendYield > 0.04 ? 10 : f.dividendYield > 0.02 ? 6 : f.dividendYield > 0 ? 3 : 0;
  breakdown.push({ label: 'Dividend', score: divScore, max: 10 }); total += divScore;
  const score = Math.min(100, Math.round(total));
  const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'F';
  return { score, grade, breakdown };
}
