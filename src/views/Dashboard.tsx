import { useMemo } from "react";
import {
  Star,
  Target,
  Globe2,
  Gauge,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import {
  STOCK_UNIVERSE,
  REGIONS,
  SECTORS,
  TOTAL_STOCKS,
  getMetaByIndex,
} from "../lib/universe";
import { getLiveQuote, getCandles } from "../lib/dataService";
import { useLiveQuotes } from "../lib/hooks";
import { useCurrency } from "../lib/currency";
import { fmtPctRaw } from "../lib/format";
import { Sparkline } from "../components/Sparkline";
import type { Quote, Region } from "../lib/types";

interface DashboardProps {
  onOpenStock: (symbol: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REGION_SAMPLE_SIZE = 200;
const MOVERS_SAMPLE_SIZE = 500;
const SECTOR_SAMPLE_SIZE = 60;

function sampleStocksByRegion(region: Region, limit: number) {
  const out: typeof STOCK_UNIVERSE = [];
  for (let i = 0; i < STOCK_UNIVERSE.length && out.length < limit; i++) {
    const s = STOCK_UNIVERSE[i];
    if (s.region === region) out.push(s);
  }
  return out;
}

function sampleStocksBySector(sector: string, limit: number) {
  const out: typeof STOCK_UNIVERSE = [];
  for (let i = 0; i < STOCK_UNIVERSE.length && out.length < limit; i++) {
    const s = STOCK_UNIVERSE[i];
    if (s.sector === sector) out.push(s);
  }
  return out;
}

function sparkPointsFor(symbol: string): number[] {
  const candles = getCandles(symbol, "1W");
  if (!candles.length) return [];
  return candles.map((c) => c.c);
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export function Dashboard({ onOpenStock }: DashboardProps) {
  useLiveQuotes();
  const { formatCompact, formatPrice } = useCurrency();

  // ── Best stock per region (highest % gain) ──
  const bestPerRegion = useMemo(() => {
    return REGIONS.map((region) => {
      const sample = sampleStocksByRegion(region, REGION_SAMPLE_SIZE);
      let best: { symbol: string; name: string; quote: Quote } | null = null;
      for (const s of sample) {
        const q = getLiveQuote(s.symbol);
        if (!q) continue;
        if (!best || q.changePct > best.quote.changePct) {
          best = { symbol: s.symbol, name: s.name, quote: q };
        }
      }
      return { region, best };
    }).filter((r) => r.best);
  }, []);

  // ── Cheapest stock per region (lowest positive P/E) ──
  const cheapestPerRegion = useMemo(() => {
    return REGIONS.map((region) => {
      const sample = sampleStocksByRegion(region, REGION_SAMPLE_SIZE);
      let cheapest: { symbol: string; name: string; quote: Quote } | null = null;
      for (const s of sample) {
        const q = getLiveQuote(s.symbol);
        if (!q) continue;
        if (q.pe > 0 && (!cheapest || q.pe < cheapest.quote.pe)) {
          cheapest = { symbol: s.symbol, name: s.name, quote: q };
        }
      }
      return { region, cheapest };
    }).filter((r) => r.cheapest);
  }, []);

  // ── Movers (first 500 stocks) ──
  const { topGainers, topLosers, mostActive } = useMemo(() => {
    const quotes: { symbol: string; name: string; quote: Quote }[] = [];
    for (let i = 0; i < MOVERS_SAMPLE_SIZE; i++) {
      const meta = STOCK_UNIVERSE[i];
      if (!meta) break;
      const q = getLiveQuote(meta.symbol);
      if (q) quotes.push({ symbol: meta.symbol, name: meta.name, quote: q });
    }
    const sorted = [...quotes].sort((a, b) => b.quote.changePct - a.quote.changePct);
    const gainers = sorted.slice(0, 5);
    const losers = [...sorted].reverse().slice(0, 5);
    const active = [...quotes].sort((a, b) => b.quote.volume - a.quote.volume).slice(0, 5);
    return { topGainers: gainers, topLosers: losers, mostActive: active };
  }, []);

  // ── Sector performance ──
  const sectorPerf = useMemo(() => {
    return SECTORS.map((sector) => {
      const sample = sampleStocksBySector(sector, SECTOR_SAMPLE_SIZE);
      let sum = 0;
      let count = 0;
      for (const s of sample) {
        const q = getLiveQuote(s.symbol);
        if (q) {
          sum += q.changePct;
          count++;
        }
      }
      const avg = count > 0 ? sum / count : 0;
      return { sector, avg, count };
    }).sort((a, b) => b.avg - a.avg);
  }, []);

  // ── Market stats ──
  const stats = useMemo(() => {
    let advancers = 0;
    let decliners = 0;
    let totalMcap = 0;
    for (let i = 0; i < MOVERS_SAMPLE_SIZE; i++) {
      const meta = STOCK_UNIVERSE[i];
      if (!meta) break;
      const q = getLiveQuote(meta.symbol);
      if (!q) continue;
      if (q.changePct > 0) advancers++;
      else if (q.changePct < 0) decliners++;
      totalMcap += q.marketCap;
    }
    return { advancers, decliners, totalMcap };
  }, []);

  // ── Fear & Greed Index (0-100 from advancer ratio) ──
  const fearGreed = useMemo(() => {
    const total = stats.advancers + stats.decliners;
    if (total === 0) return 50;
    const ratio = stats.advancers / total;
    return Math.round(ratio * 100);
  }, [stats]);

  const fgLabel =
    fearGreed >= 75 ? "Extreme Greed" :
    fearGreed >= 55 ? "Greed" :
    fearGreed >= 45 ? "Neutral" :
    fearGreed >= 25 ? "Fear" :
    "Extreme Fear";
  const fgColor =
    fearGreed >= 55 ? "text-bull" :
    fearGreed >= 45 ? "text-accent-400" :
    "text-bear";

  // ── Region row ──
  function RegionRow({
    symbol,
    name,
    quote,
    metric,
  }: {
    symbol: string;
    name: string;
    quote: Quote;
    metric: string;
  }) {
    const positive = quote.changePct >= 0;
    return (
      <button
        onClick={() => onOpenStock(symbol)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition text-left group"
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink-100 text-sm truncate">{symbol}</div>
          <div className="text-xs text-ink-500 truncate">{name}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-mono text-ink-300">{metric}</div>
          <div className={`text-xs font-mono ${positive ? "text-bull" : "text-bear"}`}>
            {positive ? "+" : ""}{fmtPctRaw(quote.changePct)}
          </div>
        </div>
      </button>
    );
  }

  // ── Mover row ──
  function MoverRow({
    symbol,
    name,
    quote,
  }: {
    symbol: string;
    name: string;
    quote: Quote;
  }) {
    const positive = quote.changePct >= 0;
    const points = sparkPointsFor(symbol);
    return (
      <button
        onClick={() => onOpenStock(symbol)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink-100 text-sm truncate">{symbol}</div>
          <div className="text-xs text-ink-500 truncate">{name}</div>
        </div>
        <Sparkline points={points} positive={positive} width={64} height={28} />
        <div className="text-right shrink-0 w-20">
          <div className="text-xs font-mono text-ink-300">{formatPrice(quote.price, getMetaByIndex(STOCK_UNIVERSE.findIndex((s) => s.symbol === symbol))?.currency)}</div>
          <div className={`text-xs font-mono ${positive ? "text-bull" : "text-bear"}`}>
            {positive ? "+" : ""}{fmtPctRaw(quote.changePct)}
          </div>
        </div>
      </button>
    );
  }

  // ── Most active row ──
  function ActiveRow({
    symbol,
    name,
    quote,
  }: {
    symbol: string;
    name: string;
    quote: Quote;
  }) {
    const positive = quote.changePct >= 0;
    return (
      <button
        onClick={() => onOpenStock(symbol)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink-100 text-sm truncate">{symbol}</div>
          <div className="text-xs text-ink-500 truncate">{name}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-mono text-ink-400">{formatCompact(quote.volume)}</div>
          <div className={`text-xs font-mono ${positive ? "text-bull" : "text-bear"}`}>
            {positive ? "+" : ""}{fmtPctRaw(quote.changePct)}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="flex gap-6 p-6 max-w-[1600px] mx-auto">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden lg:block w-72 shrink-0 space-y-4">
        {/* Best Stock of the Day */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-accent-400" />
            <h3 className="text-sm font-semibold text-ink-100">Best Stock of the Day</h3>
          </div>
          <div className="space-y-0.5">
            {bestPerRegion.slice(0, 12).map(({ region, best }) =>
              best ? (
                <div key={region}>
                  <div className="px-3 pt-2 pb-0.5 text-[10px] uppercase tracking-wider text-ink-600">{region}</div>
                  <RegionRow
                    symbol={best.symbol}
                    name={best.name}
                    quote={best.quote}
                    metric={formatPrice(best.quote.price, STOCK_UNIVERSE.find((s) => s.symbol === best.symbol)?.currency)}
                  />
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Cheapest Stock of the Day */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-brand-400" />
            <h3 className="text-sm font-semibold text-ink-100">Cheapest Stock of the Day</h3>
          </div>
          <div className="space-y-0.5">
            {cheapestPerRegion.slice(0, 12).map(({ region, cheapest }) =>
              cheapest ? (
                <div key={region}>
                  <div className="px-3 pt-2 pb-0.5 text-[10px] uppercase tracking-wider text-ink-600">{region}</div>
                  <RegionRow
                    symbol={cheapest.symbol}
                    name={cheapest.name}
                    quote={cheapest.quote}
                    metric={`P/E ${cheapest.quote.pe.toFixed(1)}`}
                  />
                </div>
              ) : null
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 space-y-6">
        {/* Hero stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Globe2 size={16} className="text-brand-400" />
              <span className="text-xs uppercase tracking-wider text-ink-500">Total Stocks</span>
            </div>
            <div className="text-2xl font-bold text-ink-50 font-mono">{formatCompact(TOTAL_STOCKS)}</div>
            <div className="text-xs text-ink-500 mt-1">Across {REGIONS.length} regions</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-bull" />
              <span className="text-xs uppercase tracking-wider text-ink-500">Advancers / Decliners</span>
            </div>
            <div className="text-2xl font-bold font-mono">
              <span className="text-bull">{stats.advancers}</span>
              <span className="text-ink-600 mx-1">/</span>
              <span className="text-bear">{stats.decliners}</span>
            </div>
            <div className="text-xs text-ink-500 mt-1">Sampled from top {MOVERS_SAMPLE_SIZE}</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-accent-400" />
              <span className="text-xs uppercase tracking-wider text-ink-500">Total Market Cap</span>
            </div>
            <div className="text-2xl font-bold text-ink-50 font-mono">{formatCompact(stats.totalMcap, "USD")}</div>
            <div className="text-xs text-ink-500 mt-1">Sampled aggregate</div>
          </div>
        </div>

        {/* Fear & Greed + Sector Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Fear & Greed */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gauge size={16} className="text-accent-500" />
              <h3 className="text-sm font-semibold text-ink-100">Fear &amp; Greed Index</h3>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-20 overflow-hidden">
                <div className="absolute inset-0 rounded-t-full bg-gradient-to-r from-bear via-accent-400 to-bull opacity-80" />
                <div
                  className="absolute bottom-0 w-1 h-20 bg-ink-50 rounded-full"
                  style={{ left: `calc(${fearGreed}% - 2px)` }}
                />
              </div>
              <div className="text-3xl font-bold font-mono mt-2">{fearGreed}</div>
              <div className={`text-sm font-semibold ${fgColor}`}>{fgLabel}</div>
            </div>
          </div>

          {/* Sector Performance */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <PieChart size={16} className="text-brand-400" />
              <h3 className="text-sm font-semibold text-ink-100">Sector Performance</h3>
            </div>
            <div className="space-y-2">
              {sectorPerf.map((s) => {
                const positive = s.avg >= 0;
                const width = Math.min(Math.abs(s.avg) * 25, 100);
                return (
                  <div key={s.sector} className="flex items-center gap-3">
                    <div className="w-36 text-xs text-ink-400 truncate shrink-0">{s.sector}</div>
                    <div className="flex-1 h-5 bg-white/5 rounded relative overflow-hidden">
                      <div
                        className={`absolute top-0 bottom-0 rounded ${positive ? "bg-bull/60" : "bg-bear/60"}`}
                        style={{ width: `${width}%`, left: positive ? "50%" : `${50 - width}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-ink-600 font-mono">
                        {s.count}
                      </div>
                    </div>
                    <div className={`w-16 text-right text-xs font-mono ${positive ? "text-bull" : "text-bear"}`}>
                      {positive ? "+" : ""}{fmtPctRaw(s.avg)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Gainers / Losers / Most Active */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-bull" />
              <h3 className="text-sm font-semibold text-ink-100">Top Gainers</h3>
            </div>
            <div className="space-y-0.5">
              {topGainers.map((m) => (
                <MoverRow key={m.symbol} symbol={m.symbol} name={m.name} quote={m.quote} />
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={16} className="text-bear" />
              <h3 className="text-sm font-semibold text-ink-100">Top Losers</h3>
            </div>
            <div className="space-y-0.5">
              {topLosers.map((m) => (
                <MoverRow key={m.symbol} symbol={m.symbol} name={m.name} quote={m.quote} />
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-brand-300" />
              <h3 className="text-sm font-semibold text-ink-100">Most Active</h3>
            </div>
            <div className="space-y-0.5">
              {mostActive.map((m) => (
                <ActiveRow key={m.symbol} symbol={m.symbol} name={m.name} quote={m.quote} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
