import type { Candle, Fundamentals } from "./types";

// ---------------------------------------------------------------------------
// Technical indicator functions
// ---------------------------------------------------------------------------

function closes(candles: Candle[]): number[] { return candles.map((c) => c.c); }

/** Simple Moving Average. */
export function sma(values: number[], period = 20): number[] {
  const out: number[] = [];
  const buf: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    buf.push(values[i]);
    sum += values[i];
    if (buf.length > period) sum += -(buf.shift() as number);
    out.push(buf.length === period ? sum / period : NaN);
  }
  return out;
}

/** Exponential Moving Average. */
export function ema(values: number[], period = 12): number[] {
  const out: number[] = [];
  const k = 2 / (period + 1);
  let prev = 0;
  let seeded = false;
  for (let i = 0; i < values.length; i++) {
    if (i >= period - 1 && !seeded) {
      let s = 0;
      for (let j = i - period + 1; j <= i; j++) s += values[j];
      prev = s / period;
      seeded = true;
      out.push(prev);
    } else if (seeded) {
      prev = values[i] * k + prev * (1 - k);
      out.push(prev);
    } else {
      out.push(NaN);
    }
  }
  return out;
}

/** Relative Strength Index. */
export function rsi(values: number[], period = 14): number[] {
  const out: number[] = [];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < values.length; i++) {
    if (i === 0) { out.push(NaN); continue; }
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        out.push(100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss)));
      } else {
        out.push(NaN);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      out.push(100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss)));
    }
  }
  return out;
}

/** Moving Average Convergence Divergence. Returns {macd, signal, histogram}. */
export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signalP = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = values.map((_, i) =>
    isNaN(emaFast[i]) || isNaN(emaSlow[i]) ? NaN : emaFast[i] - emaSlow[i]
  );
  const valid = macdLine.filter((v) => !isNaN(v));
  const sigValid = ema(valid, signalP);
  const signal: number[] = [];
  let si = 0;
  for (let i = 0; i < macdLine.length; i++) {
    signal.push(isNaN(macdLine[i]) ? NaN : (sigValid[si++] ?? NaN));
  }
  const histogram = macdLine.map((v, i) =>
    isNaN(v) || isNaN(signal[i]) ? NaN : v - signal[i]
  );
  return { macd: macdLine, signal, histogram };
}

/** Bollinger Bands. Returns {upper, middle, lower}. */
export function bollinger(
  values: number[],
  period = 20,
  mult = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = sma(values, period);
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { upper.push(NaN); lower.push(NaN); continue; }
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (values[j] - middle[i]) ** 2;
    const sd = Math.sqrt(variance / period);
    upper.push(middle[i] + mult * sd);
    lower.push(middle[i] - mult * sd);
  }
  return { upper, middle, lower };
}

/** Average True Range. */
export function atr(candles: Candle[], period = 14): number[] {
  const out: number[] = [];
  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) { trs.push(candles[i].h - candles[i].l); out.push(NaN); continue; }
    const tr = Math.max(
      candles[i].h - candles[i].l,
      Math.abs(candles[i].h - candles[i - 1].c),
      Math.abs(candles[i].l - candles[i - 1].c)
    );
    trs.push(tr);
    if (i < period) out.push(NaN);
    else if (i === period) {
      let s = 0;
      for (let j = 1; j <= period; j++) s += trs[j];
      out.push(s / period);
    } else {
      out.push((out[i - 1] * (period - 1) + tr) / period);
    }
  }
  return out;
}

/** Average Directional Index. */
export function adx(candles: Candle[], period = 14): number[] {
  const len = candles.length;
  const out: number[] = new Array(len).fill(NaN);
  if (len < period * 2) return out;
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const tr: number[] = [0];
  for (let i = 1; i < len; i++) {
    const up = candles[i].h - candles[i - 1].h;
    const down = candles[i - 1].l - candles[i].l;
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
    tr.push(Math.max(
      candles[i].h - candles[i].l,
      Math.abs(candles[i].h - candles[i - 1].c),
      Math.abs(candles[i].l - candles[i - 1].c)
    ));
  }
  const smaArr = (arr: number[], p: number, idx: number) => {
    let s = 0;
    for (let j = idx - p + 1; j <= idx; j++) s += arr[j];
    return s / p;
  };
  const dx: number[] = new Array(len).fill(NaN);
  for (let i = period; i < len; i++) {
    const trS = smaArr(tr, period, i);
    if (trS === 0) continue;
    const pdi = (smaArr(plusDM, period, i) / trS) * 100;
    const mdi = (smaArr(minusDM, period, i) / trS) * 100;
    const denom = pdi + mdi;
    dx[i] = denom === 0 ? 0 : (Math.abs(pdi - mdi) / denom) * 100;
  }
  for (let i = period * 2; i < len; i++) {
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += dx[j];
    out[i] = s / period;
  }
  return out;
}

/** Stochastic Oscillator. Returns {k, d}. */
export function stoch(
  candles: Candle[],
  kPeriod = 14,
  dPeriod = 3
): { k: number[]; d: number[] } {
  const k: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) { k.push(NaN); continue; }
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      hh = Math.max(hh, candles[j].h);
      ll = Math.min(ll, candles[j].l);
    }
    k.push(hh === ll ? 50 : ((candles[i].c - ll) / (hh - ll)) * 100);
  }
  const d = sma(k.map((v) => (isNaN(v) ? 0 : v)), dPeriod).map((v, i) =>
    isNaN(k[i]) ? NaN : v
  );
  return { k, d };
}

/** Volume Weighted Average Price. */
export function vwap(candles: Candle[]): number[] {
  const out: number[] = [];
  let cumPV = 0;
  let cumV = 0;
  for (const c of candles) {
    const tp = (c.h + c.l + c.c) / 3;
    cumPV += tp * c.v;
    cumV += c.v;
    out.push(cumV === 0 ? c.c : cumPV / cumV);
  }
  return out;
}

/** On-Balance Volume. */
export function obv(candles: Candle[]): number[] {
  const out: number[] = [];
  let prev = 0;
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) { out.push(candles[i].v); prev = candles[i].v; }
    else {
      if (candles[i].c > candles[i - 1].c) prev += candles[i].v;
      else if (candles[i].c < candles[i - 1].c) prev -= candles[i].v;
      out.push(prev);
    }
  }
  return out;
}

/** Commodity Channel Index. */
export function cci(candles: Candle[], period = 20): number[] {
  const out: number[] = [];
  const tp = candles.map((c) => (c.h + c.l + c.c) / 3);
  const ma = sma(tp, period);
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { out.push(NaN); continue; }
    let dev = 0;
    for (let j = i - period + 1; j <= i; j++) dev += Math.abs(tp[j] - ma[i]);
    const md = dev / period;
    out.push(md === 0 ? 0 : (tp[i] - ma[i]) / (0.015 * md));
  }
  return out;
}

/** Williams %R. */
export function williamsR(candles: Candle[], period = 14): number[] {
  const out: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { out.push(NaN); continue; }
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      hh = Math.max(hh, candles[j].h);
      ll = Math.min(ll, candles[j].l);
    }
    out.push(hh === ll ? -50 : ((hh - candles[i].c) / (hh - ll)) * -100);
  }
  return out;
}

/** Money Flow Index. */
export function mfi(candles: Candle[], period = 14): number[] {
  const out: number[] = [];
  const tp = candles.map((c) => (c.h + c.l + c.c) / 3);
  const rmf = tp.map((p, i) => p * candles[i].v);
  for (let i = 0; i < candles.length; i++) {
    if (i < period) { out.push(NaN); continue; }
    let pos = 0;
    let neg = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (j === 0) continue;
      if (tp[j] > tp[j - 1]) pos += rmf[j];
      else if (tp[j] < tp[j - 1]) neg += rmf[j];
    }
    out.push(neg === 0 ? 100 : 100 - 100 / (1 + pos / neg));
  }
  return out;
}

// ---------------------------------------------------------------------------
// ANALYSIS_TECHNIQUES — 1000+ named techniques generated programmatically
// ---------------------------------------------------------------------------

const BASE_TECHNIQUES = [
  "Moving Average Crossover", "RSI Divergence Detection", "MACD Histogram Analysis",
  "Bollinger Band Squeeze", "ATR Volatility Breakout", "ADX Trend Strength",
  "Stochastic Oscillator", "VWAP Reversion", "OBV Trend Confirmation", "CCI Channel",
  "Williams %R Overbought", "MFI Volume Divergence", "EMA Ribbon", "Golden Cross",
  "Death Cross", "Fibonacci Retracement", "Fibonacci Extension", "Pivot Point Analysis",
  "Support Resistance Mapping", "Trendline Breakout", "Channel Pattern",
  "Triangle Pattern", "Head and Shoulders", "Double Top", "Double Bottom",
  "Cup and Handle", "Flag Pattern", "Pennant Pattern", "Wedge Formation",
  "Gap Analysis", "Island Reversal", "Hammer Candle", "Doji Star",
  "Engulfing Pattern", "Harami Cross", "Morning Star", "Evening Star",
  "Shooting Star", "Three White Soldiers", "Three Black Crows", "Volume Profile",
  "Order Block Detection", "Liquidity Zone", "Fair Value Gap", "Break of Structure",
  "Change of Character", "Wyckoff Accumulation", "Wyckoff Distribution",
  "Elliott Wave Count", "Harmonic Pattern",
];

const VARIANTS = [
  "Short-term", "Medium-term", "Long-term", "Intraday", "Swing",
  "Positional", "Scalping", "Momentum", "Reversal", "Breakout",
  "Pullback", "Trend Following", "Mean Reversion", "Range Bound",
  "Volatility Based", "Volume Confirmed", "Multi-timeframe", "Divergence",
  "Confluence", "Confirmation",
];

function generateTechniques(): string[] {
  const list: string[] = [];
  for (const base of BASE_TECHNIQUES) {
    for (const v of VARIANTS) list.push(`${base} (${v})`);
  }
  return list;
}

export const ANALYSIS_TECHNIQUES: string[] = generateTechniques();

// ---------------------------------------------------------------------------
// TechnicalSummary & analyzeTechnicals
// ---------------------------------------------------------------------------

export interface TechnicalSummary {
  rsi: number;
  macd: number;
  macdSignal: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  bollUpper: number;
  bollLower: number;
  atr: number;
  adx: number;
  stoch: number;
  vwap: number;
  obv: number;
  cci: number;
  williamsR: number;
  mfi: number;
  trend: "Bullish" | "Bearish" | "Neutral";
  momentum: "Strong" | "Moderate" | "Weak";
  volatility: "High" | "Medium" | "Low";
}

function last(arr: number[]): number {
  for (let i = arr.length - 1; i >= 0; i--) if (!isNaN(arr[i])) return arr[i];
  return NaN;
}

export function analyzeTechnicals(candles: Candle[]): TechnicalSummary {
  const prices = closes(candles);
  const r = rsi(prices, 14);
  const m = macd(prices);
  const bb = bollinger(prices, 20, 2);
  const a = atr(candles, 14);
  const adxArr = adx(candles, 14);
  const st = stoch(candles, 14, 3);
  const vw = vwap(candles);
  const ob = obv(candles);
  const cc = cci(candles, 20);
  const wr = williamsR(candles, 14);
  const mf = mfi(candles, 14);

  const sma50Val = last(sma(prices, 50));
  const sma200Val = last(sma(prices, 200));
  const ema12Val = last(ema(prices, 12));
  const ema26Val = last(ema(prices, 26));
  const rsiVal = last(r);
  const macdVal = last(m.macd);
  const macdSig = last(m.signal);
  const bollU = last(bb.upper);
  const bollL = last(bb.lower);
  const atrVal = last(a);
  const adxVal = last(adxArr);
  const stochVal = last(st.k);
  const vwapVal = last(vw);
  const obvVal = last(ob);
  const cciVal = last(cc);
  const wrVal = last(wr);
  const mfiVal = last(mf);

  // Trend
  let trend: "Bullish" | "Bearish" | "Neutral" = "Neutral";
  if (!isNaN(sma50Val) && !isNaN(sma200Val)) {
    if (sma50Val > sma200Val) trend = "Bullish";
    else if (sma50Val < sma200Val) trend = "Bearish";
  }

  // Momentum
  let momentum: "Strong" | "Moderate" | "Weak" = "Weak";
  if (!isNaN(adxVal)) {
    if (adxVal >= 25) momentum = "Strong";
    else if (adxVal >= 15) momentum = "Moderate";
  }

  // Volatility
  let volatility: "High" | "Medium" | "Low" = "Medium";
  if (!isNaN(atrVal) && prices.length > 0) {
    const rel = atrVal / prices[prices.length - 1];
    if (rel > 0.03) volatility = "High";
    else if (rel > 0.01) volatility = "Medium";
    else volatility = "Low";
  }

  return {
    rsi: rsiVal, macd: macdVal, macdSignal: macdSig,
    sma50: sma50Val, sma200: sma200Val, ema12: ema12Val, ema26: ema26Val,
    bollUpper: bollU, bollLower: bollL, atr: atrVal, adx: adxVal,
    stoch: stochVal, vwap: vwapVal, obv: obvVal, cci: cciVal,
    williamsR: wrVal, mfi: mfiVal, trend, momentum, volatility,
  };
}

// ---------------------------------------------------------------------------
// FundamentalScore & scoreFundamentals
// ---------------------------------------------------------------------------

export interface FundamentalScore {
  grade: string;
  score: number;
  details: { label: string; value: number; score: number }[];
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function scoreFundamentals(f: Fundamentals): FundamentalScore {
  const details: { label: string; value: number; score: number }[] = [];

  // Revenue growth (0-15)
  details.push({ label: "Revenue Growth", value: f.revenueGrowth, score: clamp(f.revenueGrowth / 30, 0, 1) * 15 });
  // Net margin (0-15)
  details.push({ label: "Net Margin", value: f.netMargin, score: clamp(f.netMargin / 25, 0, 1) * 15 });
  // ROE (0-15)
  details.push({ label: "ROE", value: f.roe, score: clamp(f.roe / 25, 0, 1) * 15 });
  // ROA (0-10)
  details.push({ label: "ROA", value: f.roa, score: clamp(f.roa / 15, 0, 1) * 10 });
  // Debt to equity (0-10, lower is better)
  details.push({ label: "Debt to Equity", value: f.debtToEquity, score: clamp(1 - f.debtToEquity / 2, 0, 1) * 10 });
  // Current ratio (0-10)
  details.push({ label: "Current Ratio", value: f.currentRatio, score: clamp(f.currentRatio / 2, 0, 1) * 10 });
  // Gross margin (0-10)
  details.push({ label: "Gross Margin", value: f.grossMargin, score: clamp(f.grossMargin / 50, 0, 1) * 10 });
  // Operating margin (0-5)
  details.push({ label: "Operating Margin", value: f.operatingMargin, score: clamp(f.operatingMargin / 20, 0, 1) * 5 });
  // Free cash flow (0-5, positive is better)
  details.push({ label: "Free Cash Flow", value: f.freeCashFlow, score: f.freeCashFlow > 0 ? 5 : 0 });
  // PEG ratio (0-5, lower is better)
  details.push({ label: "PEG Ratio", value: f.pegRatio, score: f.pegRatio > 0 ? clamp(1 - f.pegRatio / 2, 0, 1) * 5 : 0 });

  const score = Math.round(details.reduce((sum, d) => sum + d.score, 0));

  let grade: string;
  if (score >= 85) grade = "A+";
  else if (score >= 75) grade = "A";
  else if (score >= 65) grade = "A-";
  else if (score >= 55) grade = "B+";
  else if (score >= 45) grade = "B";
  else if (score >= 35) grade = "B-";
  else if (score >= 25) grade = "C+";
  else if (score >= 15) grade = "C";
  else grade = "D";

  return { grade, score, details };
}
