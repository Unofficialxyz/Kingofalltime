import { useMemo } from "react";
import { ArrowDownCircle } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtCompact } from "../lib/format";

interface ShortInterestRow {
  symbol: string;
  name: string;
  shortInterest: number;
  daysToCover: number;
  pctFloat: number;
}

function buildRows(): ShortInterestRow[] {
  const picks = REAL_STOCKS.slice(0, 100).filter((_, i) => i % 4 === 0).slice(0, 20);
  const out: ShortInterestRow[] = [];
  for (let i = 0; i < picks.length; i++) {
    const meta = picks[i];
    const q = getQuote(meta.symbol);
    const si = Math.floor(q.volume * (0.02 + (i % 7) * 0.005));
    const avgDaily = q.volume * 0.8;
    const dtc = avgDaily > 0 ? si / avgDaily : 0;
    const pctFloat = 1.5 + (i % 10) * 0.8;
    out.push({
      symbol: meta.symbol,
      name: meta.name,
      shortInterest: si,
      daysToCover: dtc,
      pctFloat,
    });
  }
  return out.sort((a, b) => b.pctFloat - a.pctFloat);
}

export function ShortInterest({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatCompact } = useCurrency();
  const rows = useMemo(() => buildRows(), []);

  function siColor(pct: number): string {
    if (pct >= 8) return "bg-bear/15 text-bear";
    if (pct >= 4) return "bg-accent/15 text-accent";
    return "bg-bull/15 text-bull";
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <ArrowDownCircle className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Short Interest</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{rows.length}</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Symbol</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-right p-4 font-medium">Short Interest</th>
              <th className="text-right p-4 font-medium">Days to Cover</th>
              <th className="text-right p-4 font-medium">% Float</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                onClick={() => onOpenStock(r.symbol)}
                className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
              >
                <td className="p-4 text-ink-100 font-semibold">{r.symbol}</td>
                <td className="p-4 text-ink-300 truncate max-w-[200px]">{r.name}</td>
                <td className="p-4 text-right text-ink-200">{fmtCompact(r.shortInterest)}</td>
                <td className="p-4 text-right text-ink-200">{r.daysToCover.toFixed(1)}</td>
                <td className="p-4 text-right">
                  <span className={`chip ${siColor(r.pctFloat)}`}>{r.pctFloat.toFixed(1)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-base text-ink-500">
        High short interest (% float above 8%) may signal bearish sentiment or a potential short squeeze.
      </p>
    </div>
  );
}
