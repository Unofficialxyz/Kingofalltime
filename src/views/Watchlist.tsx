import { useMemo } from "react";
import { Star, X, Eye } from "lucide-react";
import { getMeta } from "../lib/universe";
import { getLiveQuote, getCandles } from "../lib/dataService";
import { useLiveQuotes } from "../lib/hooks";
import { useCurrency } from "../lib/currency";
import { fmtPctRaw } from "../lib/format";
import { Sparkline } from "../components/Sparkline";
import type { Quote } from "../lib/types";

interface WatchlistProps {
  items: string[];
  onOpenStock: (s: string) => void;
  onRemove: (s: string) => void;
  loading: boolean;
}

function sparkPointsFor(symbol: string): number[] {
  const candles = getCandles(symbol, "1W");
  if (!candles.length) return [];
  return candles.map((c) => c.c);
}

export function Watchlist({ items, onOpenStock, onRemove, loading }: WatchlistProps) {
  useLiveQuotes();
  const { formatPrice, formatCompact } = useCurrency();

  const rows = useMemo(() => {
    return items.map((symbol) => {
      const meta = getMeta(symbol);
      const quote = getLiveQuote(symbol);
      const points = sparkPointsFor(symbol);
      return { symbol, meta, quote, points };
    });
  }, [items]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} className="text-accent-400" />
          <h2 className="text-lg font-semibold text-ink-100">Watchlist</h2>
        </div>
        <div className="card p-8 text-center text-ink-500">Loading watchlist...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} className="text-accent-400" />
          <h2 className="text-lg font-semibold text-ink-100">Watchlist</h2>
        </div>
        <div className="card p-12 text-center">
          <Star size={40} className="mx-auto text-ink-600 mb-3" />
          <p className="text-ink-400 mb-1">Your watchlist is empty.</p>
          <p className="text-sm text-ink-500">
            Click the star icon on any stock detail page to add it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Star size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Watchlist</h2>
        <span className="chip bg-ink-800 text-ink-400">{items.length} stocks</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-ink-900/50">
                <th className="text-left py-3 px-4 font-medium text-ink-400">Symbol</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden md:table-cell">Name</th>
                <th className="text-center py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">7D Trend</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Price</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Change %</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden lg:table-cell">Volume</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const positive = r.quote ? r.quote.changePct >= 0 : true;
                return (
                  <tr
                    key={r.symbol}
                    onClick={() => onOpenStock(r.symbol)}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-semibold text-ink-100">{r.symbol}</td>
                    <td className="py-3 px-4 text-ink-400 hidden md:table-cell truncate max-w-[200px]">
                      {r.meta?.name ?? "—"}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="flex justify-center">
                        <Sparkline points={r.points} positive={positive} width={80} height={28} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-200">
                      {r.quote ? formatPrice(r.quote.price, r.meta?.currency) : "—"}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono ${positive ? "text-bull" : "text-bear"}`}>
                      {r.quote ? (positive ? "+" : "") + fmtPctRaw(r.quote.changePct) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-400 hidden lg:table-cell">
                      {r.quote ? formatCompact(r.quote.volume) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemove(r.symbol); }}
                        className="text-ink-500 hover:text-bear transition p-1"
                        aria-label={"Remove " + r.symbol + " from watchlist"}
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer hint */}
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Eye size={14} />
        <span>Live quotes update every 5 seconds. Click any row to view details.</span>
      </div>
    </div>
  );
}

export default Watchlist;
