import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtPct } from "../lib/format";

interface EarningsEntry {
  date: string;
  symbol: string;
  name: string;
  epsEstimate: number;
  epsActual: number;
}

function buildEarnings(): EarningsEntry[] {
  const out: EarningsEntry[] = [];
  const base = new Date("2025-01-15").getTime();
  const day = 24 * 60 * 60 * 1000;
  const picks = REAL_STOCKS.slice(0, 60).filter((_, i) => i % 3 === 0).slice(0, 20);
  for (let i = 0; i < picks.length; i++) {
    const meta = picks[i];
    const q = getQuote(meta.symbol);
    const est = q.pe > 0 ? q.price / q.pe : 1.5;
    const surprise = ((i * 7) % 20 - 10) / 100;
    const actual = est * (1 + surprise);
    out.push({
      date: new Date(base + i * 2 * day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      symbol: meta.symbol,
      name: meta.name,
      epsEstimate: est,
      epsActual: actual,
    });
  }
  return out;
}

export function EarningsCalendar({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice } = useCurrency();
  const rows = useMemo(() => buildEarnings(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <CalendarCheck className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Earnings Calendar</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{rows.length}</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Symbol</th>
              <th className="text-right p-4 font-medium">EPS Estimate</th>
              <th className="text-right p-4 font-medium">EPS Actual</th>
              <th className="text-right p-4 font-medium">Surprise</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const surprise = r.epsActual - r.epsEstimate;
              const surprisePct = (surprise / r.epsEstimate) * 100;
              const up = surprise >= 0;
              return (
                <tr
                  key={i}
                  onClick={() => onOpenStock(r.symbol)}
                  className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
                >
                  <td className="p-4 text-ink-300 whitespace-nowrap">{r.date}</td>
                  <td className="p-4">
                    <div className="text-ink-100 font-semibold">{r.symbol}</div>
                    <div className="text-sm text-ink-500 truncate max-w-[200px]">{r.name}</div>
                  </td>
                  <td className="p-4 text-right text-ink-200">{formatPrice(r.epsEstimate)}</td>
                  <td className="p-4 text-right text-ink-200">{formatPrice(r.epsActual)}</td>
                  <td className={`p-4 text-right font-medium ${up ? "text-bull" : "text-bear"}`}>
                    {fmtPct(surprisePct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
