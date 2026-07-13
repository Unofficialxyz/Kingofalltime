import type { StockMeta, Quote, Candle, Fundamentals, IncomeStatement, BalanceSheet, CashFlow, Timeframe } from './types';
import { STOCK_UNIVERSE } from './universe';

function hash(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return h >>> 0;
}

function rng(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const metaMap = new Map(STOCK_UNIVERSE.map((s) => [s.symbol, s]));

export function getMeta(symbol: string): StockMeta | undefined {
  return metaMap.get(symbol);
}

export function getQuote(symbol: string): Quote {
  const r = rng(symbol + '|q');
  const meta = metaMap.get(symbol);
  const basePrice = 10 + r() * 990;
  const changePct = (r() - 0.48) * 8;
  const price = basePrice * (1 + changePct / 100);
  const prevClose = basePrice;
  const sharesOut = 1e6 + r() * 1e10;
  const marketCap = price * sharesOut;
  return {
    symbol, price, change: price - prevClose, changePct, prevClose,
    open: prevClose * (1 + (r() - 0.5) * 0.02),
    dayHigh: price * (1 + r() * 0.03), dayLow: price * (1 - r() * 0.03),
    yearHigh: basePrice * (1 + r() * 0.5), yearLow: basePrice * (1 - r() * 0.4),
    volume: Math.floor(1e4 + r() * 5e8), avgVolume: Math.floor(1e4 + r() * 5e8),
    marketCap, pe: 5 + r() * 60, eps: price / (5 + r() * 60),
    beta: 0.3 + r() * 2.5, dividendYield: r() * 0.08,
    asOf: new Date().toISOString(),
  };
}

const quoteCache = new Map<string, Quote>();
export function getLiveQuote(symbol: string): Quote | null {
  if (!metaMap.has(symbol)) return null;
  if (!quoteCache.has(symbol)) quoteCache.set(symbol, getQuote(symbol));
  return quoteCache.get(symbol)!;
}

const candleCache = new Map<string, Candle[]>();
export function getCandles(symbol: string, _tf: Timeframe = '1Y'): Candle[] {
  const key = symbol + '|' + _tf;
  if (candleCache.has(key)) return candleCache.get(key)!;
  const r = rng(symbol + '|c');
  const meta = metaMap.get(symbol);
  const base = 10 + r() * 990;
  const count = _tf === '1D' ? 78 : _tf === '1W' ? 5 : _tf === '1M' ? 22 : _tf === '3M' ? 66 : _tf === '6M' ? 132 : _tf === '1Y' ? 252 : _tf === '5Y' ? 1260 : 2520;
  const drift = (r() - 0.45) * 0.001;
  const vol = 0.01 + r() * 0.04;
  const candles: Candle[] = [];
  let price = base * 0.8;
  const now = Date.now();
  const interval = (_tf === '1D' ? 390 : _tf === '1W' ? 1 : 1) * 86400000 / (_tf === '1D' ? 78 : count);
  for (let i = 0; i < count; i++) {
    const o = price;
    const change = (r() - 0.5) * vol * price + drift * price;
    const c = Math.max(0.1, o + change);
    const h = Math.max(o, c) * (1 + r() * 0.01);
    const l = Math.min(o, c) * (1 - r() * 0.01);
    candles.push({ t: now - (count - i) * interval, o, h, l, c, v: Math.floor(1e4 + r() * 5e8) });
    price = c;
  }
  candleCache.set(key, candles);
  return candles;
}

const fundCache = new Map<string, Fundamentals | null>();
export function getFundamentals(symbol: string): Fundamentals | null {
  if (fundCache.has(symbol)) return fundCache.get(symbol)!;
  if (!metaMap.has(symbol)) { fundCache.set(symbol, null); return null; }
  const r = rng(symbol + '|f');
  const q = getLiveQuote(symbol)!;
  const f: Fundamentals = {
    symbol, pe: q.pe, forwardPe: q.pe * (0.8 + r() * 0.3),
    peg: q.pe / Math.max(1, 5 + r() * 25),
    ps: 0.5 + r() * 20, pb: 0.3 + r() * 15, evEbitda: 3 + r() * 25,
    roe: r() * 0.45, roa: r() * 0.2, roic: r() * 0.25,
    grossMargin: 0.1 + r() * 0.6, operatingMargin: r() * 0.3, netMargin: r() * 0.25,
    debtToEquity: r() * 3, currentRatio: 0.5 + r() * 4, quickRatio: 0.3 + r() * 3,
    revenueGrowth: (r() - 0.3) * 0.5, earningsGrowth: (r() - 0.3) * 0.6,
    fcfYield: r() * 0.1, payoutRatio: r() * 0.8,
    marketCap: q.marketCap, enterpriseValue: q.marketCap * (1 + r()), sharesOut: q.marketCap / q.price,
    dividendYield: q.dividendYield, beta: q.beta,
  };
  fundCache.set(symbol, f);
  return f;
}

export function getIncomeStatements(symbol: string): IncomeStatement[] {
  const r = rng(symbol + '|inc');
  const f = getFundamentals(symbol);
  if (!f) return [];
  const out: IncomeStatement[] = [];
  let rev = f.marketCap / (f.ps || 5);
  for (let i = 0; i < 5; i++) {
    const growth = 1 + (f.revenueGrowth || 0.1) * (1 - i * 0.1);
    rev /= growth;
    out.push({
      period: `FY${-i}`, revenue: rev,
      grossProfit: rev * f.grossMargin, operatingIncome: rev * f.operatingMargin,
      netIncome: rev * f.netMargin, ebitda: rev * (f.operatingMargin + 0.1),
      eps: (rev * f.netMargin) / f.sharesOut,
    });
  }
  return out.reverse();
}

export function getBalanceSheets(symbol: string): BalanceSheet[] {
  const r = rng(symbol + '|bs');
  const f = getFundamentals(symbol);
  if (!f) return [];
  const out: BalanceSheet[] = [];
  for (let i = 0; i < 5; i++) {
    const assets = f.marketCap / (f.pb || 2) * (1 - i * 0.05);
    const debt = assets * 0.3 * f.debtToEquity / 2;
    out.push({
      period: `FY${-i}`, totalAssets: assets, totalLiabilities: assets * 0.5,
      equity: assets * 0.5, cash: assets * (0.1 + r() * 0.2),
      debt, inventory: assets * 0.1, receivables: assets * 0.15,
    });
  }
  return out;
}

export function getCashFlows(symbol: string): CashFlow[] {
  const r = rng(symbol + '|cf');
  const f = getFundamentals(symbol);
  if (!f) return [];
  const out: CashFlow[] = [];
  let rev = f.marketCap / (f.ps || 5);
  for (let i = 0; i < 5; i++) {
    const ocf = rev * f.operatingMargin * 1.2;
    const capex = rev * 0.05;
    out.push({
      period: `FY${-i}`, operatingCf: ocf, capex,
      freeCf: ocf - capex, dividends: ocf * f.payoutRatio,
      netDebtIssuance: (r() - 0.5) * rev * 0.1,
    });
    rev /= 1 + (f.revenueGrowth || 0.1);
  }
  return out.reverse();
}
