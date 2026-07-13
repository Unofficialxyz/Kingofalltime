import { useMemo } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { getCandles } from '../lib/dataService';
import { getLiveQuote, useLiveQuotes } from '../lib/liveFeed';
import { STOCK_UNIVERSE } from '../lib/universe';
import { fmtNum, fmtPctRaw, fmtCompact } from '../lib/format';
import { Sparkline } from '../components/Sparkline';
import type { WatchItem } from '../lib/hooks';

interface Props {
  items: WatchItem[];
  onOpenStock: (s: string) => void;
  onRemove: (s: string) => void;
  loading: boolean;
}

export function Watchlist({ items, onOpenStock, onRemove, loading }: Props) {
  useLiveQuotes();
  const rows = useMemo(() =>
    items.map((i) => {
      const meta = STOCK_UNIVERSE.find((s) => s.symbol === i.symbol);
      const q = getLiveQuote(i.symbol);
      const spark = getCandles(i.symbol, '1M').map((c) => c.c).filter((_, idx) => idx % 3 === 0).slice(-30);
      return { i, meta, q, spark };
    }).filter((r) => r.meta && r.q),
  [items]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink-50 flex items-center gap-2"><Star size={20} className="text-brand-400" /> Watchlist</h1>
        <p className="text-ink-400 text-sm">Tracked stocks, persisted across sessions.</p>
      </div>

      {loading && <div className="card p-8 text-center text-ink-500 text-sm">Loading…</div>}

      {!loading && rows.length === 0 && (
        <div className="card p-10 text-center">
          <Star size={28} className="mx-auto text-ink-600 mb-3" />
          <p className="text-ink-300">Your watchlist is empty.</p>
          <p className="text-ink-500 text-sm mt-1">Open any stock and tap the star to add it here.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-500 text-xs">
                  <th className="text-left px-4 py-2 font-medium">Symbol</th>
                  <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Name</th>
                  <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Trend</th>
                  <th className="text-right px-4 py-2 font-medium">Price</th>
                  <th className="text-right px-4 py-2 font-medium">Chg %</th>
                  <th className="text-right px-4 py-2 font-medium hidden lg:table-cell">Mkt cap</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.i.symbol} className="border-t border-white/[0.03] hover:bg-white/[0.03] transition">
                    <td className="px-4 py-2.5">
                      <button onClick={() => onOpenStock(r.i.symbol)} className="font-semibold text-ink-100">{r.i.symbol}</button>
                    </td>
                    <td className="px-4 py-2.5 text-ink-400 truncate max-w-[200px] hidden sm:table-cell">{r.meta!.name}</td>
                    <td className="px-4 py-2.5 hidden md:table-cell w-20"><div className="w-16 h-8"><Sparkline points={r.spark} positive={r.q!.changePct >= 0} /></div></td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink-100">{fmtNum(r.q!.price)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono ${r.q!.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>{r.q!.changePct >= 0 ? '+' : ''}{fmtPctRaw(r.q!.changePct)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink-400 hidden lg:table-cell">${fmtCompact(r.q!.marketCap)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => onRemove(r.i.symbol)} className="text-ink-500 hover:text-bear transition"><Trash2 size={15} /></button>
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
