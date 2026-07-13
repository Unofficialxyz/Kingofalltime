import type {
  StockMeta,
  Quote,
  Candle,
  Fundamentals,
  IncomeStatement,
  BalanceSheet,
  CashFlow,
  Timeframe,
} from "./types";
import { STOCK_UNIVERSE } from "./universe";

// ─── SEEDED PRNG ─────────────────────────────────────────────────────────────
// Mulberry32 PRNG seeded from a string hash so every symbol is fully deterministic.

function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFor(symbol: string, salt = 0): () => number {
  return mulberry32((hashString(symbol) ^ (salt * 2654435761)) >>> 0);
}

function round(n: number, dp = 2): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

// ─── META ───────────────────────────────────────────────────────────────────
export function getMeta(symbol: string): StockMeta | undefined {
  return STOCK_UNIVERSE.find((s) => s.symbol === symbol);
}

// ─── QUOTE (deterministic) ───────────────────────────────────────────────────
export function getQuote(symbol: string): Quote {
  const meta = getMeta(symbol);
  const rng = rngFor(symbol, 1);
  const base = 20 + rng() * 480; // $20 - $500 base
  const prevClose = round(base, 2);
  const changePct = round((rng() - 0.5) * 6, 2); // -3% to +3%
  const change = round(prevClose * (changePct / 100), 2);
  const price = round(Math.max(0.01, prevClose + change), 2);
  const open = round(prevClose * (1 + (rng() - 0.5) * 0.02), 2);
  const dayHigh = round(Math.max(price, open) * (1 + rng() * 0.02), 2);
  const dayLow = round(Math.min(price, open) * (1 - rng() * 0.02), 2);
  const yearHigh = round(base * (1.2 + rng() * 0.6), 2);
  const yearLow = round(base * (0.4 + rng() * 0.3), 2);
  const volume = Math.floor(100000 + rng() * 9900000);
  const avgVolume = Math.floor(100000 + rng() * 9900000);
  const sharesOut = Math.floor(100_000_000 + rng() * 9_900_000_000);
  const marketCap = Math.floor(price * sharesOut);
  const eps = round(price / (8 + rng() * 30), 2);
  const pe = round(price / Math.max(0.01, eps), 1);
  const beta = round(0.4 + rng() * 1.6, 2);
  const dividendYield = round(rng() < 0.5 ? 0 : rng() * 4, 2);
  return {
    symbol,
    price,
    change,
    changePct,
    prevClose,
    open,
    dayHigh,
    dayLow,
    yearHigh,
    yearLow,
    volume,
    avgVolume,
    marketCap,
    pe,
    eps,
    beta,
    dividendYield,
    asOf: new Date().toISOString(),
  };
}

// ─── LIVE QUOTE (cached, small jitter) ───────────────────────────────────────
const liveQuoteCache = new Map<string, { quote: Quote; ts: number }>();
const LIVE_TTL = 5000; // 5s

export function getLiveQuote(symbol: string): Quote {
  const now = Date.now();
  const cached = liveQuoteCache.get(symbol);
  if (cached && now - cached.ts < LIVE_TTL) {
    return cached.quote;
  }
  const base = getQuote(symbol);
  const rng = rngFor(symbol + ":" + Math.floor(now / LIVE_TTL), 99);
  const jitter = (rng() - 0.5) * base.price * 0.004; // +/-0.2%
  const price = round(Math.max(0.01, base.price + jitter), 2);
  const change = round(price - base.prevClose, 2);
  const changePct = round((change / base.prevClose) * 100, 2);
  const quote: Quote = {
    ...base,
    price,
    change,
    changePct,
    dayHigh: Math.max(base.dayHigh, price),
    dayLow: Math.min(base.dayLow, price),
    asOf: new Date().toISOString(),
  };
  liveQuoteCache.set(symbol, { quote, ts: now });
  return quote;
}

// ─── CANDLES (cached) ────────────────────────────────────────────────────────
const candleCache = new Map<string, Candle[]>();

const TF_DAYS: Record<Timeframe, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "5Y": 1825,
  MAX: 3650,
};

export function getCandles(symbol: string, tf: Timeframe): Candle[] {
  const key = symbol + ":" + tf;
  const cached = candleCache.get(key);
  if (cached) return cached;
  const rng = rngFor(symbol, 7);
  const days = TF_DAYS[tf];
  const count = Math.min(days, 500);
  const stepMs = (tf === "1D" ? 5 : 1) * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const startPrice = 20 + rng() * 200;
  const drift = (rng() - 0.45) * 0.002; // slight upward bias
  const vol = 0.01 + rng() * 0.03;
  const candles: Candle[] = [];
  let price = startPrice;
  for (let i = count - 1; i >= 0; i--) {
    const t = now - i * stepMs;
    const shock = (rng() - 0.5) * 2 * vol;
    const o = round(price, 2);
    const c = round(Math.max(0.01, o * (1 + drift + shock)), 2);
    const h = round(Math.max(o, c) * (1 + Math.abs(rng() * vol * 0.5)), 2);
    const l = round(Math.min(o, c) * (1 - Math.abs(rng() * vol * 0.5)), 2);
    const v = Math.floor(500000 + rng() * 5000000);
    candles.push({ t, o, h, l, c, v });
    price = c;
  }
  candleCache.set(key, candles);
  return candles;
}

// ─── FUNDAMENTALS (cached) ───────────────────────────────────────────────────
const fundCache = new Map<string, Fundamentals>();

export function getFundamentals(symbol: string): Fundamentals {
  const cached = fundCache.get(symbol);
  if (cached) return cached;
  const q = getQuote(symbol);
  const rng = rngFor(symbol, 13);
  const sharesOut = Math.floor(100_000_000 + rng() * 9_900_000_000);
  const marketCap = Math.floor(q.price * sharesOut);
  const eps = q.eps;
  const pe = q.pe;
  const forwardPe = round(pe * (0.85 + rng() * 0.25), 1);
  const peg = round(forwardPe / Math.max(0.5, 5 + rng() * 20), 2);
  const ps = round(q.price / Math.max(1, 5 + rng() * 80), 2);
  const pb = round(q.price / Math.max(1, 10 + rng() * 60), 2);
  const evEbitda = round(6 + rng() * 18, 1);
  const roe = round((rng() - 0.2) * 40, 1);
  const roa = round((rng() - 0.1) * 20, 1);
  const roic = round((rng() - 0.1) * 25, 1);
  const grossMargin = round(0.2 + rng() * 0.6, 3);
  const operatingMargin = round(grossMargin * (0.3 + rng() * 0.5), 3);
  const netMargin = round(operatingMargin * (0.6 + rng() * 0.35), 3);
  const debtToEquity = round(rng() * 2.5, 2);
  const currentRatio = round(0.8 + rng() * 2.5, 2);
  const quickRatio = round(currentRatio * (0.6 + rng() * 0.3), 2);
  const revenueGrowth = round((rng() - 0.3) * 50, 1);
  const earningsGrowth = round((rng() - 0.3) * 60, 1);
  const fcfYield = round((rng() - 0.1) * 10, 2);
  const payoutRatio = round(rng() < 0.5 ? 0 : rng() * 0.8, 2);
  const enterpriseValue = Math.floor(marketCap * (0.8 + rng() * 0.6));
  const fund: Fundamentals = {
    symbol,
    pe,
    forwardPe,
    peg,
    ps,
    pb,
    evEbitda,
    roe,
    roa,
    roic,
    grossMargin,
    operatingMargin,
    netMargin,
    debtToEquity,
    currentRatio,
    quickRatio,
    revenueGrowth,
    earningsGrowth,
    fcfYield,
    payoutRatio,
    marketCap,
    enterpriseValue,
    sharesOut,
    dividendYield: q.dividendYield,
    beta: q.beta,
  };
  fundCache.set(symbol, fund);
  return fund;
}

// ─── FINANCIAL STATEMENTS ─────────────────────────────────────────────────────

export function getIncomeStatements(symbol: string): IncomeStatement[] {
  const rng = rngFor(symbol, 21);
  const fund = getFundamentals(symbol);
  const out: IncomeStatement[] = [];
  let revenue = Math.floor(1_000_000_000 + rng() * 49_000_000_000);
  for (let i = 4; i >= 0; i--) {
    const year = new Date().getFullYear() - i;
    const g = 1 + (fund.revenueGrowth / 100) * (0.7 + rng() * 0.6);
    revenue = Math.floor(revenue * g);
    const grossProfit = Math.floor(revenue * fund.grossMargin);
    const operatingIncome = Math.floor(revenue * fund.operatingMargin);
    const netIncome = Math.floor(revenue * fund.netMargin);
    const ebitda = Math.floor(operatingIncome * (1.2 + rng() * 0.4));
    const eps = round(netIncome / fund.sharesOut, 2);
    out.push({
      period: "FY" + year,
      revenue,
      grossProfit,
      operatingIncome,
      netIncome,
      ebitda,
      eps,
    });
  }
  return out;
}

export function getBalanceSheets(symbol: string): BalanceSheet[] {
  const rng = rngFor(symbol, 31);
  const fund = getFundamentals(symbol);
  const out: BalanceSheet[] = [];
  let assets = Math.floor(fund.marketCap * (1 + rng() * 2));
  for (let i = 4; i >= 0; i--) {
    const year = new Date().getFullYear() - i;
    const equity = Math.floor(assets * (0.3 + rng() * 0.4));
    const liabilities = assets - equity;
    const cash = Math.floor(assets * (0.05 + rng() * 0.25));
    const debt = Math.floor(equity * fund.debtToEquity);
    const inventory = Math.floor(assets * (0.05 + rng() * 0.2));
    const receivables = Math.floor(assets * (0.05 + rng() * 0.2));
    out.push({
      period: "FY" + year,
      totalAssets: assets,
      totalLiabilities: liabilities,
      equity,
      cash,
      debt,
      inventory,
      receivables,
    });
    assets = Math.floor(assets * (1.05 + rng() * 0.1));
  }
  return out;
}

export function getCashFlows(symbol: string): CashFlow[] {
  const rng = rngFor(symbol, 41);
  const fund = getFundamentals(symbol);
  const inc = getIncomeStatements(symbol);
  const out: CashFlow[] = [];
  for (let i = 0; i < inc.length; i++) {
    const item = inc[i];
    const operatingCf = Math.floor(item.netIncome * (1.1 + rng() * 0.5));
    const capex = Math.floor(operatingCf * (0.1 + rng() * 0.4));
    const freeCf = operatingCf - capex;
    const dividends = Math.floor(freeCf * fund.payoutRatio);
    const netDebtIssuance = Math.floor((rng() - 0.5) * operatingCf * 0.3);
    out.push({
      period: item.period,
      operatingCf,
      capex,
      freeCf,
      dividends,
      netDebtIssuance,
    });
  }
  return out;
}
