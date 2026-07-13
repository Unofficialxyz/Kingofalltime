import { useMemo, useState } from "react";
import { Search, X, Plus, GitCompare } from "lucide-react";
import { searchStocks, getMeta } from "../lib/universe";
import { getLiveQuote, getFundamentals } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtPctRaw, fmtNum } from "../lib/format";
import type { Quote, Fundamentals, StockMeta } from "../lib/types";

interface CompareProps {
  onOpenStock: (s: string) => void;
}

const MAX_COMPARE = 4;

type MetricRow = {
  label: string;
  extract: (q: Quote | null, f: Fundamentals | null, meta: StockMeta | undefined) => string;
  highlight?: (q: Quote | null, f: Fundamentals | null) => "bull" | "bear" | "none";
};

const METRICS: MetricRow[] = [
  {
    label: "Price",
    extract: (q, _f, meta) => (q ? formatPriceStatic(q.price, meta?.currency) : "—"),
  },
  {
    label: "Change %",
    extract: (q) => (q ? `${q.changePct >= 0 ? "+" : ""}${fmtPctRaw(q.changePct)}` : "—"),
    highlight: (q) => (!q ? "none" : q.changePct >= 0 ? "bull" : "bear"),
  },
  {
    label: "Market Cap",
    extract: (q, _f, meta) => (q ? formatCompactStatic(q.marketCap, meta?.currency) : "—"),
  },
  {
    label: "P/E Ratio",
    extract: (q) => (q && q.pe > 0 ? fmtNum(q.pe, 1) : "—"),
  },
  {
    label: "EPS",
    extract: (q) => (q ? fmtNum(q.eps, 2) : "—"),
  },
  {
    label: "Beta",
    extract: (q) => (q ? fmtNum(q.beta, 2) : "—"),
  },
  {
    label: "Dividend Yield",
    extract: (q) => (q && q.dividendYield > 0 ? `${fmtNum(q.dividendYield, 2)}%` : "—"),
  },
  {
    label: "ROE",
    extract: (_q, f) => (f ? `${fmtNum(f.roe, 1)}%` : "—"),
    highlight: (_q, f) => (!f ? "none" : f.roe >= 15 ? "bull" : f.roe < 5 ? "bear" : "none"),
  },
  {
    label: "Revenue Growth",
    extract: (_q, f) => (f ? `${fmtNum(f.revenueGrowth, 1)}%` : "—"),
    highlight: (_q, f) => (!f ? "none" : f.revenueGrowth >= 10 ? "bull" : f.revenueGrowth < 0 ? "bear" : "none"),
  },
  {
    label: "Debt / Equity",
    extract: (_q, f) => (f ? fmtNum(f.debtToEquity, 2) : "—"),
    highlight: (_q, f) => (!f ? "none" : f.debtToEquity > 2 ? "bear" : f.debtToEquity < 0.5 ? "bull" : "none"),
  },
  {
    label: "Net Margin",
    extract: (_q, f) => (f ? `${fmtNum(f.netMargin, 1)}%` : "—"),
    highlight: (_q, f) => (!f ? "none" : f.netMargin >= 15 ? "bull" : f.netMargin < 5 ? "bear" : "none"),
  },
  {
    label: "Sector",
    extract: (_q, _f, meta) => meta?.sector ?? "—",
  },
  {
    label: "Region",
    extract: (_q, _f, meta) => meta?.region ?? "—",
  },
];

// Static helpers (no hook needed)
function formatPriceStatic(value: number, currency?: string): string {
  if (currency === "INR") return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  if (currency === "JPY") return "¥" + value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  if (currency === "GBP") return "£" + value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
  if (currency === "EUR") return "€" + value.toLocaleString("de-DE", { maximumFractionDigits: 2 });
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatCompactStatic(value: number, currency?: string): string {
  const abs = Math.abs(value);
  let str: string;
  if (abs >= 1e12) str = (value / 1e12).toFixed(2) + "T";
  else if (abs >= 1e9) str = (value / 1e9).toFixed(2) + "B";
  else if (abs >= 1e6) str = (value / 1e6).toFixed(2) + "M";
  else if (abs >= 1e3) str = (value / 1e3).toFixed(1) + "K";
  else str = value.toFixed(0);
  const sym = currency === "INR" ? "₹" : currency === "JPY" ? "¥" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
  return sym + str;
}

export function Compare({ onOpenStock }: CompareProps) {
  const { formatPrice, formatCompact } = useCurrency();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchStocks(query, 10).filter((s) => !symbols.includes(s.symbol));
  }, [query, symbols]);

  function addSymbol(sym: string) {
    if (symbols.length >= MAX_COMPARE) return;
    if (symbols.includes(sym)) return;
    if (!getMeta(sym)) return;
    setSymbols((prev) => [...prev, sym]);
    setQuery("");
    setShowResults(false);
  }

  function removeSymbol(sym: string) {
    setSymbols((prev) => prev.filter((s) => s !== sym));
  }

  // Gather data for each symbol
  const compareData = useMemo(() => {
    return symbols.map((sym) => {
      const meta = getMeta(sym);
      const quote = getLiveQuote(sym);
      const fund = getFundamentals(sym);
      return { symbol: sym, meta, quote, fund };
    });
  }, [symbols]);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitCompare size={18} className="text-brand-400" />
        <h2 className="text-lg font-semibold text-ink-100">Compare Stocks</h2>
        <span className="chip bg-ink-800 text-ink-400">{symbols.length}/{MAX_COMPARE}</span>
      </div>

      {/* Search + add */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            placeholder="Search to add stocks to compare..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            className="input pl-9"
          />
          {showResults && searchResults.length > 0 ? (
            <div className="absolute top-full left-0 right-0 mt-1 card p-2 z-20 max-h-64 overflow-y-auto">
              {searchResults.map((s) => (
                <button
                  key={s.symbol}
                  onMouseDown={() => addSymbol(s.symbol)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-white/5 text-left transition"
                >
                  <Plus size={14} className="text-brand-400 shrink-0" />
                  <span className="font-semibold text-ink-100 text-sm">{s.symbol}</span>
                  <span className="text-ink-500 text-sm truncate">{s.name}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Selected chips */}
        {symbols.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {symbols.map((sym) => {
              const meta = getMeta(sym);
              return (
                <span key={sym} className="chip bg-ink-800 text-ink-200 flex items-center gap-1.5">
                  <button
                    onClick={() => removeSymbol(sym)}
                    className="text-ink-500 hover:text-bear transition"
                    aria-label={"Remove " + sym}
                  >
                    <X size={14} />
                  </button>
                  <span className="font-semibold">{sym}</span>
                  <span className="text-ink-500 hidden sm:inline">{meta?.name}</span>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Comparison table */}
      {compareData.length >= 2 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-ink-900/50">
                  <th className="text-left py-3 px-4 font-medium text-ink-400 w-40">Metric</th>
                  {compareData.map((c) => (
                    <th key={c.symbol} className="text-right py-3 px-4 font-medium">
                      <button
                        onClick={() => onOpenStock(c.symbol)}
                        className="text-ink-100 hover:text-brand-400 transition font-semibold"
                      >
                        {c.symbol}
                      </button>
                      <div className="text-xs text-ink-500 font-normal truncate max-w-[140px]">{c.meta?.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric, idx) => (
                  <tr key={metric.label} className={idx % 2 === 0 ? "bg-white/[0.02]" : ""}>
                    <td className="py-3 px-4 text-ink-400 font-medium">{metric.label}</td>
                    {compareData.map((c) => {
                      const value = metric.extract(c.quote, c.fund, c.meta);
                      const hl = metric.highlight ? metric.highlight(c.quote, c.fund) : "none";
                      const colorClass = hl === "bull" ? "text-bull" : hl === "bear" ? "text-bear" : "text-ink-200";
                      return (
                        <td key={c.symbol} className={`py-3 px-4 text-right font-mono ${colorClass}`}>
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <GitCompare size={40} className="mx-auto text-ink-600 mb-3" />
          <p className="text-ink-400">
            {symbols.length === 0
              ? "Search and add at least 2 stocks to start comparing."
              : "Add one more stock to start comparing."}
          </p>
        </div>
      )}
    </div>
  );
}

export default Compare;
