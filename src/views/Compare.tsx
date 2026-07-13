import { useMemo, useState } from "react";
import { Search, X, Plus, GitCompare } from "lucide-react";
import { searchStocks } from "../lib/universe";
import { getQuote, getFundamentals } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtPct, fmtCompact } from "../lib/format";
import type { Quote, Fundamentals, StockMeta } from "../lib/types";

interface Row {
  meta: StockMeta;
  q: Quote;
  f: Fundamentals;
}

const METRICS: { key: string; label: string; render: (r: Row, fmt: { formatPrice: (n: number) => string; formatCompact: (n: number) => string }) => React.ReactNode }[] = [
  { key: "price", label: "Price", render: (r, fmt) => fmt.formatPrice(r.q.price) },
  { key: "changePct", label: "Change %", render: (r) => <span className={r.q.changePct >= 0 ? "text-bull" : "text-bear"}>{fmtPct(r.q.changePct)}</span> },
  { key: "marketCap", label: "Market Cap", render: (r, fmt) => fmt.formatCompact(r.q.marketCap) },
  { key: "pe", label: "P/E Ratio", render: (r) => r.q.pe.toFixed(2) },
  { key: "pb", label: "P/B Ratio", render: (r) => r.q.pb.toFixed(2) },
  { key: "divYield", label: "Div Yield", render: (r) => r.q.divYield.toFixed(2) + "%" },
  { key: "beta", label: "Beta", render: (r) => r.q.beta.toFixed(2) },
  { key: "high52", label: "52w High", render: (r, fmt) => fmt.formatPrice(r.q.high52) },
  { key: "low52", label: "52w Low", render: (r, fmt) => fmt.formatPrice(r.q.low52) },
  { key: "volume", label: "Volume", render: (r) => fmtCompact(r.q.volume) },
  { key: "roe", label: "ROE", render: (r) => r.f.roe.toFixed(2) + "%" },
  { key: "debtToEquity", label: "Debt/Equity", render: (r) => r.f.debtToEquity.toFixed(2) },
  { key: "revenueGrowth", label: "Revenue Growth", render: (r) => <span className={r.f.revenueGrowth >= 0 ? "text-bull" : "text-bear"}>{r.f.revenueGrowth.toFixed(2)}%</span> },
];

export function Compare({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice, formatCompact } = useCurrency();
  const fmt = { formatPrice, formatCompact };
  const [symbols, setSymbols] = useState<string[]>(["AAPL", "MSFT", "GOOGL"]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchStocks(query, 8);
  }, [query]);

  const rows = useMemo<Row[]>(() => {
    return symbols.map((sym) => {
      const found = searchStocks(sym, 1)[0] ?? { symbol: sym, name: sym, exchange: "VIRTUAL" as const, region: "Virtual" as const, sector: "Technology" as const };
      return { meta: found, q: getQuote(sym), f: getFundamentals(sym) };
    });
  }, [symbols]);

  function addStock(sym: string) {
    if (symbols.length >= 4) return;
    if (symbols.includes(sym)) return;
    setSymbols((s) => [...s, sym]);
    setQuery("");
    setShowResults(false);
  }

  function removeStock(sym: string) {
    setSymbols((s) => s.filter((x) => x !== sym));
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <GitCompare className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Compare Stocks</h1>
      </div>

      {/* Search / Add */}
      <div className="card p-4 animate-fade-in">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-ink-500">Add stocks to compare (2-4)</label>
          <div className="relative">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-ink-500 shrink-0" />
              <input
                type="text"
                placeholder="Search symbol or name..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
                className="input flex-1 text-base"
              />
              <button
                onClick={() => { if (results[0]) addStock(results[0].symbol); }}
                disabled={!results[0] || symbols.length >= 4}
                className="btn-primary text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {showResults && query.trim() && results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full card p-1 max-h-64 overflow-y-auto scrollbar-thin">
                {results.map((r) => (
                  <button
                    key={r.symbol}
                    onClick={() => addStock(r.symbol)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition text-left"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-base font-semibold text-ink-100">{r.symbol}</span>
                      <span className="text-sm text-ink-500 truncate">{r.name}</span>
                    </div>
                    <span className="chip bg-brand-500/15 text-brand-300 text-sm">{r.sector}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-sm text-ink-500">{symbols.length} of 4 stocks added</span>
        </div>
      </div>

      {/* Comparison Table */}
      {rows.length < 2 ? (
        <div className="card p-12 text-center animate-fade-in">
          <GitCompare className="w-12 h-12 text-ink-600 mx-auto mb-3" />
          <p className="text-base text-ink-400">Add at least 2 stocks to start comparing.</p>
        </div>
      ) : (
        <div className="card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-ink-900/80">
                  <th className="px-4 py-3 text-left text-base font-semibold text-ink-400 sticky left-0 bg-ink-900/80 z-10">
                    Metric
                  </th>
                  {rows.map((r) => (
                    <th key={r.meta.symbol} className="px-4 py-3 min-w-[180px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => onOpenStock(r.meta.symbol)}
                            className="text-base font-bold text-ink-100 hover:text-brand-300 transition text-left"
                          >
                            {r.meta.symbol}
                          </button>
                          <button
                            onClick={() => removeStock(r.meta.symbol)}
                            className="text-ink-500 hover:text-bear transition"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-sm text-ink-500 truncate">{r.meta.name}</span>
                        <span className="chip bg-brand-500/10 text-brand-300 text-sm w-fit">{r.meta.sector}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => {
                  const values = rows.map((r) => {
                    const v = m.render(r, fmt);
                    return typeof v === "number" ? String(v) : v;
                  });
                  const numericVals = rows.map((r) => {
                    if (m.key === "price") return r.q.price;
                    if (m.key === "changePct") return r.q.changePct;
                    if (m.key === "marketCap") return r.q.marketCap;
                    if (m.key === "pe") return r.q.pe;
                    if (m.key === "pb") return r.q.pb;
                    if (m.key === "divYield") return r.q.divYield;
                    if (m.key === "beta") return r.q.beta;
                    if (m.key === "high52") return r.q.high52;
                    if (m.key === "low52") return r.q.low52;
                    if (m.key === "volume") return r.q.volume;
                    if (m.key === "roe") return r.f.roe;
                    if (m.key === "debtToEquity") return r.f.debtToEquity;
                    if (m.key === "revenueGrowth") return r.f.revenueGrowth;
                    return 0;
                  });
                  const bestIdx = m.key === "low52" || m.key === "debtToEquity"
                    ? numericVals.indexOf(Math.min(...numericVals))
                    : numericVals.indexOf(Math.max(...numericVals));
                  return (
                    <tr key={m.key} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-base font-medium text-ink-300 sticky left-0 bg-ink-900/60 backdrop-blur-sm">
                        {m.label}
                      </td>
                      {rows.map((r, i) => (
                        <td
                          key={r.meta.symbol}
                          className={`px-4 py-3 text-base ${i === bestIdx ? "text-bull font-semibold" : "text-ink-200"}`}
                        >
                          {values[i]}
                        </td>
                      ))}
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
