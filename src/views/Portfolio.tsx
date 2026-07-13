import { useMemo, useState, useEffect } from "react";
import { Wallet, X, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { getMeta } from "../lib/universe";
import { getLiveQuote } from "../lib/dataService";
import { useLiveQuotes } from "../lib/hooks";
import { useCurrency } from "../lib/currency";
import { fmtPctRaw, fmtNum } from "../lib/format";
import type { Holding } from "../lib/hooks";
import type { Quote } from "../lib/types";

interface PortfolioProps {
  items: Holding[];
  onRemove: (s: string) => void;
  onAdd: (h: Holding) => void;
  loading: boolean;
  pendingSymbol: string | null;
  clearPending: () => void;
}

export function Portfolio({ items, onRemove, onAdd, loading, pendingSymbol, clearPending }: PortfolioProps) {
  useLiveQuotes();
  const { formatPrice, formatCompact } = useCurrency();

  const [formSymbol, setFormSymbol] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [error, setError] = useState("");

  // Prefill from pendingSymbol
  useEffect(() => {
    if (pendingSymbol) {
      setFormSymbol(pendingSymbol);
      const q = getLiveQuote(pendingSymbol);
      if (q) setFormPrice(q.price.toFixed(2));
      clearPending();
    }
  }, [pendingSymbol, clearPending]);

  // Compute live data per holding
  const rows = useMemo(() => {
    return items.map((h) => {
      const meta = getMeta(h.symbol);
      const quote = getLiveQuote(h.symbol);
      const currentPrice = quote ? quote.price : 0;
      const totalValue = currentPrice * h.qty;
      const costBasis = h.avgPrice * h.qty;
      const pnl = totalValue - costBasis;
      const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      return { holding: h, meta, quote, currentPrice, totalValue, costBasis, pnl, pnlPct };
    });
  }, [items]);

  // Totals
  const totals = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    for (const r of rows) {
      totalValue += r.totalValue;
      totalCost += r.costBasis;
    }
    const totalPnl = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    return { totalValue, totalCost, totalPnl, totalPnlPct };
  }, [rows]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const sym = formSymbol.trim().toUpperCase();
    if (!sym) { setError("Enter a stock symbol."); return; }
    if (!getMeta(sym)) { setError("Stock not found in universe."); return; }
    const qty = parseFloat(formQty);
    if (!qty || qty <= 0) { setError("Enter a valid quantity."); return; }
    const price = parseFloat(formPrice);
    if (!price || price <= 0) { setError("Enter a valid average price."); return; }
    onAdd({ symbol: sym, qty, avgPrice: price });
    setFormSymbol("");
    setFormQty("");
    setFormPrice("");
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-brand-400" />
          <h2 className="text-lg font-semibold text-ink-100">Portfolio</h2>
        </div>
        <div className="card p-8 text-center text-ink-500">Loading portfolio...</div>
      </div>
    );
  }

  const totalPositive = totals.totalPnl >= 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wallet size={18} className="text-brand-400" />
        <h2 className="text-lg font-semibold text-ink-100">Portfolio</h2>
        {items.length > 0 ? <span className="chip bg-ink-800 text-ink-400">{items.length} holdings</span> : null}
      </div>

      {/* Summary cards */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wider text-ink-500 mb-1">Total Value</div>
            <div className="text-2xl font-mono font-bold text-ink-50">{formatCompact(totals.totalValue)}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wider text-ink-500 mb-1">Total Cost Basis</div>
            <div className="text-2xl font-mono font-bold text-ink-200">{formatCompact(totals.totalCost)}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wider text-ink-500 mb-1">Total P&amp;L</div>
            <div className={`text-2xl font-mono font-bold ${totalPositive ? "text-bull" : "text-bear"}`}>
              {totalPositive ? "+" : ""}{formatCompact(totals.totalPnl)}
            </div>
            <div className={`text-sm font-mono ${totalPositive ? "text-bull" : "text-bear"}`}>
              {totalPositive ? "+" : ""}{fmtPctRaw(totals.totalPnlPct)}%
            </div>
          </div>
        </div>
      ) : null}

      {/* Add form */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus size={16} className="text-brand-400" />
          <h3 className="text-sm font-semibold text-ink-100">Add Holding</h3>
        </div>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Symbol (e.g. AAPL)"
            value={formSymbol}
            onChange={(e) => setFormSymbol(e.target.value)}
            className="input"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={formQty}
            onChange={(e) => setFormQty(e.target.value)}
            className="input"
            min="0"
            step="any"
          />
          <input
            type="number"
            placeholder="Avg Price"
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
            className="input"
            min="0"
            step="any"
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} /> Add
          </button>
        </form>
        {error ? <p className="text-sm text-bear mt-2">{error}</p> : null}
      </div>

      {/* Holdings table */}
      {items.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-ink-900/50">
                  <th className="text-left py-3 px-4 font-medium text-ink-400">Symbol</th>
                  <th className="text-right py-3 px-4 font-medium text-ink-400">Qty</th>
                  <th className="text-right py-3 px-4 font-medium text-ink-400">Avg Price</th>
                  <th className="text-right py-3 px-4 font-medium text-ink-400">Current</th>
                  <th className="text-right py-3 px-4 font-medium text-ink-400">Total Value</th>
                  <th className="text-right py-3 px-4 font-medium text-ink-400">P&amp;L</th>
                  <th className="text-right py-3 px-4 font-medium text-ink-400">P&amp;L %</th>
                  <th className="text-right py-3 px-4 font-medium text-ink-400 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const positive = r.pnl >= 0;
                  return (
                    <tr
                      key={r.holding.symbol}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition"
                    >
                      <td className="py-3 px-4 font-semibold text-ink-100">{r.holding.symbol}</td>
                      <td className="py-3 px-4 text-right font-mono text-ink-300">{fmtNum(r.holding.qty, 0)}</td>
                      <td className="py-3 px-4 text-right font-mono text-ink-300">
                        {formatPrice(r.holding.avgPrice, r.meta?.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-ink-200">
                        {r.quote ? formatPrice(r.currentPrice, r.meta?.currency) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-ink-100">
                        {r.quote ? formatCompact(r.totalValue) : "—"}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono ${positive ? "text-bull" : "text-bear"}`}>
                        {positive ? "+" : ""}{formatCompact(r.pnl)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono ${positive ? "text-bull" : "text-bear"}`}>
                        {positive ? "+" : ""}{fmtPctRaw(r.pnlPct)}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onRemove(r.holding.symbol)}
                          className="text-ink-500 hover:text-bear transition p-1"
                          aria-label={"Remove " + r.holding.symbol}
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
      ) : (
        <div className="card p-12 text-center">
          <Wallet size={40} className="mx-auto text-ink-600 mb-3" />
          <p className="text-ink-400 mb-1">Your portfolio is empty.</p>
          <p className="text-sm text-ink-500">
            Add a holding above, or click the Portfolio button on any stock detail page.
          </p>
        </div>
      )}

      {/* Footer hint */}
      {items.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-ink-500">
          {totalPositive ? <TrendingUp size={14} className="text-bull" /> : <TrendingDown size={14} className="text-bear" />}
          <span>Live prices update every 5 seconds. P&amp;L is calculated against your average cost basis.</span>
        </div>
      ) : null}
    </div>
  );
}

export default Portfolio;
