import type { Candle } from './types';

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(null); continue; }
    if (prev === null) {
      const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      prev = seed; out.push(seed); continue;
    }
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [];
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < values.length; i++) {
    if (i === 0) { out.push(null); continue; }
    const change = values[i] - values[i - 1];
    const gain = Math.max(0, change);
    const loss = Math.max(0, -change);
    if (i <= period) {
      avgGain += gain; avgLoss += loss;
      if (i === period) {
        avgGain /= period; avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        out.push(100 - 100 / (1 + rs));
      } else {
        out.push(null);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      out.push(100 - 100 / (1 + rs));
    }
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = values.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null
      ? (emaFast[i] as number) - (emaSlow[i] as number)
      : null,
  );
  const valid = macdLine.map((v) => (v === null ? 0 : v));
  const signalLine = ema(valid, signal).map((v, i) => (macdLine[i] === null ? null : v));
  const histogram = macdLine.map((v, i) =>
    v !== null && signalLine[i] !== null ? v - (signalLine[i] as number) : null,
  );
  return { macdLine, signalLine, histogram };
}

export function bollingerBands(values: number[], period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { upper.push(null); lower.push(null); continue; }
    const slice = values.slice(i - period + 1, i + 1);
    const m = mid[i] as number;
    const variance = slice.reduce((a, b) => a + (b - m) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper.push(m + mult * sd);
    lower.push(m - mult * sd);
  }
  return { upper, mid, lower };
}

export function atr(candles: Candle[], period = 14): (number | null)[] {
  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) { trs.push(candles[i].h - candles[i].l); continue; }
    const c = candles[i];
    const prevClose = candles[i - 1].c;
    trs.push(Math.max(c.h - c.l, Math.abs(c.h - prevClose), Math.abs(c.l - prevClose)));
  }
  return ema(trs, period);
}

export function stochastic(candles: Candle[], period = 14) {
  const k: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { k.push(null); continue; }
    const slice = candles.slice(i - period + 1, i + 1);
    const hh = Math.max(...slice.map((c) => c.h));
    const ll = Math.min(...slice.map((c) => c.l));
    const denom = hh - ll || 1;
    k.push(((candles[i].c - ll) / denom) * 100);
  }
  const validK = k.map((v) => (v === null ? 0 : v));
  const d = sma(validK, 3).map((v, i) => (k[i] === null ? null : v));
  return { k, d };
}

export function adx(candles: Candle[], period = 14): (number | null)[] {
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const up = candles[i].h - candles[i - 1].h;
    const down = candles[i - 1].l - candles[i].l;
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
    tr.push(Math.max(
      candles[i].h - candles[i].l,
      Math.abs(candles[i].h - candles[i - 1].c),
      Math.abs(candles[i].l - candles[i - 1].c),
    ));
  }
  const atrArr = ema(tr, period);
  const plusDi = ema(plusDM, period).map((v, i) => (v && atrArr[i] ? (v / atrArr[i]!) * 100 : null));
  const minusDi = ema(minusDM, period).map((v, i) => (v && atrArr[i] ? (v / atrArr[i]!) * 100 : null));
  const dx = plusDi.map((p, i) => {
    const m = minusDi[i];
    if (p === null || m === null) return null;
    const sum = p + m || 1;
    return Math.abs(p - m) / sum * 100;
  });
  const validDx = dx.map((v) => (v === null ? 0 : v));
  return ema(validDx, period).map((v, i) => (dx[i] === null ? null : v));
}

export function vwap(candles: Candle[]): (number | null)[] {
  const out: (number | null)[] = [];
  let cumPV = 0, cumV = 0;
  for (const c of candles) {
    const typical = (c.h + c.l + c.c) / 3;
    cumPV += typical * c.v;
    cumV += c.v;
    out.push(cumV ? cumPV / cumV : null);
  }
  return out;
}

export function obv(candles: Candle[]): number[] {
  const out: number[] = [];
  let prev = 0;
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) { out.push(0); prev = 0; continue; }
    const dir = candles[i].c > candles[i - 1].c ? 1 : candles[i].c < candles[i - 1].c ? -1 : 0;
    prev = prev + dir * candles[i].v;
    out.push(prev);
  }
  return out;
}

export function supportsResistances(candles: Candle[]): { level: number; type: 'support' | 'resistance'; strength: number }[] {
  const levels: { level: number; type: 'support' | 'resistance'; strength: number }[] = [];
  const window = 5;
  for (let i = window; i < candles.length - window; i++) {
    const slice = candles.slice(i - window, i + window + 1);
    const highs = slice.map((c) => c.h);
    const lows = slice.map((c) => c.l);
    if (candles[i].h === Math.max(...highs)) {
      levels.push({ level: candles[i].h, type: 'resistance', strength: window });
    }
    if (candles[i].l === Math.min(...lows)) {
      levels.push({ level: candles[i].l, type: 'support', strength: window });
    }
  }
  // Cluster nearby levels.
  const sorted = [...levels].sort((a, b) => a.level - b.level);
  const clustered: typeof levels = [];
  for (const l of sorted) {
    const last = clustered[clustered.length - 1];
    if (last && Math.abs(l.level - last.level) / l.level < 0.01) {
      last.strength += l.strength;
    } else {
      clustered.push({ ...l });
    }
  }
  return clustered.slice(-6);
}

export interface TechnicalSummary {
  rsi: number;
  rsiSignal: 'Oversold' | 'Overbought' | 'Neutral';
  macd: number;
  macdSignal: number;
  macdHist: number;
  macdTrend: 'Bullish' | 'Bearish' | 'Neutral';
  sma20: number;
  sma50: number;
  sma200: number;
  trend: 'Strong Uptrend' | 'Uptrend' | 'Downtrend' | 'Strong Downtrend' | 'Sideways';
  aboveSma20: boolean;
  aboveSma50: boolean;
  aboveSma200: boolean;
  bbUpper: number;
  bbLower: number;
  bbMid: number;
  bbPosition: 'Upper' | 'Lower' | 'Middle';
  atr: number;
  adx: number;
  adxTrend: 'Trending' | 'Weak/Range-bound';
  stochK: number;
  stochD: number;
  vwap: number;
  supports: number[];
  resistances: number[];
  score: number; // -100..100
  verdict: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
}

export function analyzeTechnicals(candles: Candle[]): TechnicalSummary {
  const closes = candles.map((c) => c.c);
  const rsiArr = rsi(closes, 14);
  const macdRes = macd(closes);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const bb = bollingerBands(closes, 20, 2);
  const atrArr = atr(candles);
  const adxArr = adx(candles);
  const stoch = stochastic(candles);
  const vwapArr = vwap(candles);
  const sr = supportsResistances(candles);

  const last = closes.length - 1;
  const price = closes[last];
  const rsiVal = (rsiArr[last] ?? 50) as number;
  const macdVal = (macdRes.macdLine[last] ?? 0) as number;
  const macdSig = (macdRes.signalLine[last] ?? 0) as number;
  const macdHist = (macdRes.histogram[last] ?? 0) as number;
  const s20 = (sma20[last] ?? price) as number;
  const s50 = (sma50[last] ?? price) as number;
  const s200 = (sma200[last] ?? price) as number;
  const bbU = (bb.upper[last] ?? price) as number;
  const bbL = (bb.lower[last] ?? price) as number;
  const bbM = (bb.mid[last] ?? price) as number;
  const atrVal = (atrArr[last] ?? 0) as number;
  const adxVal = (adxArr[last] ?? 0) as number;
  const stochK = (stoch.k[last] ?? 50) as number;
  const stochD = (stoch.d[last] ?? 50) as number;
  const vwapVal = (vwapArr[last] ?? price) as number;

  let score = 0;
  score += rsiVal < 30 ? 25 : rsiVal < 45 ? 10 : rsiVal > 70 ? -25 : rsiVal > 55 ? -10 : 0;
  score += macdVal > macdSig ? 15 : -15;
  score += macdHist > 0 ? 8 : -8;
  score += price > s20 ? 8 : -8;
  score += price > s50 ? 12 : -12;
  score += price > s200 ? 18 : -18;
  score += s20 > s50 ? 6 : -6;
  score += s50 > s200 ? 10 : -10;
  score += stochK < 20 ? 10 : stochK > 80 ? -10 : 0;
  score += price > vwapVal ? 6 : -6;
  score = Math.max(-100, Math.min(100, score));

  const verdict: TechnicalSummary['verdict'] =
    score >= 50 ? 'Strong Buy' : score >= 15 ? 'Buy' : score <= -50 ? 'Strong Sell' : score <= -15 ? 'Sell' : 'Neutral';

  let trend: TechnicalSummary['trend'] = 'Sideways';
  if (price > s200 && price > s50 && s50 > s200) trend = 'Strong Uptrend';
  else if (price > s50 && price > s20) trend = 'Uptrend';
  else if (price < s200 && price < s50 && s50 < s200) trend = 'Strong Downtrend';
  else if (price < s50 && price < s20) trend = 'Downtrend';

  return {
    rsi: +rsiVal.toFixed(2),
    rsiSignal: rsiVal < 30 ? 'Oversold' : rsiVal > 70 ? 'Overbought' : 'Neutral',
    macd: +macdVal.toFixed(4),
    macdSignal: +macdSig.toFixed(4),
    macdHist: +macdHist.toFixed(4),
    macdTrend: macdVal > macdSig ? 'Bullish' : macdVal < macdSig ? 'Bearish' : 'Neutral',
    sma20: +s20.toFixed(2),
    sma50: +s50.toFixed(2),
    sma200: +s200.toFixed(2),
    trend,
    aboveSma20: price > s20,
    aboveSma50: price > s50,
    aboveSma200: price > s200,
    bbUpper: +bbU.toFixed(2),
    bbLower: +bbL.toFixed(2),
    bbMid: +bbM.toFixed(2),
    bbPosition: price > (bbU + bbM) / 2 ? 'Upper' : price < (bbL + bbM) / 2 ? 'Lower' : 'Middle',
    atr: +atrVal.toFixed(2),
    adx: +adxVal.toFixed(2),
    adxTrend: adxVal > 25 ? 'Trending' : 'Weak/Range-bound',
    stochK: +stochK.toFixed(2),
    stochD: +stochD.toFixed(2),
    vwap: +vwapVal.toFixed(2),
    supports: sr.filter((l) => l.type === 'support').map((l) => +l.level.toFixed(2)).slice(-3),
    resistances: sr.filter((l) => l.type === 'resistance').map((l) => +l.level.toFixed(2)).slice(-3),
    score: +score.toFixed(0),
    verdict,
  };
}
