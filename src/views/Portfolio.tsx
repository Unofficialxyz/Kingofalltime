import { useState } from "react";
import { Plus, X, Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import type { Holding } from "../lib/hooks";
import { useLiveQuotes } from "../lib/hooks";
import { useCurrency } from "../lib/currency";
import { fmtPct, fmtCompact } from "../lib/format";
import type { Quote } from "../lib/types";

export function Portfolio({
  items,
  onRemove,
  onAdd,
  loading,
  pendingSymbol,
  clearPending,
}: {
  items: Holding[];
  onRemove: (s: string) => void;
  onAdd: (h: Holding) => void;
  loading: boolean;
  pendingSymbol: string | null;
  clearPending: () => void;
}) {
  const { formatPrice, formatCompact } = useCurrency();
  const symbols = items.map((h) => h.symbol);
  const { quotes } = useLiveQuotes(symbols);

  const [symbol, setSymbol] = useState(pendingSymbol ?? "");
  const [qty, setQty] = useState("");
  const [avgPrice, setAvgPrice] = useState("");

  if (pendingSymbol && pendingSymbol !== symbol) {
    setSymbol(pendingSymbol);
    clearPending();
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const sym = symbol.trim().toUpperCase();
    const q = parseFloat(qty);
    const p = parseFloat(avgPrice);
    if (!sym || !q || q <= 0 || !p || p <= 0) return;
    onAdd({ symbol: sym, qty: q, avgPrice: p });
    setSymbol("");
    setQty("");
    setAvgPrice("");
    clearPending();
  }

  const { totalValue, totalCost, totalPnl, totalPnlPct } = items.reduce(
    (acc, h) => {
      const q = quotes.get(h.symbol) as Quote | undefined;
      const price = q?.price ?? h.avgPrice;
      const value = price * h.qty;
      const cost = h.avgPrice * h.qty;
      acc.totalValue += value;
      acc.totalCost += cost;
      acc.totalPnl += value - cost;
      return acc;
    },
    { totalValue: 0, totalCost: 0, totalPnl: 0, totalPnlPct: 0 }
  );
  const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const pnlUp = totalPnl >= 0;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Briefcase className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Portfolio</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 animate-fade-in">
          <div className="text-sm text-ink-500 mb-1">Total Value</div>
          <div className="text-xl font-bold text-ink-100">{formatPrice(totalValue)}</div>
        </div>
        <div className="card p-4 animate-fade-in">
          <div className="text-sm text-ink-500 mb-1">Total P&L</div>
          <div className={`text-xl font-bold ${pnlUp ? "text-bull" : "text-bear"}`}>
            {pnlUp ? "+" : ""}{formatPrice(totalPnl)}
          </div>
        </div>
        <div className="card p-4 animate-fade-in">
          <div className="text-sm text-ink-500 mb-1">P&L %</div>
          <div className={`text-xl font-bold ${pnlUp ? "text-bull" : "text-bear"}`}>
            {fmtPct(pnlPct)}
          </div>
        </div>
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="card p-4 animate-fade-in">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-ink-100">Add Holding</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-ink-500">Symbol</label>
              <input
                type="text"
                placeholder="AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="input text-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-ink-500">Quantity</label>
              <input
                type="number"
                step="any"
                placeholder="10"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="input text-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-ink-500">Avg Price</label>
              <input
                type="number"
                step="any"
                placeholder="150.00"
                value={avgPrice}
                onChange={(e) => setAvgPrice(e.target.value)}
                className="input text-base"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full text-base">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        </div>
      </form>

      {loading && (
        <div className="card p-4 text-base text-ink-400 animate-fade-in">Loading quotes...</div>
      )}

      {/* Holdings */}
      {items.length === 0 && !loading ? (
        <div className="card p-12 text-center animate-fade-in">
          <Briefcase className="w-12 h-12 text-ink-600 mx-auto mb-3" />
          <p className="text-base text-ink-400">No holdings yet.</p>
          <p className="text-sm text-ink-500 mt-1">Add a stock above to start tracking your portfolio.</p>
        </div>
      ) : (
        <div className="card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-ink-900/80">
                  <th className="px-4 py-3 text-left text-base font-semibold text-ink-400">Symbol</th>
                  <th className="px-4 py-3 text-right text-base font-semibold text-ink-400">Qty</th>
                  <th className="px-4 py-3 text-right text-base font-semibold text-ink-400">Avg Price</th>
                  <th className="px-4 py-3 text-right text-base font-semibold text-ink-400">Current</th>
                  <th className="px-4 py-3 text-right text-base font-semibold text-ink-400">Value</th>
                  <th className="px-4 py-3 text-right text-base font-semibold text-ink-400">P&L</th>
                  <th className="px-4 py-3 text-right text-base font-semibold text-ink-400"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((h) => {
                  const q = quotes.get(h.symbol) as Quote | undefined;
                  const price = q?.price ?? h.avgPrice;
                  const value = price * h.qty;
                  const cost = h.avgPrice * h.qty;
                  const pnl = value - cost;
                  const pnlP = cost > 0 ? (pnl / cost) * 100 : 0;
                  const up = pnl >= 0;
                  return (
                    <tr key={h.symbol} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3">
                        <span className="text-base font-semibold text-ink-100">{h.symbol}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-base text-ink-300">{h.qty}</td>
                      <td className="px-4 py-3 text-right text-base text-ink-300">{formatPrice(h.avgPrice)}</td>
                      <td className="px-4 py-3 text-right text-base text-ink-100">{formatPrice(price)}</td>
                      <td className="px-4 py-3 text-right text-base text-ink-100">{formatPrice(value)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className={`flex flex-col items-end ${up ? "text-bull" : "text-bear"}`}>
                          <span className="text-base font-semibold">{up ? "+" : ""}{formatPrice(pnl)}</span>
                          <span className="text-sm">{fmtPct(pnlP)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onRemove(h.symbol)}
                          className="text-ink-500 hover:text-bear transition p-1.5 rounded-lg hover:bg-white/5"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
