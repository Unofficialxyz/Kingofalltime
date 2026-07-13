import { useMemo, useState } from 'react';
import { Briefcase, Trash2 } from 'lucide-react';
import { getLiveQuote, useLiveQuotes } from '../lib/liveFeed';
import { STOCK_UNIVERSE } from '../lib/universe';
import { fmtNum, fmtCompact, fmtPctRaw } from '../lib/format';
import type { Holding } from '../lib/hooks';

interface Props {
  items: Holding[];
  onRemove: (id: string) => void;
  onAdd: (h: Omit<Holding, 'id' | 'created_at'>) => void;
  loading: boolean;
  pendingSymbol: string | null;
  clearPending: () => void;
}

export function Portfolio({ items, onRemove, onAdd, loading, pendingSymbol, clearPending }: Props) {
  useLiveQuotes();
  const [symbol, setSymbol] = useState(pendingSymbol ?? '');
  const [quantity, setQuantity] = useState('10');
  const [avgPrice, setAvgPrice] = useState('');
  const [notes, setNotes] = useState('');

  if (pendingSymbol && symbol !== pendingSymbol) {
    setSymbol(pendingSymbol);
    const q = getLiveQuote(pendingSymbol);
    if (q) setAvgPrice(String(q.price));
  }

  const rows = useMemo(() =>
    items.map((h) => {
      const meta = STOCK_UNIVERSE.find((s) => s.symbol === h.symbol);
      const q = getLiveQuote(h.symbol);
      const cost = h.quantity * h.avg_price;
      const value = h.quantity * (q?.price ?? h.avg_price);
      const pnl = value - cost;
      const pnlPct = cost ? (pnl / cost) * 100 : 0;
      return { h, meta, q, cost, value, pnl, pnlPct };
    }).filter((r) => r.meta && r.q),
  [items]);

  const totals = useMemo(() => {
    const cost = rows.reduce((a, r) => a + r.cost, 0);
    const value = rows.reduce((a, r) => a + r.value, 0);
    const pnl = value - cost;
    return { cost, value, pnl, pnlPct: cost ? (pnl / cost) * 100 : 0 };
  }, [rows]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !quantity || !avgPrice) return;
    onAdd({ symbol, quantity: +quantity, avg_price: +avgPrice, bought_at: null, notes: notes || null });
    setSymbol(''); setQuantity('10'); setAvgPrice(''); setNotes('');
    clearPending();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink-50 flex items-center gap-2"><Briefcase size={20} className="text-brand-400" /> Portfolio</h1>
        <p className="text-ink-400 text-sm">Track holdings, cost basis and P&L.</p>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total value" value={`$${fmtCompact(totals.value)}`} />
          <Stat label="Total cost" value={`$${fmtCompact(totals.cost)}`} />
          <Stat label="Total P&L" value={`$${fmtCompact(totals.pnl)}`} tone={totals.pnl >= 0 ? 'bull' : 'bear'} />
          <Stat label="Return" value={`${totals.pnlPct >= 0 ? '+' : ''}${fmtPctRaw(totals.pnlPct)}`} tone={totals.pnlPct >= 0 ? 'bull' : 'bear'} />
        </div>
      )}

      <form onSubmit={submit} className="card p-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="sm:col-span-1">
          <label className="block text-xs text-ink-500 mb-1">Symbol</label>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" className="input" />
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1">Quantity</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1">Avg price</label>
          <input type="number" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} placeholder="0.00" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-500 mb-1">Notes (optional)</label>
          <div className="flex gap-2">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Long-term hold…" className="input" />
            <button type="submit" className="btn-primary shrink-0">Add</button>
          </div>
        </div>
      </form>

      {loading && <div className="card p-8 text-center text-ink-500 text-sm">Loading…</div>}

      {!loading && rows.length === 0 && (
        <div className="card p-10 text-center">
          <Briefcase size={28} className="mx-auto text-ink-600 mb-3" />
          <p className="text-ink-300">No holdings yet.</p>
          <p className="text-ink-500 text-sm mt-1">Add a position using the form above.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-500 text-xs">
                  <th className="text-left px-4 py-2 font-medium">Symbol</th>
                  <th className="text-right px-4 py-2 font-medium">Qty</th>
                  <th className="text-right px-4 py-2 font-medium hidden sm:table-cell">Avg cost</th>
                  <th className="text-right px-4 py-2 font-medium">Price</th>
                  <th className="text-right px-4 py-2 font-medium">Value</th>
                  <th className="text-right px-4 py-2 font-medium">P&L</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.h.id} className="border-t border-white/[0.03] hover:bg-white/[0.03] transition">
                    <td className="px-4 py-2.5 font-semibold text-ink-100">{r.h.symbol}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink-300">{r.h.quantity}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink-300 hidden sm:table-cell">{fmtNum(r.h.avg_price)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink-100">{fmtNum(r.q!.price)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink-100">${fmtCompact(r.value)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono ${r.pnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {r.pnl >= 0 ? '+' : ''}${fmtCompact(r.pnl)} ({r.pnlPct >= 0 ? '+' : ''}{fmtPctRaw(r.pnlPct)})
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => onRemove(r.h.id)} className="text-ink-500 hover:text-bear transition"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bull' | 'bear' }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`text-lg font-semibold font-mono mt-1 ${tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : 'text-ink-100'}`}>{value}</div>
    </div>
  );
}
