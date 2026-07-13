import { useMemo } from "react";
import { X, Eye, Inbox } from "lucide-react";
import { useLiveQuotes } from "../lib/hooks";
import { useCurrency } from "../lib/currency";
import { getCandles } from "../lib/dataService";
import { Sparkline } from "../components/Sparkline";
import { fmtPct, fmtCompact } from "../lib/format";
import type { Quote } from "../lib/types";

export function Watchlist({
  items,
  onOpenStock,
  onRemove,
  loading,
}: {
  items: string[];
  onOpenStock: (s: string) => void;
  onRemove: (s: string) => void;
  loading: boolean;
}) {
  const { formatPrice, formatCompact } = useCurrency();
  const { quotes } = useLiveQuotes(items);

  const sparkData = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const sym of items) {
      const candles = getCandles(sym, "1W");
      map.set(sym, candles.map((c) => c.c));
    }
    return map;
  }, [items]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Eye className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Watchlist</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{items.length}</span>
      </div>

      {loading && (
        <div className="card p-4 text-base text-ink-400 animate-fade-in">Loading quotes...</div>
      )}

      {items.length === 0 && !loading ? (
        <div className="card p-12 text-center animate-fade-in">
          <Inbox className="w-12 h-12 text-ink-600 mx-auto mb-3" />
          <p className="text-base text-ink-400">Your watchlist is empty.</p>
          <p className="text-sm text-ink-500 mt-1">Add stocks from the search or detail pages to track them here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((sym) => {
            const q = quotes.get(sym) as Quote | undefined;
            if (!q) {
              return (
                <div key={sym} className="card p-4 animate-fade-in flex items-center justify-between">
                  <span className="text-base font-semibold text-ink-100">{sym}</span>
                  <span className="text-sm text-ink-500">Loading...</span>
                </div>
              );
            }
            const up = q.changePct >= 0;
            const color = up ? "#10b981" : "#ef4444";
            const data = sparkData.get(sym) ?? [];
            return (
              <div
                key={sym}
                className="card card-hover p-4 animate-slide-up flex items-center gap-4"
              >
                <button
                  onClick={() => onOpenStock(sym)}
                  className="flex items-center gap-4 flex-1 min-w-0 text-left"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-semibold text-ink-100">{sym}</span>
                    <span className="text-sm text-ink-500 truncate max-w-[180px]">{"Stock " + sym}</span>
                  </div>
                  <Sparkline data={data} width={100} height={32} color={color} />
                  <div className="flex flex-col items-end ml-auto">
                    <span className="text-base font-semibold text-ink-100">{formatPrice(q.price)}</span>
                    <span className={`text-base font-medium ${up ? "text-bull" : "text-bear"}`}>
                      {fmtPct(q.changePct)}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col items-end min-w-[100px]">
                    <span className="text-sm text-ink-500">Vol</span>
                    <span className="text-base text-ink-300">{fmtCompact(q.volume)}</span>
                  </div>
                  <div className="hidden md:flex flex-col items-end min-w-[120px]">
                    <span className="text-sm text-ink-500">Mkt Cap</span>
                    <span className="text-base text-ink-300">{formatCompact(q.marketCap)}</span>
                  </div>
                </button>
                <button
                  onClick={() => onRemove(sym)}
                  className="text-ink-500 hover:text-bear transition p-2 rounded-lg hover:bg-white/5"
                  title="Remove from watchlist"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
