import type { Quote, Candle, Fundamentals, IncomeStatement, BalanceSheet, CashFlow, StockMeta } from "./types";
import { getMeta, REAL_STOCKS, getMetaByIndex } from "./universe";

function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rng(symbol: string) { return mulberry32(fnv1a(symbol)); }

function basePrice(symbol: string): number {
  const r = rng(symbol);
  const meta = getMeta(symbol);
  if (meta) {
    if (meta.region === "India") return 50 + r() * 4000;
    if (meta.region === "USA") return 10 + r() * 500;
  }
  return 1 + r() * 1000;
}

const quoteCache = new Map<string, Quote>();
const candleCache = new Map<string, Candle[]>();
const fundCache = new Map<string, Fundamentals>();

export function getQuote(symbol: string): Quote {
  if (quoteCache.has(symbol)) return quoteCache.get(symbol)!;
  const r = rng(symbol);
  const price = basePrice(symbol);
  const change = (r() - 0.48) * price * 0.05;
  const changePct = (change / price) * 100;
  const volume = Math.floor(r() * 10000000) + 100000;
  const marketCap = price * (Math.floor(r() * 100000000) + 1000000);
  const high52 = price * (1 + r() * 0.5);
  const low52 = price * (1 - r() * 0.4);
  const open = price * (1 + (r() - 0.5) * 0.02);
  const prevClose = price - change;
  const dayHigh = Math.max(price, open) * (1 + r() * 0.01);
  const dayLow = Math.min(price, open) * (1 - r() * 0.01);
  const pe = 5 + r() * 50;
  const pb = 0.5 + r() * 10;
  const divYield = r() * 5;
  const beta = 0.3 + r() * 1.7;
  const q: Quote = { symbol, price, change, changePct, volume, marketCap, high52, low52, open, prevClose, dayHigh, dayLow, pe, pb, divYield, beta };
  quoteCache.set(symbol, q);
  return q;
}

let liveInterval: ReturnType<typeof setInterval> | null = null;
const liveQuotes = new Map<string, Quote>();

export function startLiveUpdates() {
  if (liveInterval) return;
  liveInterval = setInterval(() => {
    for (const [sym, q] of liveQuotes) {
      const drift = (Math.random() - 0.5) * q.price * 0.003;
      const newPrice = Math.max(0.01, q.price + drift);
      const newChange = newPrice - q.prevClose;
      liveQuotes.set(sym, { ...q, price: newPrice, change: newChange, changePct: (newChange / q.prevClose) * 100, dayHigh: Math.max(q.dayHigh, newPrice), dayLow: Math.min(q.dayLow, newPrice) });
    }
  }, 2000);
}

export function getLiveQuote(symbol: string): Quote {
  if (!liveQuotes.has(symbol)) { const base = getQuote(symbol); liveQuotes.set(symbol, { ...base }); }
  return liveQuotes.get(symbol)!;
}

export function getCandles(symbol: string, timeframe: string = "3M"): Candle[] {
  const key = `${symbol}-${timeframe}`;
  if (candleCache.has(key)) return candleCache.get(key)!;
  const r = rng(symbol + timeframe);
  const tfMap: Record<string, number> = { "1D": 24, "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365, "5Y": 1825 };
  const count = tfMap[timeframe] ?? 90;
  const base = basePrice(symbol);
  const candles: Candle[] = [];
  let price = base * (0.7 + r() * 0.3);
  const now = Date.now();
  const interval = (5 * 365 * 24 * 60 * 60 * 1000) / count;
  for (let i = 0; i < count; i++) {
    const o = price;
    const change = (r() - 0.48) * price * 0.03;
    const c = Math.max(0.01, o + change);
    const h = Math.max(o, c) * (1 + r() * 0.01);
    const l = Math.min(o, c) * (1 - r() * 0.01);
    const v = Math.floor(r() * 5000000) + 100000;
    candles.push({ t: now - (count - i) * interval, o, h, l, c, v });
    price = c;
  }
  candleCache.set(key, candles);
  return candles;
}

export function getFundamentals(symbol: string): Fundamentals {
  if (fundCache.has(symbol)) return fundCache.get(symbol)!;
  const r = rng(symbol + "fund");
  const revenue = Math.floor(r() * 100000000000) + 1000000000;
  const netIncome = revenue * (0.05 + r() * 0.25);
  const f: Fundamentals = {
    revenue, revenueGrowth: (r() - 0.3) * 40, netIncome, netMargin: (netIncome / revenue) * 100,
    debtToEquity: r() * 3, roe: 5 + r() * 35, roa: 2 + r() * 15,
    currentRatio: 0.8 + r() * 3, quickRatio: 0.5 + r() * 2.5,
    grossMargin: 15 + r() * 60, operatingMargin: 5 + r() * 30,
    eps: 1 + r() * 50, bookValue: 10 + r() * 500,
    freeCashFlow: netIncome * (0.5 + r() * 1.5), payoutRatio: r() * 80, pegRatio: 0.5 + r() * 4,
  };
  fundCache.set(symbol, f);
  return f;
}

export function getIncomeStatements(symbol: string): IncomeStatement[] {
  const r = rng(symbol + "income");
  const baseRev = getFundamentals(symbol).revenue;
  const out: IncomeStatement[] = [];
  for (let i = 4; i >= 0; i--) {
    const growth = 0.05 + r() * 0.2;
    const rev = baseRev / Math.pow(1 + growth, i);
    const cost = rev * (0.4 + r() * 0.3);
    const gross = rev - cost;
    const op = gross * (0.6 + r() * 0.2);
    const net = op * (0.7 + r() * 0.15);
    out.push({ year: 2024 - i, revenue: rev, costOfRevenue: cost, grossProfit: gross, operatingIncome: op, netIncome: net, eps: net / 10000000 });
  }
  return out;
}

export function getBalanceSheets(symbol: string): BalanceSheet[] {
  const r = rng(symbol + "balance");
  const baseAssets = getFundamentals(symbol).revenue * 2;
  const out: BalanceSheet[] = [];
  for (let i = 4; i >= 0; i--) {
    const assets = baseAssets / Math.pow(1.08, i);
    const liab = assets * (0.3 + r() * 0.4);
    out.push({ year: 2024 - i, totalAssets: assets, totalLiabilities: liab, equity: assets - liab, totalDebt: liab * 0.5, cash: assets * r() * 0.3 });
  }
  return out;
}

export function getCashFlows(symbol: string): CashFlow[] {
  const r = rng(symbol + "cash");
  const base = getFundamentals(symbol).freeCashFlow;
  const out: CashFlow[] = [];
  for (let i = 4; i >= 0; i--) {
    const op = base / Math.pow(1.1, i);
    const inv = -op * (0.3 + r() * 0.4);
    const fin = -op * (0.1 + r() * 0.2);
    out.push({ year: 2024 - i, operating: op, investing: inv, financing: fin, freeCashFlow: op + inv });
  }
  return out;
}

export function getStockMeta(symbol: string): StockMeta { return getMeta(symbol) ?? getMetaByIndex(0); }
export { REAL_STOCKS };
