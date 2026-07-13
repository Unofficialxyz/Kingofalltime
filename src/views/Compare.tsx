import { useState, useMemo } from 'react';
import { Search, X, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { STOCK_UNIVERSE, getMeta } from '../lib/universe';
import { getLiveQuote, getFundamentals } from '../lib/dataService';
import { useLiveQuotes } from '../lib/hooks';
import { useCurrency } from '../lib/currency';
import { fmtPctRaw, fmtNum } from '../lib/format';
import type { Quote, Fundamentals, StockMeta } from '../lib/types';

interface Props {
  onOpenStock: (s: string) => void;
}

interface CompareCol {
  meta: StockMeta;
  quote: Quote;
  fund: Fundamentals | null;
}

const METRICS: { key: string; label: string; render: (c: CompareCol, fmt: { formatPrice: (n: number, from?: string) => string; formatCompact: (n: number, from?: string) => string }) => React.ReactNode }[] = [
  { key: 'price', label: 'Price', render: (c, fmt) => fmt.formatPrice(c.quote.price, c.meta.currency) },
  { key: 'changePct', label: 'Change %', render: (c) => {
    const up = c.quote.changePct >= 0;
    return <span className={up ? 'text-bull font-medium' : 'text-bear font-medium'}>{up ? '+' : ''}{fmtPctRaw(c.quote.changePct)}</span>;
  }},
  { key: 'marketCap', label: 'Market Cap', render: (c, fmt) => fmt.formatCompact(c.quote.marketCap, c.meta.currency) },
  { key: 'pe', label: 'P/E', render: (c) => c.quote.pe > 0 ? c.quote.pe.toFixed(1) : '—' },
  { key: 'eps', label: 'EPS', render: (c) => c.quote.eps > 0 ? fmtNum(c.quote.eps) : '—' },
  { key: 'beta', label: 'Beta', render: (c) => c.quote.beta.toFixed(2) },
  { key: 'divYield', label: 'Div Yield', render: (c) => c.quote.dividendYield > 0 ? (c.quote.dividendYield * 100).toFixed(2) + '%' : '—' },
  { key: 'roe', label: 'ROE', render: (c) => c.fund ? (c.fund.roe * 100).toFixed(1) + '%' : '—' },
  { key: 'revGrowth', label: 'Rev Growth', render: (c) => c.fund ? (c.fund.revenueGrowth * 100).toFixed(1) + '%' : '—' },
  { key: 'de', label: 'Debt/Equity', render: (c) => c.fund ? c.fund.debtToEquity.toFixed(2) : '—' },
  { key: 'netMargin', label: 'Net Margin', render: (c) => c.fund ? (c.fund.netMargin * 100).toFixed(1) + '%' : '—' },
  { key: 'sector', label: 'Sector', render: (c) => c.meta.sector },
  { key: 'region', label: 'Region', render: (c) => c.meta.region },
];

export function Compare({ onOpenStock }: Props) {
  useLiveQuotes();
  const { formatPrice, formatCompact } = useCurrency();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const cols = useMemo<CompareCol[]>(() => {
    return symbols
      .map((sym) => {
        const meta = getMeta(sym);
        const quote = getLiveQuote(sym);
        if (!meta || !quote) return null;
        const fund = getFundamentals(sym);
        return { meta, quote, fund };
      })
      .filter((c): c is CompareCol => c !== null);
  }, [symbols]);

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return STOCK_UNIVERSE.filter((s) =>
      s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [search]);

  const addStock = (sym: string) => {
    if (symbols.length >= 4) return;
    if (symbols.includes(sym)) return;
    setSymbols((prev) => [...prev, sym]);
    setSearch('');
    setShowResults(false);
  };

  const removeStock = (sym: string) => {
    setSymbols((prev) => prev.filter((s) => s !== sym));
  };

  const fmt = { formatPrice, formatCompact };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-ink-900">Compare Stocks</h2>
        <p className="text-sm text-ink-500">
          Add 2–4 stocks to compare side-by-side. {symbols.length}/4 selected.
        </p>
      </div>

      {/* Search / Add */}
      <div className="card p-4">
        <div className="relative">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-ink-400" />
            <input
              className="input flex-1"
              placeholder="Search to add a stock to compare..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
            />
            {symbols.length < 4 && search && (
              <button className="btn-primary text-sm flex items-center gap-1" onClick={() => {
                const exact = STOCK_UNIVERSE.find((s) => s.symbol.toLowerCase() === search.trim().toLowerCase());
                if (exact) addStock(exact.symbol);
              }}>
                <Plus className="w-4 h-4" /> Add
              </button>
            )}
          </div>
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full card p-1 max-h-72 overflow-auto shadow-lg">
              {searchResults.map((s) => (
                <button
                  key={s.symbol}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-ink-50 text-left"
                  onClick={() => addStock(s.symbol)}
                  disabled={symbols.includes(s.symbol)}
                >
                  <div>
                    <span className="font-semibold text-ink-900 text-sm">{s.symbol}</span>
                    <span className="ml-2 text-sm text-ink-500">{s.name}</span>
                  </div>
                  <span className="text-xs text-ink-400">{s.region}</span>
                </button>
              ))}
            </div>
          )}
          {showResults && search && searchResults.length === 0 && (
            <div className="absolute z-10 mt-1 w-full card p-3 text-sm text-ink-400 shadow-lg">
              No stocks found matching "{search}"
            </div>
          )}
        </div>
      </div>

      {/* Selected chips */}
      {symbols.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {symbols.map((sym) => {
            const meta = getMeta(sym);
            return (
              <span key={sym} className="chip flex items-center gap-1.5 pr-1">
                <span className="font-semibold">{sym}</span>
                <span className="text-ink-400 text-xs">{meta?.region}</span>
                <button onClick={() => removeStock(sym)} className="ml-1 hover:text-bear">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Comparison table */}
      {cols.length >= 2 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50">
                  <th className="text-left px-3 py-3 font-medium text-ink-600 text-xs uppercase tracking-wide w-40">Metric</th>
                  {cols.map((c) => (
                    <th key={c.meta.symbol} className="text-left px-3 py-3 min-w-[160px]">
                      <button
                        className="text-left group"
                        onClick={() => onOpenStock(c.meta.symbol)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-ink-900 group-hover:text-brand-500">{c.meta.symbol}</span>
                          <X
                            className="w-3.5 h-3.5 text-ink-300 hover:text-bear cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); removeStock(c.meta.symbol); }}
                          />
                        </div>
                        <div className="text-xs text-ink-500 truncate max-w-[140px]">{c.meta.name}</div>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => {
                  // Find best value for highlighting (numeric metrics only)
                  const numericKeys = ['price', 'changePct', 'marketCap', 'pe', 'eps', 'roe', 'revGrowth', 'netMargin'];
                  let bestIdx = -1;
                  if (numericKeys.includes(m.key) && cols.length >= 2) {
                    const vals = cols.map((c) => {
                      switch (m.key) {
                        case 'price': return c.quote.price;
                        case 'changePct': return c.quote.changePct;
                        case 'marketCap': return c.quote.marketCap;
                        case 'pe': return c.quote.pe;
                        case 'eps': return c.quote.eps;
                        case 'roe': return c.fund?.roe ?? -Infinity;
                        case 'revGrowth': return c.fund?.revenueGrowth ?? -Infinity;
                        case 'netMargin': return c.fund?.netMargin ?? -Infinity;
                        default: return -Infinity;
                      }
                    });
                    // For P/E, lower is better; for others, higher is better
                    if (m.key === 'pe') {
                      bestIdx = vals.indexOf(Math.min(...vals.filter((v) => v > 0)));
                    } else {
                      bestIdx = vals.indexOf(Math.max(...vals));
                    }
                  }
                  return (
                    <tr key={m.key} className="border-b border-ink-100 hover:bg-ink-50/50">
                      <td className="px-3 py-2.5 font-medium text-ink-600 text-xs uppercase tracking-wide">{m.label}</td>
                      {cols.map((c, idx) => (
                        <td
                          key={c.meta.symbol}
                          className={`px-3 py-2.5 tabular-nums ${idx === bestIdx ? 'text-bull font-semibold' : 'text-ink-700'}`}
                        >
                          {m.render(c, fmt)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-ink-400 text-lg mb-2">No stocks to compare yet</p>
          <p className="text-ink-500 text-sm">Add at least 2 stocks using the search above to see a side-by-side comparison.</p>
        </div>
      )}
    </div>
  );
}
