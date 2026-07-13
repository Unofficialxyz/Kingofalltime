import { useMemo, useState } from "react";
import { Cpu } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtPct } from "../lib/format";
import type { StockMeta, Quote } from "../lib/types";

function aiScore(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) | 0;
  return 50 + (Math.abs(h) % 51);
}

interface AIEntry {
  meta: StockMeta;
  q: Quote;
  score: number;
}

export function AIStocks({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice } = useCurrency();
  const [page, setPage] = useState(0);
  const pageSize = 24;

  const aiStocks = useMemo<AIEntry[]>(() => {
    return REAL_STOCKS.filter((s) => s.isAI).map((meta) => {
      const q = getQuote(meta.symbol);
      return { meta, q, score: aiScore(meta.symbol) };
    });
  }, []);

  const totalPages = Math.ceil(aiStocks.length / pageSize);
  const pageStocks = useMemo(() => {
    const start = page * pageSize;
    return aiStocks.slice(start, start + pageSize);
  }, [aiStocks, page]);

  function scoreColor(score: number): string {
    if (score >= 85) return "bg-bull/15 text-bull";
    if (score >= 65) return "bg-brand-500/15 text-brand-300";
    return "bg-ink-700/40 text-ink-300";
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Cpu className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">AI Stocks</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{aiStocks.length} Companies</span>
      </div>

      <div className="card p-4 animate-fade-in">
        <p className="text-base text-ink-400">
          Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, aiStocks.length)} of {aiStocks.length} AI companies.
          AI Score is a proprietary rating from 50 to 100.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {pageStocks.map(({ meta, q, score }) => {
          const up = q.changePct >= 0;
          return (
            <button
              key={meta.symbol}
              onClick={() => onOpenStock(meta.symbol)}
              className="card card-hover p-4 animate-slide-up flex flex-col gap-2 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-ink-100 truncate">{meta.symbol}</span>
                <span className={`chip ${scoreColor(score)}`}>AI {score}</span>
              </div>
              <span className="text-sm text-ink-500 truncate">{meta.name}</span>
              <div className="flex items-end justify-between mt-1">
                <span className="text-lg font-bold text-ink-100">{formatPrice(q.price)}</span>
                <span className={`text-base font-medium ${up ? "text-bull" : "text-bear"}`}>
                  {fmtPct(q.changePct)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="chip bg-white/5 text-ink-400 text-sm">{meta.sector}</span>
                <span className="text-sm text-ink-500 ml-auto">{meta.region}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="btn-outline text-base disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-base text-ink-400">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className="btn-outline text-base disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
