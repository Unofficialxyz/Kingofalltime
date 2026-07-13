import { useMemo, useState } from 'react';
import { Plus, X, GitCompare } from 'lucide-react';
import { STOCK_UNIVERSE } from '../lib/universe';
import { getFundamentals, searchStocks, getCandles } from '../lib/dataService';
import { getLiveQuote, useLiveQuotes } from '../lib/liveFeed';
import { analyzeTechnicals } from '../lib/indicators';
import { fmtNum, fmtPct, fmtPctRaw, fmtCompact } from '../lib/format';
import type { StockMeta } from '../lib/types';

interface Props { onOpenStock: (s: string) => void; }

export function Compare({ onOpenStock }: Props) {
  useLiveQuotes();
  const [selected, setSelected] = useState<string[]>(['AAPL', 'MSFT', 'NVDA']);
  const [picker, setPicker] = useState('');
  const [results, setResults] = useState<StockMeta[]>([]);

  const rows = useMemo(() =>
    selected.map((sym) => {
      const meta = STOCK_UNIVERSE.find((s) => s.symbol === sym);
      const q = getLiveQuote(sym);
      const f = getFundamentals(sym);
      const tech = q ? analyzeTechnicals(getCandles(sym, '1Y')) : null;
      return { meta, q, f, tech };
    }).filter((r) => r.meta && r.q),
  [selected]);

  const add = (sym: string) => {
    if (!selected.includes(sym) && selected.length < 5) setSelected((s) => [...s, sym]);
    setPicker(''); setResults([]);
  };

  const metrics: { key: string; label: string; get: (r: typeof rows[0]) => string; tone?: (r: typeof rows[0]) => string }[] = [
    { key: 'price', label: 'Price', get: (r) => fmtNum(r.q!.price) },
    { key: 'chg', label: 'Day change %', get: (r) => `${r.q!.changePct >= 0 ? '+' : ''}${fmtPctRaw(r.q!.changePct)}`, tone: (r) => r.q!.changePct >= 0 ? 'text-bull' : 'text-bear' },
    { key: 'mcap', label: 'Market cap', get: (r) => `$${fmtCompact(r.q!.marketCap)}` },
    { key: 'pe', label: 'P/E', get: (r) => fmtNum(r.q!.pe) },
    { key: 'fwdpe', label: 'Fwd P/E', get: (r) => fmtNum(r.f!.forwardPe) },
    { key: 'peg', label: 'PEG', get: (r) => fmtNum(r.f!.peg) },
    { key: 'pb', label: 'P/B', get: (r) => fmtNum(r.f!.pb) },
    { key: 'roe', label: 'ROE', get: (r) => fmtPct(r.f!.roe) },
    { key: 'netmargin', label: 'Net margin', get: (r) => fmtPct(r.f!.netMargin) },
    { key: 'de', label: 'Debt/equity', get: (r) => fmtNum(r.f!.debtToEquity) },
    { key: 'revgrowth', label: 'Rev growth', get: (r) => fmtPct(r.f!.revenueGrowth), tone: (r) => r.f!.revenueGrowth >= 0 ? 'text-bull' : 'text-bear' },
    { key: 'div', label: 'Div yield', get: (r) => fmtPct(r.f!.dividendYield) },
    { key: 'beta', label: 'Beta', get: (r) => fmtNum(r.f!.beta) },
    { key: 'rsi', label: 'RSI', get: (r) => fmtNum(r.tech!.rsi) },
    { key: 'verdict', label: 'Tech verdict', get: (r) => r.tech!.verdict, tone: (r) => r.tech!.verdict.includes('Buy') ? 'text-bull' : r.tech!.verdict.includes('Sell') ? 'text-bear' : 'text-ink-300' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Compare</h1>
        <p className="text-ink-400 text-sm">Side-by-side metrics for up to 5 stocks.</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <GitCompare size={16} className="text-ink-400" />
          {selected.map((s) => (
            <span key={s} className="chip bg-white/5 text-ink-200">
              {s}
              <button onClick={() => setSelected((p) => p.filter((x) => x !== s))} className="ml-1 text-ink-500 hover:text-bear"><X size={12} /></button>
            </span>
          ))}
          {selected.length < 5 && (
            <div className="relative">
              <input
                value={picker}
                onChange={(e) => { setPicker(e.target.value); setResults(searchStocks(e.target.value).slice(0, 6)); }}
                placeholder="Add stock…"
                className="input py-1.5 text-sm w-40"
              />
              {results.length > 0 && picker && (
                <div className="absolute z-10 mt-1 w-56 card max-h-60 overflow-y-auto">
                  {results.map((r) => (
                    <button key={r.symbol} onClick={() => add(r.symbol)} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 text-sm">
                      <Plus size={12} className="text-brand-400" />
                      <span className="font-semibold text-ink-100">{r.symbol}</span>
                      <span className="text-ink-500 text-xs truncate">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs text-ink-500 font-medium">Metric</th>
                  {rows.map((r) => (
                    <th key={r.meta!.symbol} className="text-left px-4 py-3">
                      <button onClick={() => onOpenStock(r.meta!.symbol)} className="text-left">
                        <div className="font-bold text-ink-100">{r.meta!.symbol}</div>
                        <div className="text-xs text-ink-500 truncate max-w-[140px]">{r.meta!.name}</div>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.key} className="border-t border-white/[0.03]">
                    <td className="px-4 py-2.5 text-ink-400 text-xs">{m.label}</td>
                    {rows.map((r) => (
                      <td key={r.meta!.symbol} className={`px-4 py-2.5 font-mono ${m.tone ? m.tone(r) : 'text-ink-100'}`}>
                        {m.get(r)}
                      </td>
                    ))}
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
