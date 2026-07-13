import { useState, useEffect, useMemo } from 'react';
import { Briefcase, TrendingUp, TrendingDown, X, Plus, Wallet } from 'lucide-react';
import { getLiveQuote } from '../lib/dataService';
import { useLiveQuotes } from '../lib/hooks';
import { useCurrency } from '../lib/currency';
import { fmtPctRaw, fmtNum } from '../lib/format';
import { getMeta } from '../lib/universe';

interface Props {
  items: { symbol: string; qty: number; avgPrice: number }[];
  onRemove: (s: string) => void;
  onAdd: (h: { symbol: string; qty: number; avgPrice: number }) => void;
  loading: boolean;
  pendingSymbol: string | null;
  clearPending: () => void;
}

interface HoldingRow {
  symbol: string;
  name: string;
  currency: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  cost: number;
  pnl: number;
  pnlPct: number;
  changePct: number;
}

export function Portfolio({ items, onRemove, onAdd, loading, pendingSymbol, clearPending }: Props) {
  useLiveQuotes();
  const { formatPrice, formatCompact } = useCurrency();

  const [formSymbol, setFormSymbol] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formAvgPrice, setFormAvgPrice] = useState('');

  // Prefill form when pendingSymbol is set
  useEffect(() => {
    if (pendingSymbol) {
      setFormSymbol(pendingSymbol);
      const q = getLiveQuote(pendingSymbol);
      if (q) setFormAvgPrice(q.price.toFixed(2));
      setFormQty('1');
      clearPending();
    }
  }, [pendingSymbol, clearPending]);

  const rows: HoldingRow[] = useMemo(() => {
    return items
      .map((h) => {
        const meta = getMeta(h.symbol);
        const quote = getLiveQuote(h.symbol);
        if (!meta || !quote) return null;
        const currentPrice = quote.price;
        const marketValue = currentPrice * h.qty;
        const cost = h.avgPrice * h.qty;
        const pnl = marketValue - cost;
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
        return {
          symbol: h.symbol,
          name: meta.name,
          currency: meta.currency,
          qty: h.qty,
          avgPrice: h.avgPrice,
          currentPrice,
          marketValue,
          cost,
          pnl,
          pnlPct,
          changePct: quote.changePct,
        };
      })
      .filter((r): r is HoldingRow => r !== null);
  }, [items]);

  const totalValue = rows.reduce((a, r) => a + r.marketValue, 0);
  const totalCost = rows.reduce((a, r) => a + r.cost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = formSymbol.trim().toUpperCase();
    const qty = parseFloat(formQty);
    const avgPrice = parseFloat(formAvgPrice);
    if (!sym || isNaN(qty) || qty <= 0 || isNaN(avgPrice) || avgPrice <= 0) return;
    onAdd({ symbol: sym, qty, avgPrice });
    setFormSymbol('');
    setFormQty('');
    setFormAvgPrice('');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-brand-500" />
          <h2 className="text-xl font-bold text-ink-900">Portfolio</h2>
        </div>
        <div className="card p-12 text-center text-ink-400">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-brand-500" />
        <h2 className="text-xl font-bold text-ink-900">Portfolio</h2>
        {rows.length > 0 && <span className="chip text-xs">{rows.length} holdings</span>}
      </div>

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-ink-500 text-sm mb-1">
              <Wallet className="w-4 h-4" /> Total Value
            </div>
            <p className="text-2xl font-bold tabular-nums text-ink-900">
              {formatPrice(totalValue)}
            </p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-ink-500 text-sm mb-1">
              <Briefcase className="w-4 h-4" /> Total Cost
            </div>
            <p className="text-2xl font-bold tabular-nums text-ink-700">
              {formatPrice(totalCost)}
            </p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-ink-500 text-sm mb-1">
              {totalPnl >= 0 ? <TrendingUp className="w-4 h-4 text-bull" /> : <TrendingDown className="w-4 h-4 text-bear" />}
              Total P&L
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold tabular-nums ${totalPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                {totalPnl >= 0 ? '+' : ''}{formatPrice(totalPnl)}
              </p>
              <span className={`text-sm font-medium ${totalPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                ({totalPnl >= 0 ? '+' : ''}{fmtPctRaw(totalPnlPct)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add holding form */}
      <form onSubmit={handleAdd} className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold text-ink-900 text-sm">Add Holding</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-ink-500 mb-1 block">Symbol</label>
            <input
              className="input text-sm"
              placeholder="AAPL"
              value={formSymbol}
              onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="text-xs text-ink-500 mb-1 block">Quantity</label>
            <input
              className="input text-sm"
              type="number"
              step="any"
              placeholder="100"
              value={formQty}
              onChange={(e) => setFormQty(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-ink-500 mb-1 block">Avg Price</label>
            <input
              className="input text-sm"
              type="number"
              step="any"
              placeholder="150.00"
              value={formAvgPrice}
              onChange={(e) => setFormAvgPrice(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary text-sm w-full flex items-center justify-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </form>

      {/* Holdings table */}
      {rows.length === 0 ? (
        <div className="card p-12 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-ink-300 mb-4" />
          <p className="text-ink-400 text-lg mb-2">No holdings yet</p>
          <p className="text-ink-500 text-sm">
            Add your first holding using the form above, or search for a stock and add it to your portfolio.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                  <th className="text-left px-3 py-2.5 font-medium">Symbol</th>
                  <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Name</th>
                  <th className="text-right px-3 py-2.5 font-medium">Qty</th>
                  <th className="text-right px-3 py-2.5 font-medium hidden lg:table-cell">Avg Price</th>
                  <th className="text-right px-3 py-2.5 font-medium">Cur Price</th>
                  <th className="text-right px-3 py-2.5 font-medium">Market Value</th>
                  <th className="text-right px-3 py-2.5 font-medium">P&L</th>
                  <th className="text-right px-3 py-2.5 font-medium hidden lg:table-cell">P&L %</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const up = row.pnl >= 0;
                  const dayUp = row.changePct >= 0;
                  return (
                    <tr key={row.symbol} className="border-b border-ink-100 hover:bg-ink-50">
                      <td className="px-3 py-2.5 font-semibold text-ink-900">{row.symbol}</td>
                      <td className="px-3 py-2.5 text-ink-600 hidden md:table-cell max-w-[180px] truncate">{row.name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-700">{fmtNum(row.qty, 0)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-600 hidden lg:table-cell">
                        {formatPrice(row.avgPrice, row.currency)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-900">
                        {formatPrice(row.currentPrice, row.currency)}
                        <span className={`ml-1 text-xs ${dayUp ? 'text-bull' : 'text-bear'}`}>
                          {dayUp ? '+' : ''}{fmtPctRaw(row.changePct)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-900 font-medium">
                        {formatPrice(row.marketValue, row.currency)}
                      </td>
                      <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${up ? 'text-bull' : 'text-bear'}`}>
                        {up ? '+' : ''}{formatPrice(row.pnl, row.currency)}
                      </td>
                      <td className={`px-3 py-2.5 text-right tabular-nums hidden lg:table-cell ${up ? 'text-bull' : 'text-bear'}`}>
                        {up ? '+' : ''}{fmtPctRaw(row.pnlPct)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          className="text-ink-300 hover:text-bear transition-colors"
                          onClick={() => onRemove(row.symbol)}
                          title="Remove holding"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-ink-200 bg-ink-50 font-semibold">
                    <td className="px-3 py-3 text-ink-900" colSpan={5}>Total</td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink-900">
                      {formatPrice(totalValue)}
                    </td>
                    <td className={`px-3 py-3 text-right tabular-nums ${totalPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {totalPnl >= 0 ? '+' : ''}{formatPrice(totalPnl)}
                    </td>
                    <td className={`px-3 py-3 text-right tabular-nums hidden lg:table-cell ${totalPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {totalPnl >= 0 ? '+' : ''}{fmtPctRaw(totalPnlPct)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
