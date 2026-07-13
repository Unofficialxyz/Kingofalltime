import type {
  StockMeta, Quote, Candle, Fundamentals,
  IncomeStatement, BalanceSheet, CashFlow, Timeframe,
} from './types';
import { STOCK_UNIVERSE } from './universe';

// --- Deterministic PRNG (mulberry32) seeded from the symbol string ---
function hashString(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const metaBySymbol = new Map(STOCK_UNIVERSE.map((s) => [s.symbol, s]));

export function getMeta(symbol: string): StockMeta | undefined {
  return metaBySymbol.get(symbol);
}

export function searchStocks(q: string): StockMeta[] {
  const query = q.trim().toLowerCase();
  if (!query) return STOCK_UNIVERSE.slice(0, 24);
  return STOCK_UNIVERSE.filter(
    (s) =>
      s.symbol.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query) ||
      s.exchange.toLowerCase().includes(query) ||
      s.region.toLowerCase().includes(query),
  ).slice(0, 50);
}

// Base price scale per region to keep numbers realistic.
function basePriceFor(meta: StockMeta, rng: () => number): number {
  const ranges: Record<string, [number, number]> = {
    INR: [120, 4200], USD: [25, 950], EUR: [20, 900], GBP: [120, 9500],
    JPY: [1200, 52000], HKD: [30, 480], CNY: [12, 1800], KRW: [40000, 900000],
    AUD: [12, 160], CAD: [25, 320], CHF: [40, 1100], SEK: [60, 520],
    BRL: [8, 120], SAR: [10, 200], AED: [3, 60], TRY: [20, 800], ZAR: [40, 900],
    NGN: [20, 600], PLN: [40, 600], DKK: [80, 1200], TWD: [50, 1500], SGD: [3, 80],
  };
  const [lo, hi] = ranges[meta.currency] ?? [20, 500];
  return +(lo + rng() * (hi - lo)).toFixed(2);
}

function driftFor(_meta: StockMeta, rng: () => number): number {
  // Slight positive long-term drift with per-stock variation.
  return 0.0004 + (rng() - 0.5) * 0.0012;
}

function volFor(_meta: StockMeta, rng: () => number): number {
  return 0.012 + rng() * 0.028;
}

const TF_DAYS: Record<Timeframe, number> = {
  '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '5Y': 1825, MAX: 3650,
};

export function getCandles(symbol: string, tf: Timeframe = '1Y'): Candle[] {
  const meta = getMeta(symbol);
  if (!meta) return [];
  const rng = mulberry32(hashString(symbol + '|' + tf));
  const days = TF_DAYS[tf];
  const stepMs = tf === '1D' ? 5 * 60 * 1000 : tf === '1W' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const count = tf === '1D' ? 78 : tf === '1W' ? 168 : Math.min(days, 730);
  const start = Date.now() - days * 24 * 60 * 60 * 1000;

  const drift = driftFor(meta, rng);
  const vol = volFor(meta, rng);
  let price = basePriceFor(meta, rng) * 0.7; // start lower so series trends up
  const out: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const t = start + i * stepMs;
    const shock = (rng() - 0.5) * 2 * vol;
    const ret = drift + shock;
    const o = price;
    const c = Math.max(0.01, +(o * (1 + ret)).toFixed(2));
    const intraday = Math.abs(rng() - 0.5) * 2 * vol * o;
    const h = +(Math.max(o, c) + intraday * 0.6).toFixed(2);
    const l = +(Math.min(o, c) - intraday * 0.6).toFixed(2);
    const v = Math.floor((0.4 + rng()) * 4_000_000);
    out.push({ t, o, h, l, c, v });
    price = c;
  }
  return out;
}

export function getQuote(symbol: string): Quote | null {
  const meta = getMeta(symbol);
  if (!meta) return null;
  const rng = mulberry32(hashString(symbol + '|q'));
  const series = getCandles(symbol, '1Y');
  if (!series.length) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2] ?? last;
  const change = +(last.c - prev.c).toFixed(2);
  const changePct = +((change / prev.c) * 100).toFixed(2);
  const yearHigh = Math.max(...series.slice(-252).map((c) => c.h));
  const yearLow = Math.min(...series.slice(-252).map((c) => c.l));
  const sharesOut = Math.floor((50 + rng() * 9500) * 1_000_000);
  const marketCap = last.c * sharesOut;
  const eps = +((last.c * (0.04 + rng() * 0.08))).toFixed(2);
  const pe = +(last.c / Math.max(0.01, eps)).toFixed(2);
  return {
    symbol,
    price: last.c,
    change,
    changePct,
    prevClose: prev.c,
    open: last.o,
    dayHigh: last.h,
    dayLow: last.l,
    yearHigh: +yearHigh.toFixed(2),
    yearLow: +yearLow.toFixed(2),
    volume: last.v,
    avgVolume: Math.floor(last.v * (0.8 + rng() * 0.4)),
    marketCap,
    pe,
    eps,
    beta: +(0.5 + rng() * 1.4).toFixed(2),
    dividendYield: +(rng() * 0.045).toFixed(4),
    asOf: new Date(last.t).toISOString(),
  };
}

export function getFundamentals(symbol: string): Fundamentals | null {
  const q = getQuote(symbol);
  if (!q) return null;
  const rng = mulberry32(hashString(symbol + '|f'));
  const margin = (lo: number, hi: number) => +(lo + rng() * (hi - lo)).toFixed(3);
  const roe = margin(0.05, 0.42);
  const netMargin = margin(0.04, 0.28);
  const operatingMargin = netMargin + margin(0.02, 0.12);
  const grossMargin = operatingMargin + margin(0.1, 0.4);
  return {
    symbol,
    pe: q.pe,
    forwardPe: +(q.pe * (0.85 + rng() * 0.2)).toFixed(2),
    peg: +(0.6 + rng() * 2.4).toFixed(2),
    ps: +(1 + rng() * 9).toFixed(2),
    pb: +(0.8 + rng() * 6).toFixed(2),
    evEbitda: +(6 + rng() * 18).toFixed(2),
    roe,
    roa: +(roe * (0.3 + rng() * 0.3)).toFixed(3),
    roic: +(roe * (0.6 + rng() * 0.3)).toFixed(3),
    grossMargin,
    operatingMargin,
    netMargin,
    debtToEquity: +(rng() * 1.6).toFixed(2),
    currentRatio: +(1 + rng() * 2).toFixed(2),
    quickRatio: +(0.6 + rng() * 1.4).toFixed(2),
    revenueGrowth: +((rng() - 0.3) * 0.4).toFixed(3),
    earningsGrowth: +((rng() - 0.2) * 0.5).toFixed(3),
    fcfYield: +(0.01 + rng() * 0.07).toFixed(3),
    payoutRatio: +(rng() * 0.7).toFixed(2),
    marketCap: q.marketCap,
    enterpriseValue: +(q.marketCap * (1 + rng() * 0.4)).toFixed(0),
    sharesOut: Math.floor(q.marketCap / q.price),
    dividendYield: q.dividendYield,
    beta: q.beta,
  };
}

export function getIncomeStatements(symbol: string): IncomeStatement[] {
  const f = getFundamentals(symbol);
  if (!f) return [];
  const rng = mulberry32(hashString(symbol + '|inc'));
  const out: IncomeStatement[] = [];
  let revenue = f.marketCap / Math.max(1, f.ps);
  for (let y = 4; y >= 0; y--) {
    const growth = 1 + (f.revenueGrowth * (0.6 + rng() * 0.8));
    revenue = y === 4 ? revenue : revenue / growth;
    const grossProfit = revenue * f.grossMargin;
    const operatingIncome = revenue * f.operatingMargin;
    const netIncome = revenue * f.netMargin;
    const ebitda = operatingIncome * (1.2 + rng() * 0.3);
    const eps = +(netIncome / f.sharesOut).toFixed(2);
    out.push({
      period: `FY${new Date().getFullYear() - y}`,
      revenue: +revenue.toFixed(0),
      grossProfit: +grossProfit.toFixed(0),
      operatingIncome: +operatingIncome.toFixed(0),
      netIncome: +netIncome.toFixed(0),
      ebitda: +ebitda.toFixed(0),
      eps,
    });
  }
  return out;
}

export function getBalanceSheets(symbol: string): BalanceSheet[] {
  const f = getFundamentals(symbol);
  if (!f) return [];
  const rng = mulberry32(hashString(symbol + '|bs'));
  const out: BalanceSheet[] = [];
  const equity = f.marketCap / Math.max(0.1, f.pb);
  const debt = equity * f.debtToEquity;
  for (let y = 4; y >= 0; y--) {
    const scale = 1 - y * 0.06;
    out.push({
      period: `FY${new Date().getFullYear() - y}`,
      totalAssets: +((equity + debt) * scale * (0.95 + rng() * 0.1)).toFixed(0),
      totalLiabilities: +(debt * scale * (1.4 + rng() * 0.3)).toFixed(0),
      equity: +(equity * scale).toFixed(0),
      cash: +(equity * scale * (0.1 + rng() * 0.25)).toFixed(0),
      debt: +(debt * scale).toFixed(0),
      inventory: +(equity * scale * (0.05 + rng() * 0.15)).toFixed(0),
      receivables: +(equity * scale * (0.08 + rng() * 0.12)).toFixed(0),
    });
  }
  return out;
}

export function getCashFlows(symbol: string): CashFlow[] {
  const f = getFundamentals(symbol);
  const inc = getIncomeStatements(symbol);
  if (!f || !inc.length) return [];
  const rng = mulberry32(hashString(symbol + '|cf'));
  const out: CashFlow[] = [];
  for (const i of inc) {
    const operatingCf = i.netIncome * (1.1 + rng() * 0.4);
    const capex = operatingCf * (0.1 + rng() * 0.3);
    out.push({
      period: i.period,
      operatingCf: +operatingCf.toFixed(0),
      capex: +capex.toFixed(0),
      freeCf: +(operatingCf - capex).toFixed(0),
      dividends: +(i.netIncome * f.payoutRatio).toFixed(0),
      netDebtIssuance: +((rng() - 0.5) * i.netIncome * 0.5).toFixed(0),
    });
  }
  return out;
}

// --- Market overview helpers ---
export function getMovers() {
  const quotes = STOCK_UNIVERSE.map((s) => getQuote(s.symbol)!).filter(Boolean);
  const gainers = [...quotes].sort((a, b) => b.changePct - a.changePct).slice(0, 8);
  const losers = [...quotes].sort((a, b) => a.changePct - b.changePct).slice(0, 8);
  const active = [...quotes].sort((a, b) => b.volume - a.volume).slice(0, 8);
  return { gainers, losers, active };
}

export function getIndices() {
  // Synthetic broad indices per region for the market overview header.
  const byRegion: Record<string, StockMeta[]> = {};
  for (const s of STOCK_UNIVERSE) {
    (byRegion[s.region] ??= []).push(s);
  }
  return Object.entries(byRegion).map(([region, stocks]) => {
    const quotes = stocks.map((s) => getQuote(s.symbol)!);
    const avg = quotes.reduce((a, q) => a + q.changePct, 0) / quotes.length;
    const level = 1000 + hashString(region) % 9000;
    return {
      name: region,
      level,
      changePct: +avg.toFixed(2),
      change: +(level * (avg / 100)).toFixed(2),
    };
  });
}
