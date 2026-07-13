import { useMemo } from 'react';
import { getLiveQuote, useLiveQuotes } from '../lib/liveFeed';
import { STOCK_UNIVERSE } from '../lib/universe';
import { fmtPctRaw } from '../lib/format';
import { Grid3x3 } from 'lucide-react';

interface Props { onOpenStock: (s: string) => void; }

export function Heatmap({ onOpenStock }: Props) {
  useLiveQuotes();


  const tiles = useMemo(() => {
    return STOCK_UNIVERSE.slice(0, 200).map((s) => {
      const q = getLiveQuote(s.symbol);
      if (!q) return null;
      return { meta: s, changePct: q.changePct, price: q.price, marketCap: q.marketCap };
    }).filter(Boolean) as { meta: typeof STOCK_UNIVERSE[0]; changePct: number; price: number; marketCap: number }[];
  }, []);

  const getColor = (pct: number) => {
    if (pct > 3) return 'bg-bull/80 hover:bg-bull';
    if (pct > 1) return 'bg-bull/60 hover:bg-bull/80';
    if (pct > 0.2) return 'bg-bull/30 hover:bg-bull/50';
    if (pct > -0.2) return 'bg-ink-700/60 hover:bg-ink-600';
    if (pct > -1) return 'bg-bear/30 hover:bg-bear/50';
    if (pct > -3) return 'bg-bear/60 hover:bg-bear/80';
    return 'bg-bear/80 hover:bg-bear';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink-50 flex items-center gap-2"><Grid3x3 size={20} className="text-brand-400" /> Market Heat Map</h1>
        <p className="text-ink-400 text-sm">Top 200 stocks by market cap, sized by performance. Green = gainers, red = losers.</p>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
        {tiles.map((t) => (
          <button
            key={t.meta.symbol}
            onClick={() => onOpenStock(t.meta.symbol)}
            className={`${getColor(t.changePct)} rounded-lg p-2 text-center transition group relative overflow-hidden`}
          >
            <div className="text-[10px] sm:text-xs font-bold text-ink-950 truncate">{t.meta.symbol}</div>
            <div className={`text-[10px] sm:text-xs font-mono ${t.changePct >= 0 ? 'text-ink-950' : 'text-ink-50'}`}>
              {t.changePct >= 0 ? '+' : ''}{fmtPctRaw(t.changePct)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
