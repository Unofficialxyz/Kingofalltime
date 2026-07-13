import { Star, TrendingUp, TrendingDown, X } from 'lucide-react';
import { getLiveQuote } from '../lib/dataService';
import { useLiveQuotes } from '../lib/hooks';
import { useCurrency } from '../lib/currency';
import { fmtPctRaw, fmtNum } from '../lib/format';
import { getCandles } from '../lib/dataService';
import { Sparkline } from '../components/Sparkline';
import { getMeta } from '../lib/universe';
import type { Quote } from '../lib/types';

interface Props {
  items: string[];
  onOpenStock: (s: string) => void;
  onRemove: (s: string) => void;
  loading: boolean;
}

interface WatchRow {
  symbol: string;
  name: string;
  quote: Quote;
  currency: string;
  spark: number[];
}

export function Watchlist({ items, onOpenStock, onRemove, loading }: Props) {
  useLiveQuotes();
  const { formatPrice, formatCompact } = useCurrency();

  const rows: WatchRow[] = items
    .map((sym) => {
      const meta = getMeta(sym);
      const quote = getLiveQuote(sym);
      if (!meta || !quote) return null;
      const candles = getCandles(sym, '1M');
      const spark = candles.map((c) => c.c);
      return { symbol: sym, name: meta.name, quote, currency: meta.currency, spark };
    })
    .filter((r): r is WatchRow => r !== null);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-accent-400" />
          <h2 className="text-xl font-bold text-ink-900">Watchlist</h2>
        </div>
        <div className="card p-12 text-center text-ink-400">Loading watchlist...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-accent-400" />
          <h2 className="text-xl font-bold text-ink-900">Watchlist</h2>
        </div>
        <div className="card p-12 text-center">
          <Star className="w-12 h-12 mx-auto text-ink-300 mb-4" />
          <p className="text-ink-400 text-lg mb-2">Your watchlist is empty</p>
          <p className="text-ink-500 text-sm">
            Search for stocks and click the star icon to add them to your watchlist.
            You will see live quotes and sparklines here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-accent-400 fill-accent-400" />
          <h2 className="text-xl font-bold text-ink-900">Watchlist</h2>
          <span className="chip text-xs">{items.length}</span>
        </div>
      </div>

      {/* Grid view */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {rows.map((row) => {
          const up = row.quote.changePct >= 0;
          return (
            <div
              key={row.symbol}
              className="card card-hover p-4 cursor-pointer"
              onClick={() => onOpenStock(row.symbol)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink-900">{row.symbol}</span>
                    <span className="text-xs text-ink-400">{row.currency}</span>
                  </div>
                  <p className="text-sm text-ink-500 truncate max-w-[180px]">{row.name}</p>
                </div>
                <button
                  className="text-ink-300 hover:text-bear transition-colors"
                  onClick={(e) => { e.stopPropagation(); onRemove(row.symbol); }}
                  title="Remove from watchlist"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-lg font-semibold tabular-nums text-ink-900">
                    {formatPrice(row.quote.price, row.currency)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${up ? 'text-bull' : 'text-bear'}`}>
                    {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {up ? '+' : ''}{fmtPctRaw(row.quote.changePct)}
                    <span className="text-ink-400 text-xs ml-1">
                      ({up ? '+' : ''}{formatPrice(row.quote.change, row.currency)})
                    </span>
                  </div>
                </div>
                <Sparkline points={row.spark} positive={up} width={100} height={36} />
              </div>

              <div className="mt-3 pt-3 border-t border-ink-100 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-ink-400">Mkt Cap</span>
                  <p className="text-ink-700 tabular-nums">{formatCompact(row.quote.marketCap, row.currency)}</p>
                </div>
                <div>
                  <span className="text-ink-400">P/E</span>
                  <p className="text-ink-700 tabular-nums">{row.quote.pe > 0 ? row.quote.pe.toFixed(1) : '—'}</p>
                </div>
                <div>
                  <span className="text-ink-400">Volume</span>
                  <p className="text-ink-700 tabular-nums">{formatCompact(row.quote.volume)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
