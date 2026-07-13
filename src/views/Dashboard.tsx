import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Globe2, Gauge, PieChart, Star, Target, DollarSign } from 'lucide-react';
import { getLiveQuote, getCandles } from '../lib/dataService';
import { useLiveQuotes } from '../lib/hooks';
import { STOCK_UNIVERSE, REGIONS, SECTORS } from '../lib/universe';
import { fmtPctRaw } from '../lib/format';
import { useCurrency } from '../lib/currency';
import { Sparkline } from '../components/Sparkline';
import type { Quote, Region } from '../lib/types';

interface Props { onOpenStock: (symbol: string) => void; }

interface RegionPick { region: Region; symbol: string; name: string; price: number; changePct: number; }

export function Dashboard({ onOpenStock }: Props) {
  useLiveQuotes();
  const { formatPrice, formatCompact } = useCurrency();

  // Best stock of the day per region (highest % gain)
  const bestByRegion = useMemo<RegionPick[]>(() => {
    return REGIONS.map((region) => {
      const stocks = STOCK_UNIVERSE.filter((s) => s.region === region).slice(0, 200);
      let best: RegionPick | null = null;
      for (const s of stocks) {
        const q = getLiveQuote(s.symbol);
        if (!q) continue;
        if (!best || q.changePct > best.changePct) {
          best = { region, symbol: s.symbol, name: s.name, price: q.price, changePct: q.changePct };
        }
      }
      return best!;
    }).filter(Boolean);
  }, []);

  // Cheapest stock of the day per region (lowest P/E ratio, positive earnings)
  const cheapestByRegion = useMemo<RegionPick[]>(() => {
    return REGIONS.map((region) => {
      const stocks = STOCK_UNIVERSE.filter((s) => s.region === region).slice(0, 200);
      let cheapest: RegionPick | null = null;
      let cheapestPE = Infinity;
      for (const s of stocks) {
        const q = getLiveQuote(s.symbol);
        if (!q || q.pe <= 0 || q.pe >= cheapestPE) continue;
        cheapestPE = q.pe;
        cheapest = { region, symbol: s.symbol, name: s.name, price: q.price, changePct: q.changePct };
      }
      return cheapest!;
    }).filter(Boolean);
  }, []);

  const { gainers, losers, active } = useMemo(() => {
    const quotes = STOCK_UNIVERSE.slice(0, 500).map((s) => getLiveQuote(s.symbol)!).filter(Boolean);
    return {
      gainers: [...quotes].sort((a, b) => b.changePct - a.changePct).slice(0, 8),
      losers: [...quotes].sort((a, b) => a.changePct - b.changePct).slice(0, 8),
      active: [...quotes].sort((a, b) => b.volume - a.volume).slice(0, 8),
    };
  }, []);

  const sectorPerf = useMemo(() => {
    return SECTORS.map((sector) => {
      const stocks = STOCK_UNIVERSE.filter((s) => s.sector === sector).slice(0, 50);
      const quotes = stocks.map((s) => getLiveQuote(s.symbol)!).filter(Boolean);
      const avg = quotes.length ? quotes.reduce((a, q) => a + q.changePct, 0) / quotes.length : 0;
      return { sector, avgChange: +avg.toFixed(2) };
    }).sort((a, b) => b.avgChange - a.avgChange);
  }, []);

  const fearGreed = useMemo(() => {
    const quotes = STOCK_UNIVERSE.slice(0, 500).map((s) => getLiveQuote(s.symbol)!).filter(Boolean);
    const advancers = quotes.filter((q) => q.changePct > 0).length;
    const advRatio = advancers / quotes.length;
    const score = Math.max(0, Math.min(100, Math.round(advRatio * 60 + 20)));
    return { score, label: score >= 75 ? 'Extreme Greed' : score >= 55 ? 'Greed' : score >= 45 ? 'Neutral' : score >= 25 ? 'Fear' : 'Extreme Fear' };
  }, []);

  const stats = useMemo(() => {
    const quotes = STOCK_UNIVERSE.slice(0, 500).map((s) => getLiveQuote(s.symbol)!).filter(Boolean);
    const advancers = quotes.filter((q) => q.changePct > 0).length;
    const totalCap = quotes.reduce((a, q) => a + q.marketCap, 0);
    return { count: STOCK_UNIVERSE.length, advancers, decliners: quotes.length - advancers, totalCap };
  }, []);

  return (
    <div className="flex gap-6 animate-fade-in">
      {/* LEFT SIDEBAR: Best stock of the day by region, then cheapest stock of the day */}
      <aside className="w-72 shrink-0 hidden lg:block space-y-4">
        <div className="card p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-100 mb-3">
            <Star size={15} className="text-accent-400" /> Best Stock of the Day
          </h3>
          <div className="space-y-2">
            {bestByRegion.map((p) => (
              <button key={p.region} onClick={() => onOpenStock(p.symbol)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition group text-left">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-ink-500 truncate">{p.region}</div>
                  <div className="text-sm font-semibold text-ink-100 group-hover:text-brand-300 transition truncate">{p.symbol}</div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-xs font-mono text-bull">+{fmtPctRaw(p.changePct)}</div>
                  <div className="text-[10px] text-ink-500">{p.name.slice(0, 15)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-100 mb-3">
            <Target size={15} className="text-brand-400" /> Cheapest Stock of the Day
          </h3>
          <div className="space-y-2">
            {cheapestByRegion.map((p) => {
              const meta = STOCK_UNIVERSE.find((s) => s.symbol === p.symbol);
              return (
                <button key={p.region} onClick={() => onOpenStock(p.symbol)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition group text-left">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-ink-500 truncate">{p.region}</div>
                    <div className="text-sm font-semibold text-ink-100 group-hover:text-brand-300 transition truncate">{p.symbol}</div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-xs font-mono text-ink-200">{formatPrice(p.price, meta?.currency ?? 'USD')}</div>
                    <div className="text-[10px] text-ink-500 truncate">{p.name.slice(0, 15)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Hero */}
        <div className="card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-brand-300 text-sm font-medium mb-2">
              <Globe2 size={16} /> Global markets, one screen
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-balance text-ink-50">
              Analyse <span className="text-brand-410">{stats.count.toLocaleString()}+ stocks</span>, anywhere in the world.
            </h1>
            <p className="mt-3 text-ink-400 max-w-2xl text-balance">
              AI-powered technicals, fundamentals, screener, compare, watchlists and portfolio tracking —
              across US, India, Europe, Asia and more. All prices in INR by default.
            </p>
            <div className="mt-5 flex flex-wrap gap-6 text-sm">
              <Stat label="Stocks tracked" value={stats.count.toLocaleString()} />
              <Stat label="Advancing" value={stats.advancers.toString()} tone="bull" />
              <Stat label="Declining" value={stats.decliners.toString()} tone="bear" />
              <Stat label="Total mkt cap" value={formatCompact(stats.totalCap, 'USD')} />
            </div>
          </div>
        </div>

        {/* Fear & Greed + Sector performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Gauge size={18} className="text-brand-400" />
              <h3 className="font-semibold text-ink-100 text-sm">Fear & Greed Index</h3>
            </div>
            <div className="text-center py-4">
              <div className={`text-5xl font-bold font-mono ${fearGreed.score >= 55 ? 'text-bull' : fearGreed.score >= 45 ? 'text-accent-400' : 'text-bear'}`}>{fearGreed.score}</div>
              <div className="text-sm text-ink-400 mt-1">{fearGreed.label}</div>
            </div>
            <div className="h-2 rounded-full bg-gradient-to-r from-bear via-accent-400 to-bull overflow-hidden">
              <div className="relative h-full" style={{ width: `${fearGreed.score}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-ink-950" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-ink-600 mt-1">
              <span>Extreme Fear</span><span>Neutral</span><span>Extreme Greed</span>
            </div>
          </div>

          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={18} className="text-brand-400" />
              <h3 className="font-semibold text-ink-100 text-sm">Sector Performance</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sectorPerf.map((s) => (
                <div key={s.sector} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                  <span className="text-xs text-ink-300 truncate">{s.sector}</span>
                  <span className={`text-xs font-mono ${s.avgChange >= 0 ? 'text-bull' : 'text-bear'}`}>{s.avgChange >= 0 ? '+' : ''}{fmtPctRaw(s.avgChange)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Movers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MoverCard title="Top gainers" icon={<TrendingUp size={16} className="text-bull" />} quotes={gainers} onOpenStock={onOpenStock} />
          <MoverCard title="Top losers" icon={<TrendingDown size={16} className="text-bear" />} quotes={losers} onOpenStock={onOpenStock} />
          <MoverCard title="Most active" icon={<Activity size={16} className="text-accent-400" />} quotes={active} onOpenStock={onOpenStock} volume />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bull' | 'bear' }) {
  return (
    <div>
      <div className={`text-xl font-semibold ${tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : 'text-ink-100'}`}>{value}</div>
      <div className="text-xs text-ink-500">{label}</div>
    </div>
  );
}

function MoverCard({ title, icon, quotes, onOpenStock, volume }: { title: string; icon: React.ReactNode; quotes: Quote[]; onOpenStock: (s: string) => void; volume?: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 text-sm font-semibold text-ink-200">{icon} {title}</div>
      <div className="divide-y divide-white/[0.03]">
        {quotes.map((q) => {
          const meta = STOCK_UNIVERSE.find((s) => s.symbol === q.symbol);
          const spark = getCandles(q.symbol, '1M').map((c) => c.c).filter((_, i) => i % 3 === 0).slice(-30);
          return (
            <button key={q.symbol} onClick={() => onOpenStock(q.symbol)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition text-left">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink-100 text-sm">{q.symbol}</div>
                <div className="text-xs text-ink-500 truncate">{meta?.name}</div>
              </div>
              <div className="w-16 h-9 shrink-0"><Sparkline points={spark} positive={q.changePct >= 0} /></div>
              <div className="text-right shrink-0 w-20">
                <div className="text-sm font-mono text-ink-100">{q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className={`text-xs font-mono ${q.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>{q.changePct >= 0 ? '+' : ''}{fmtPctRaw(q.changePct)}</div>
              </div>
              {volume && <div className="text-xs text-ink-500 w-16 text-right hidden sm:block">{q.volume > 1e9 ? (q.volume / 1e9).toFixed(1) + 'B' : q.volume > 1e6 ? (q.volume / 1e6).toFixed(1) + 'M' : (q.volume / 1e3).toFixed(0) + 'K'}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
