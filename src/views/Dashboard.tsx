import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Globe2 } from 'lucide-react';
import { getIndices, getCandles } from '../lib/dataService';
import { getLiveQuote, useLiveQuotes } from '../lib/liveFeed';
import { STOCK_UNIVERSE } from '../lib/universe';
import { fmtCompact, fmtPctRaw } from '../lib/format';
import { Sparkline } from '../components/Sparkline';
import type { Quote } from '../lib/types';

interface Props { onOpenStock: (symbol: string) => void; }

export function Dashboard({ onOpenStock }: Props) {
  useLiveQuotes(); // re-render every tick

  const { gainers, losers, active } = useMemo(() => {
    const quotes = STOCK_UNIVERSE.map((s) => getLiveQuote(s.symbol)!).filter(Boolean);
    return {
      gainers: [...quotes].sort((a, b) => b.changePct - a.changePct).slice(0, 8),
      losers: [...quotes].sort((a, b) => a.changePct - b.changePct).slice(0, 8),
      active: [...quotes].sort((a, b) => b.volume - a.volume).slice(0, 8),
    };
  }, []);

  const indices = useMemo(() => getIndices(), []);

  const stats = useMemo(() => {
    const quotes = STOCK_UNIVERSE.map((s) => getLiveQuote(s.symbol)!).filter(Boolean);
    const advancers = quotes.filter((q) => q.changePct > 0).length;
    const totalCap = quotes.reduce((a, q) => a + q.marketCap, 0);
    return { count: STOCK_UNIVERSE.length, advancers, decliners: quotes.length - advancers, totalCap };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-brand-300 text-sm font-medium mb-2">
            <Globe2 size={16} /> Global markets, one screen
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-balance text-ink-50">
            Analyse <span className="text-brand-400">any stock</span>, anywhere in the world.
          </h1>
          <p className="mt-3 text-ink-400 max-w-2xl text-balance">
            Technicals, fundamentals, screener, compare, watchlists and portfolio tracking —
            across US, India, Europe, Asia and more. Free, fast, and built for clarity.
          </p>
          <div className="mt-5 flex flex-wrap gap-6 text-sm">
            <Stat label="Stocks tracked" value={stats.count.toLocaleString()} />
            <Stat label="Advancing" value={stats.advancers.toString()} tone="bull" />
            <Stat label="Declining" value={stats.decliners.toString()} tone="bear" />
            <Stat label="Total mkt cap" value={`$${fmtCompact(stats.totalCap)}`} />
          </div>
        </div>
      </div>

      {/* Regional indices */}
      <div>
        <h2 className="text-sm font-semibold text-ink-300 mb-3 px-1">Regional snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {indices.map((idx) => (
            <div key={idx.name} className="card card-hover p-4">
              <div className="text-xs text-ink-400 truncate">{idx.name}</div>
              <div className="text-lg font-semibold text-ink-100 mt-1">{idx.level.toLocaleString()}</div>
              <div className={`text-xs font-mono mt-1 flex items-center gap-1 ${idx.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>
                {idx.changePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {idx.changePct >= 0 ? '+' : ''}{fmtPctRaw(idx.changePct)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MoverCard title="Top gainers" icon={<TrendingUp size={16} className="text-bull" />} quotes={gainers} onOpenStock={onOpenStock} />
        <MoverCard title="Top losers" icon={<TrendingDown size={16} className="text-bear" />} quotes={losers} onOpenStock={onOpenStock} />
        <MoverCard title="Most active" icon={<Activity size={16} className="text-accent-400" />} quotes={active} onOpenStock={onOpenStock} volume />
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

function MoverCard({ title, icon, quotes, onOpenStock, volume }: {
  title: string; icon: React.ReactNode; quotes: Quote[]; onOpenStock: (s: string) => void; volume?: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 text-sm font-semibold text-ink-200">
        {icon} {title}
      </div>
      <div className="divide-y divide-white/[0.03]">
        {quotes.map((q) => {
          const meta = STOCK_UNIVERSE.find((s) => s.symbol === q.symbol)!;
          const spark = getCandles(q.symbol, '1M').map((c) => c.c).filter((_, i) => i % 3 === 0).slice(-30);          return (
            <button
              key={q.symbol}
              onClick={() => onOpenStock(q.symbol)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink-100 text-sm">{q.symbol}</div>
                <div className="text-xs text-ink-500 truncate">{meta?.name}</div>
              </div>
              <div className="w-16 h-9 shrink-0"><Sparkline points={spark} positive={q.changePct >= 0} /></div>
              <div className="text-right shrink-0 w-20">
                <div className="text-sm font-mono text-ink-100">{q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className={`text-xs font-mono ${q.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>
                  {q.changePct >= 0 ? '+' : ''}{fmtPctRaw(q.changePct)}
                </div>
              </div>
              {volume && <div className="text-xs text-ink-500 w-16 text-right hidden sm:block">{fmtCompact(q.volume)}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
