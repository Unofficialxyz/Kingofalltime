import type { Candle, Fundamentals } from "./types";

// ─── MOVING AVERAGES ─────────────────────────────────────────────────────────
export function sma(values: number[], period: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out.push(sum / period);
    else out.push(NaN);
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = [];
  const k = 2 / (period + 1);
  let prev = values[0];
  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      prev = values[0];
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

// ─── RSI ─────────────────────────────────────────────────────────────────────
export function rsi(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  if (values.length <= period) return out;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  out[period] = 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss));
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

// ─── MACD ────────────────────────────────────────────────────────────────────
export interface MacdResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = values.map((_, i) => emaFast[i] - emaSlow[i]);
  const signal = ema(macdLine, signalPeriod);
  const histogram = macdLine.map((m, i) => m - signal[i]);
  return { macd: macdLine, signal, histogram };
}

// ─── BOLLINGER BANDS ─────────────────────────────────────────────────────────
export interface BollingerResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export function bollinger(values: number[], period = 20, mult = 2): BollingerResult {
  const mid = sma(values, period);
  const upper: number[] = new Array(values.length).fill(NaN);
  const lower: number[] = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    let sumSq = 0;
    for (let j = 0; j < period; j++) sumSq += Math.pow(values[i - j] - mid[i], 2);
    const sd = Math.sqrt(sumSq / period);
    upper[i] = mid[i] + mult * sd;
    lower[i] = mid[i] - mult * sd;
  }
  return { upper, middle: mid, lower };
}

// ─── ATR ─────────────────────────────────────────────────────────────────────
export function atr(candles: Candle[], period = 14): number[] {
  const out: number[] = new Array(candles.length).fill(NaN);
  if (candles.length < 2) return out;
  const trs: number[] = [candles[0].h - candles[0].l];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1].c;
    trs.push(Math.max(c.h - c.l, Math.abs(c.h - prevC), Math.abs(c.l - prevC)));
  }
  let sum = 0;
  for (let i = 0; i < Math.min(period, trs.length); i++) sum += trs[i];
  let prev = sum / Math.min(period, trs.length);
  out[Math.min(period, candles.length) - 1] = prev;
  for (let i = period; i < candles.length; i++) {
    prev = (prev * (period - 1) + trs[i]) / period;
    out[i] = prev;
  }
  return out;
}

// ─── ADX ─────────────────────────────────────────────────────────────────────
export function adx(candles: Candle[], period = 14): number[] {
  const out: number[] = new Array(candles.length).fill(NaN);
  if (candles.length < period * 2) return out;
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const trs: number[] = [candles[0].h - candles[0].l];
  for (let i = 1; i < candles.length; i++) {
    const up = candles[i].h - candles[i - 1].h;
    const down = candles[i - 1].l - candles[i].l;
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
    const c = candles[i];
    const prevC = candles[i - 1].c;
    trs.push(Math.max(c.h - c.l, Math.abs(c.h - prevC), Math.abs(c.l - prevC)));
  }
  let trSum = 0;
  let plusSum = 0;
  let minusSum = 0;
  for (let i = 1; i <= period; i++) {
    trSum += trs[i];
    plusSum += plusDM[i];
    minusSum += minusDM[i];
  }
  let prevPlusDI = 100 * (plusSum / trSum);
  let prevMinusDI = 100 * (minusSum / trSum);
  let dx = Math.abs(prevPlusDI - prevMinusDI) / (prevPlusDI + prevMinusDI || 1) * 100;
  let adxVal = dx;
  out[period] = adxVal;
  for (let i = period + 1; i < candles.length; i++) {
    trSum = trSum - trSum / period + trs[i];
    plusSum = plusSum - plusSum / period + plusDM[i];
    minusSum = minusSum - minusSum / period + minusDM[i];
    const plusDI = 100 * (plusSum / trSum);
    const minusDI = 100 * (minusSum / trSum);
    dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI || 1) * 100;
    adxVal = (adxVal * (period - 1) + dx) / period;
    out[i] = adxVal;
    prevPlusDI = plusDI;
    prevMinusDI = minusDI;
  }
  return out;
}

// ─── STOCHASTIC ──────────────────────────────────────────────────────────────
export interface StochResult {
  k: number[];
  d: number[];
}

export function stoch(candles: Candle[], kPeriod = 14, dPeriod = 3): StochResult {
  const k: number[] = new Array(candles.length).fill(NaN);
  for (let i = kPeriod - 1; i < candles.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      hh = Math.max(hh, candles[i - j].h);
      ll = Math.min(ll, candles[i - j].l);
    }
    k[i] = hh === ll ? 50 : ((candles[i].c - ll) / (hh - ll)) * 100;
  }
  const d = sma(k.map((v) => (isNaN(v) ? 0 : v)), dPeriod);
  return { k, d };
}

// ─── VWAP ────────────────────────────────────────────────────────────────────
export function vwap(candles: Candle[]): number[] {
  const out: number[] = [];
  let cumPV = 0;
  let cumV = 0;
  for (let i = 0; i < candles.length; i++) {
    const tp = (candles[i].h + candles[i].l + candles[i].c) / 3;
    cumPV += tp * candles[i].v;
    cumV += candles[i].v;
    out.push(cumV === 0 ? tp : cumPV / cumV);
  }
  return out;
}

// ─── OBV ─────────────────────────────────────────────────────────────────────
export function obv(candles: Candle[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].c > candles[i - 1].c) out.push(out[i - 1] + candles[i].v);
    else if (candles[i].c < candles[i - 1].c) out.push(out[i - 1] - candles[i].v);
    else out.push(out[i - 1]);
  }
  return out;
}

// ─── CCI ─────────────────────────────────────────────────────────────────────
export function cci(candles: Candle[], period = 20): number[] {
  const out: number[] = new Array(candles.length).fill(NaN);
  const tp = candles.map((c) => (c.h + c.l + c.c) / 3);
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += tp[i - j];
    const avg = sum / period;
    let dev = 0;
    for (let j = 0; j < period; j++) dev += Math.abs(tp[i - j] - avg);
    const md = dev / period;
    out[i] = md === 0 ? 0 : (tp[i] - avg) / (0.015 * md);
  }
  return out;
}

// ─── WILLIAMS %R ─────────────────────────────────────────────────────────────
export function williamsR(candles: Candle[], period = 14): number[] {
  const out: number[] = new Array(candles.length).fill(NaN);
  for (let i = period - 1; i < candles.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = 0; j < period; j++) {
      hh = Math.max(hh, candles[i - j].h);
      ll = Math.min(ll, candles[i - j].l);
    }
    out[i] = hh === ll ? -50 : ((hh - candles[i].c) / (hh - ll)) * -100;
  }
  return out;
}

// ─── MFI ──────────────────────────────────────────────────────────────────────
export function mfi(candles: Candle[], period = 14): number[] {
  const out: number[] = new Array(candles.length).fill(NaN);
  const tp = candles.map((c) => (c.h + c.l + c.c) / 3);
  const rmf = tp.map((p, i) => p * candles[i].v);
  for (let i = period; i < candles.length; i++) {
    let posFlow = 0;
    let negFlow = 0;
    for (let j = 0; j < period; j++) {
      const idx = i - j;
      if (tp[idx] > tp[idx - 1]) posFlow += rmf[idx];
      else negFlow += rmf[idx];
    }
    const mfr = negFlow === 0 ? 100 : 100 - 100 / (1 + posFlow / negFlow);
    out[i] = mfr;
  }
  return out;
}

// ─── TECHNICAL SUMMARY ───────────────────────────────────────────────────────
export interface TechnicalSummary {
  rsi: number;
  rsiSignal: string;
  macd: number;
  macdSignal: number;
  macdHist: number;
  macdTrend: string;
  sma50: number;
  sma200: number;
  aboveSma50: boolean;
  aboveSma200: boolean;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbPosition: number;
  adx: number;
  adxTrend: string;
  atr: number;
  atrPct: number;
  stochK: number;
  stochD: number;
  cci: number;
  williamsR: number;
  mfi: number;
  obv: number;
  obvTrend: string;
  vwap: number;
  supports: number[];
  resistances: number[];
  trend: string;
  score: number;
  verdict: string;
}

export function analyzeTechnicals(candles: Candle[]): TechnicalSummary | null {
  if (candles.length < 30) return null;
  const closes = candles.map((c) => c.c);
  const last = closes.length - 1;
  const price = closes[last];

  const rsiArr = rsi(closes, 14);
  const rsiVal = rsiArr[last] || 50;
  const rsiSignal = rsiVal > 70 ? "Overbought" : rsiVal < 30 ? "Oversold" : rsiVal > 50 ? "Bullish" : "Bearish";

  const macdRes = macd(closes);
  const macdVal = macdRes.macd[last];
  const macdSig = macdRes.signal[last];
  const macdHist = macdRes.histogram[last];
  const macdTrend = macdHist > 0 && macdHist > macdRes.histogram[last - 1] ? "Bullish" : macdHist < 0 && macdHist < macdRes.histogram[last - 1] ? "Bearish" : "Neutral";

  const sma50Arr = sma(closes, 50);
  const sma200Arr = sma(closes, 200);
  const sma50 = sma50Arr[last] || price;
  const sma200 = sma200Arr[last] || price;

  const bb = bollinger(closes, 20, 2);
  const bbUpper = bb.upper[last] || price;
  const bbMiddle = bb.middle[last] || price;
  const bbLower = bb.lower[last] || price;
  const bbRange = bbUpper - bbLower || 1;
  const bbPosition = ((price - bbLower) / bbRange) * 100;

  const adxArr = adx(candles, 14);
  const adxVal = adxArr[last] || 0;
  const adxTrend = adxVal > 25 ? (price > sma50 ? "Strong Uptrend" : "Strong Downtrend") : "Weak/Range-bound";

  const atrArr = atr(candles, 14);
  const atrVal = atrArr[last] || 0;
  const atrPct = (atrVal / price) * 100;

  const stochRes = stoch(candles, 14, 3);
  const stochK = stochRes.k[last] || 50;
  const stochD = stochRes.d[last] || 50;

  const cciArr = cci(candles, 20);
  const cciVal = cciArr[last] || 0;

  const wrArr = williamsR(candles, 14);
  const wrVal = wrArr[last] || -50;

  const mfiArr = mfi(candles, 14);
  const mfiVal = mfiArr[last] || 50;

  const obvArr = obv(candles);
  const obvVal = obvArr[last];
  const obvTrend = obvArr[last] > obvArr[Math.max(0, last - 5)] ? "Rising" : "Falling";

  const vwapArr = vwap(candles);
  const vwapVal = vwapArr[last];

  // Support / resistance from recent swing points
  const lookback = Math.min(50, candles.length);
  const recent = candles.slice(candles.length - lookback);
  const highs = recent.map((c) => c.h).sort((a, b) => b - a);
  const lows = recent.map((c) => c.l).sort((a, b) => a - b);
  const resistances = [highs[0], highs[Math.floor(highs.length * 0.23)]].map((v) => Math.round(v * 100) / 100);
  const supports = [lows[0], lows[Math.floor(lows.length * 0.23)]].map((v) => Math.round(v * 100) / 100);

  // Score: -100 to 100
  let score = 0;
  score += (rsiVal - 50) * 0.4;
  score += macdHist * 2;
  score += price > sma50 ? 10 : -10;
  score += price > sma200 ? 10 : -10;
  score += bbPosition > 80 ? -10 : bbPosition < 20 ? 10 : 0;
  score += adxVal > 25 ? (price > sma50 ? 10 : -10) : 0;
  score += obvTrend === "Rising" ? 5 : -5;
  score += (stochK - 50) * 0.2;
  score = Math.max(-100, Math.min(100, Math.round(score)));

  const trend = score > 30 ? "Bullish" : score < -30 ? "Bearish" : "Neutral";
  const verdict = score > 50 ? "Strong Buy" : score > 20 ? "Buy" : score < -50 ? "Strong Sell" : score < -20 ? "Sell" : "Hold";

  return {
    rsi: Math.round(rsiVal * 100) / 100,
    rsiSignal,
    macd: Math.round(macdVal * 1000) / 1000,
    macdSignal: Math.round(macdSig * 1000) / 1000,
    macdHist: Math.round(macdHist * 1000) / 1000,
    macdTrend,
    sma50: Math.round(sma50 * 100) / 100,
    sma200: Math.round(sma200 * 100) / 100,
    aboveSma50: price > sma50,
    aboveSma200: price > sma200,
    bbUpper: Math.round(bbUpper * 100) / 100,
    bbMiddle: Math.round(bbMiddle * 100) / 100,
    bbLower: Math.round(bbLower * 100) / 100,
    bbPosition: Math.round(bbPosition * 100) / 100,
    adx: Math.round(adxVal * 100) / 100,
    adxTrend,
    atr: Math.round(atrVal * 100) / 100,
    atrPct: Math.round(atrPct * 100) / 100,
    stochK: Math.round(stochK * 100) / 100,
    stochD: Math.round(stochD * 100) / 100,
    cci: Math.round(cciVal * 100) / 100,
    williamsR: Math.round(wrVal * 100) / 100,
    mfi: Math.round(mfiVal * 100) / 100,
    obv: obvVal,
    obvTrend,
    vwap: Math.round(vwapVal * 100) / 100,
    supports,
    resistances,
    trend,
    score,
    verdict,
  };
}

// ─── FUNDAMENTAL SCORE ───────────────────────────────────────────────────────
export interface FundamentalScore {
  score: number;
  grade: string;
  valuation: number;
  profitability: number;
  growth: number;
  financialHealth: number;
  cashFlow: number;
  notes: string[];
}

export function scoreFundamentals(fund: Fundamentals): FundamentalScore {
  const notes: string[] = [];

  // Valuation (0-100, higher = cheaper)
  let valuation = 50;
  if (fund.pe > 0 && fund.pe < 15) { valuation += 25; notes.push("Attractive P/E ratio"); }
  else if (fund.pe > 35) { valuation -= 20; notes.push("High P/E ratio"); }
  if (fund.peg > 0 && fund.peg < 1) { valuation += 15; notes.push("Favorable PEG ratio"); }
  else if (fund.peg > 2) { valuation -= 10; notes.push("Elevated PEG ratio"); }
  if (fund.pb < 1.5) valuation += 10;
  else if (fund.pb > 5) valuation -= 10;
  valuation = Math.max(0, Math.min(100, valuation));

  // Profitability (0-100)
  let profitability = 50;
  if (fund.roe > 15) { profitability += 20; notes.push("Strong return on equity"); }
  else if (fund.roe < 5) profitability -= 15;
  if (fund.netMargin > 0.15) { profitability += 15; notes.push("Healthy net margins"); }
  else if (fund.netMargin < 0.05) profitability -= 10;
  if (fund.roa > 5) profitability += 10;
  profitability = Math.max(0, Math.min(100, profitability));

  // Growth (0-100)
  let growth = 50;
  if (fund.revenueGrowth > 15) { growth += 25; notes.push("Robust revenue growth"); }
  else if (fund.revenueGrowth < 0) { growth -= 20; notes.push("Declining revenue"); }
  if (fund.earningsGrowth > 20) { growth += 20; notes.push("Strong earnings growth"); }
  else if (fund.earningsGrowth < 0) growth -= 15;
  growth = Math.max(0, Math.min(100, growth));

  // Financial health (0-100)
  let financialHealth = 50;
  if (fund.debtToEquity < 0.5) { financialHealth += 20; notes.push("Low leverage"); }
  else if (fund.debtToEquity > 2) { financialHealth -= 25; notes.push("High debt levels"); }
  if (fund.currentRatio > 2) financialHealth += 15;
  else if (fund.currentRatio < 1) financialHealth -= 20;
  financialHealth = Math.max(0, Math.min(100, financialHealth));

  // Cash flow (0-100)
  let cashFlow = 50;
  if (fund.fcfYield > 5) { cashFlow += 20; notes.push("Strong free cash flow yield"); }
  else if (fund.fcfYield < 0) { cashFlow -= 20; notes.push("Negative free cash flow"); }
  if (fund.payoutRatio < 0.6 && fund.dividendYield > 0) cashFlow += 10;
  cashFlow = Math.max(0, Math.min(100, cashFlow));

  const score = Math.round((valuation + profitability + growth + financialHealth + cashFlow) / 5);
  const grade = score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";

  return { score, grade, valuation, profitability, growth, financialHealth, cashFlow, notes };
}
