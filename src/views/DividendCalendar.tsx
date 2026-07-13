import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";

interface DividendEntry {
  exDate: string;
  symbol: string;
  name: string;
  amount: number;
  frequency: string;
  yield: number;
}

function buildDividends(): DividendEntry[] {
  const picks = REAL_STOCKS.slice(0, 80).filter((_, i) => i % 3 === 0).slice(0, 20);
  const out: DividendEntry[] = [];
  const base = new Date("2025-01-12").getTime();
  const day = 24 * 60 * 60 * 1000;
  const freqs = ["Quarterly", "Quarterly", "Quarterly", "Monthly", "Semi-Annual", "Annual"];
  for (let i = 0; i < picks.length; i++) {
    const meta = picks[i];
    const q = getQuote(meta.symbol);
    const amount = q.price * (q.divYield / 100) / 4;
    if (q.divYield < 0.1) continue;
    out.push({
      exDate: new Date(base + i * 3 * day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      symbol: meta.symbol,
      name: meta.name,
      amount,
      frequency: freqs[i % freqs.length],
      yield: q.divYield,
    });
  }
  return out.sort((a, b) => b.yield - a.yield);
}

export function DividendCalendar({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice } = useCurrency();
  const rows = useMemo(() => buildDividends(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Dividend Calendar</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{rows.length}</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Ex-Date</th>
              <th className="text-left p-4 font-medium">Symbol</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-right p-4 font-medium">Amount</th>
              <th className="text-left p-4 font-medium">Frequency</th>
              <th className="text-right p-4 font-medium">Yield</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                onClick={() => onOpenStock(r.symbol)}
                className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
              >
                <td className="p-4 text-ink-300 whitespace-nowrap">{r.exDate}</td>
                <td className="p-4 text-ink-100 font-semibold">{r.symbol}</td>
                <td className="p-4 text-ink-300 truncate max-w-[200px]">{r.name}</td>
                <td className="p-4 text-right text-ink-100 font-medium">{formatPrice(r.amount)}</td>
                <td className="p-4">
                  <span className="chip bg-brand-500/10 text-brand-300">{r.frequency}</span>
                </td>
                <td className="p-4 text-right text-bull font-medium">{r.yield.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
