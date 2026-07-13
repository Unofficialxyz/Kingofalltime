import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Grid3x3 } from 'lucide-react';
import { STOCK_UNIVERSE, getMeta } from '../lib/universe';
import { getLiveQuote } from '../lib/dataService';
import { useLiveQuotes } from '../lib/hooks';
import { fmtPctRaw } from '../lib/format';
import type { Quote } from '../lib/types';

interface Props {
  onOpenStock: (s: string) => void;
}

interface Tile {
  symbol: string;
  name: string;
  changePct: number;
  price: number;
}

const TOP_COUNT = 200;

function heatColor(changePct: number): string {
  const abs = Math.min(Math.abs(changePct), 5);
  const intensity = abs / 5;
  if (changePct >= 0) {
    // Green: from light to dark
    const alpha = 0.15 + intensity * 0.85;
    return `rgba(16, 185, 129, ${alpha.toFixed(2)})`;
  } else {
    // Red: from light to dark
    const alpha = 0.15 + intensity * 0.85;
    return `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
  }
}

function textColor(changePct: number): string {
  const abs = Math.min(Math.abs(changePct), 5);
  return abs > 2.5 ? 'text-white' : 'text-ink-900';
}

export function Heatmap({ onOpenStock }: Props) {
  useLiveQuotes();

  const tiles = useMemo<Tile[]>(() => {
    // Get top 200 by market cap from the universe
    const withQuotes = STOCK_UNIVERSE.slice(0, 2000)
      .map((s) => {
        const q = getLiveQuote(s.symbol);
        if (!q) return null;
        return { meta: s, quote: q };
      })
      .filter((r): r is { meta: typeof STOCK_UNIVERSE[0]; quote: Quote } => r !== null)
      .sort((a, b) => b.quote.marketCap - a.quote.marketCap)
      .slice(0, TOP_COUNT)
      .map((r) => ({
        symbol: r.meta.symbol,
        name: r.meta.name,
        changePct: r.quote.changePct,
        price: r.quote.price,
      }));
    return withQuotes;
  }, []);

  const gainers = tiles.filter((t) => t.changePct > 0).length;
  const losers = tiles.filter((t) => t.changePct < 0).length;
  const flat = tiles.filter((t) => t.changePct === 0).length;
  const avgChange = tiles.length > 0
    ? tiles.reduce((a, t) => a + t.changePct, 0) / tiles.length
    : 0;
  const maxGainer = tiles.length > 0 ? [...tiles].sort((a, b) => b.changePct - a.changePct)[0] : null;
  const maxLoser = tiles.length > 0 ? [...tiles].sort((a, b) => a.changePct - b.changePct)[0] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-brand-500" />
          <h2 className="text-xl font-bold text-ink-900">Market Heatmap</h2>
          <span className="chip text-xs">Top {TOP_COUNT} by Market Cap</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-3">
          <div className="flex items-center gap-1.5 text-ink-500 text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-bull" /> Gainers
          </div>
          <p className="text-lg font-bold text-bull tabular-nums">{gainers}</p>
        </div>
        <div className="card p-3">
          <div className="flex items-center gap-1.5 text-ink-500 text-xs mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-bear" /> Losers
          </div>
          <p className="text-lg font-bold text-bear tabular-nums">{losers}</p>
        </div>
        <div className="card p-3">
          <div className="text-ink-500 text-xs mb-1">Avg Change</div>
          <p className={`text-lg font-bold tabular-nums ${avgChange >= 0 ? 'text-bull' : 'text-bear'}`}>
            {avgChange >= 0 ? '+' : ''}{fmtPctRaw(avgChange)}
          </p>
        </div>
        <div className="card p-3">
          <div className="text-ink-500 text-xs mb-1">Unchanged</div>
          <p className="text-lg font-bold text-ink-600 tabular-nums">{flat}</p>
        </div>
      </div>

      {/* Top mover highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {maxGainer && (
          <button
            className="card card-hover p-3 flex items-center justify-between text-left"
            onClick={() => onOpenStock(maxGainer.symbol)}
          >
            <div>
              <span className="text-xs text-ink-500">Top Gainer</span>
              <p className="font-bold text-ink-900">{maxGainer.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-bull font-semibold tabular-nums">+{fmtPctRaw(maxGainer.changePct)}</p>
            </div>
          </button>
        )}
        {maxLoser && (
          <button
            className="card card-hover p-3 flex items-center justify-between text-left"
            onClick={() => onOpenStock(maxLoser.symbol)}
          >
            <div>
              <span className="text-xs text-ink-500">Top Loser</span>
              <p className="font-bold text-ink-900">{maxLoser.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-bear font-semibold tabular-nums">{fmtPctRaw(maxLoser.changePct)}</p>
            </div>
          </button>
        )}
      </div>

      {/* Heatmap grid */}
      <div className="card p-3">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-14 gap-1.5">
          {tiles.map((tile) => (
            <button
              key={tile.symbol}
              className="aspect-square rounded-md flex flex-col items-center justify-center transition-transform hover:scale-105 hover:z-10 hover:ring-2 hover:ring-brand-400 cursor-pointer overflow-hidden"
              style={{ backgroundColor: heatColor(tile.changePct) }}
              onClick={() => onOpenStock(tile.symbol)}
              title={`${tile.name} (${tile.symbol})`}
            >
              <span className={`text-xs font-bold truncate px-1 ${textColor(tile.changePct)}`}>
                {tile.symbol}
              </span>
              <span className={`text-[10px] tabular-nums font-medium ${textColor(tile.changePct)}`}>
                {tile.changePct >= 0 ? '+' : ''}{fmtPctRaw(tile.changePct, 1)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-ink-500">
        <div className="flex items-center gap-2">
          <span>Loss</span>
          <div className="flex">
            <div className="w-6 h-3 rounded-l" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }} />
            <div className="w-6 h-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)' }} />
            <div className="w-6 h-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)' }} />
            <div className="w-6 h-3 rounded-r" style={{ backgroundColor: 'rgba(239, 68, 68, 1)' }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">
            <div className="w-6 h-3 rounded-l" style={{ backgroundColor: 'rgba(16, 185, 129, 1)' }} />
            <div className="w-6 h-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.7)' }} />
            <div className="w-6 h-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.4)' }} />
            <div className="w-6 h-3 rounded-r" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }} />
          </div>
          <span>Gain</span>
        </div>
      </div>
    </div>
  );
}
