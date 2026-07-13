import { useMemo, useState } from "react";
import { CalendarDays, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { fmtNum, fmtCompact } from "../lib/format";

interface EarningsCalendarProps {
  onOpenStock: (s: string) => void;
}

interface EarningEntry {
  id: number;
  symbol: string;
  name: string;
  date: string;
  epsEstimate: number;
  revEstimate: number;
  prevEps: number;
  time: "BMO" | "AMC";
}

const EARNINGS_COUNT = 30;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function buildEarnings(): EarningEntry[] {
  const out: EarningEntry[] = [];
  const base = new Date("2025-07-15").getTime();
  for (let i = 0; i < EARNINGS_COUNT; i++) {
    const meta = STOCK_UNIVERSE[(i * 53) % STOCK_UNIVERSE.length];
    const prevEps = seeded(i * 3 + 1) * 8 - 1;
    const epsEstimate = prevEps + (seeded(i * 5 + 2) - 0.45) * 2;
    out.push({
      id: i,
      symbol: meta.symbol,
      name: meta.name,
      date: new Date(base + i * 86400000 * 2).toISOString().slice(0, 10),
      epsEstimate,
      revEstimate: (50 + seeded(i * 7 + 4) * 9950) * 1e7,
      prevEps,
      time: i % 2 === 0 ? "BMO" : "AMC",
    });
  }
  return out;
}

export function EarningsCalendar({ onOpenStock }: EarningsCalendarProps) {
  const [filter, setFilter] = useState<"all" | "BMO" | "AMC">("all");
  const all = useMemo(buildEarnings, []);
  const rows = useMemo(() => {
    if (filter === "all") return all;
    return all.filter((e) => e.time === filter);
  }, [all, filter]);

  const beats = rows.filter((e) => e.epsEstimate > e.prevEps).length;
  const misses = rows.length - beats;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarDays size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Earnings Calendar</h2>
        <span className="chip bg-ink-800 text-ink-400">{all.length} entries</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bull">
            <TrendingUp size={14} /> {beats} expected beats
          </span>
          <span className="flex items-center gap-1 text-bear">
            <TrendingDown size={14} /> {misses} expected misses
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "BMO", "AMC"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip transition ${filter === f ? "bg-brand-500 text-ink-50" : "bg-ink-800 text-ink-400 hover:text-ink-200"}`}
          >
            {f === "all" ? "All" : f === "BMO" ? "Before Market" : "After Market"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-ink-900/50">
                <th className="text-left py-3 px-4 font-medium text-ink-400">Symbol</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden md:table-cell">Name</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400">Date</th>
                <th className="text-center py-3 px-4 font-medium text-ink-400">Time</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">EPS Est.</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">Prev EPS</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden lg:table-cell">Rev Est.</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">Surprise</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const surprise = e.epsEstimate - e.prevEps;
                const positive = surprise >= 0;
                return (
                  <tr
                    key={e.id}
                    onClick={() => onOpenStock(e.symbol)}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-semibold text-ink-100">{e.symbol}</td>
                    <td className="py-3 px-4 text-ink-400 hidden md:table-cell truncate max-w-[180px]">{e.name}</td>
                    <td className="py-3 px-4 font-mono text-ink-300">{e.date}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`chip text-xs ${e.time === "BMO" ? "bg-accent-400/20 text-accent-400" : "bg-brand-500/20 text-brand-300"}`}>
                        {e.time}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-200">${fmtNum(e.epsEstimate)}</td>
                    <td className="py-3 px-4 text-right font-mono text-ink-400 hidden sm:table-cell">${fmtNum(e.prevEps)}</td>
                    <td className="py-3 px-4 text-right font-mono text-ink-400 hidden lg:table-cell">{fmtCompact(e.revEstimate)}</td>
                    <td className={`py-3 px-4 text-right font-mono hidden sm:table-cell ${positive ? "text-bull" : "text-bear"}`}>
                      {positive ? "+" : ""}{fmtNum(surprise)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-500">
        <BarChart3 size={14} />
        <span>BMO = Before Market Open, AMC = After Market Close. Click any row for details.</span>
      </div>
    </div>
  );
}

export default EarningsCalendar;
