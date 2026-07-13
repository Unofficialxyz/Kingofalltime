import { useMemo, useState } from "react";
import { CalendarClock, DollarSign, Percent, Filter } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { fmtNum, fmtPctRaw, fmtDate } from "../lib/format";

interface DividendCalendarProps {
  onOpenStock: (s: string) => void;
}

interface DividendEntry {
  id: number;
  symbol: string;
  name: string;
  exDate: string;
  recordDate: string;
  payDate: string;
  amount: number;
  yield: number;
  frequency: "Quarterly" | "Monthly" | "Annual" | "Special";
}

const DIV_COUNT = 25;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const FREQUENCIES: DividendEntry["frequency"][] = ["Quarterly", "Monthly", "Annual", "Special"];

function buildDividends(): DividendEntry[] {
  const out: DividendEntry[] = [];
  const base = new Date("2025-07-15").getTime();
  for (let i = 0; i < DIV_COUNT; i++) {
    const meta = STOCK_UNIVERSE[(i * 127) % STOCK_UNIVERSE.length];
    const amount = 0.25 + seeded(i * 3 + 1) * 9.75;
    const yieldPct = seeded(i * 5 + 2) * 8;
    const exDate = new Date(base + i * 86400000 * 3).toISOString().slice(0, 10);
    const recordDate = new Date(base + i * 86400000 * 3 + 86400000).toISOString().slice(0, 10);
    const payDate = new Date(base + i * 86400000 * 3 + 86400000 * 15).toISOString().slice(0, 10);
    out.push({
      id: i,
      symbol: meta.symbol,
      name: meta.name,
      exDate,
      recordDate,
      payDate,
      amount,
      yield: yieldPct,
      frequency: FREQUENCIES[i % FREQUENCIES.length],
    });
  }
  return out.sort((a, b) => a.exDate.localeCompare(b.exDate));
}

export function DividendCalendar({ onOpenStock }: DividendCalendarProps) {
  const [filter, setFilter] = useState<"all" | DividendEntry["frequency"]>("all");
  const all = useMemo(buildDividends, []);
  const rows = useMemo(() => {
    if (filter === "all") return all;
    return all.filter((d) => d.frequency === filter);
  }, [all, filter]);

  const totalPayout = all.reduce((a, b) => a + b.amount, 0);
  const avgYield = all.reduce((a, b) => a + b.yield, 0) / all.length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarClock size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Dividend Calendar</h2>
        <span className="chip bg-ink-800 text-ink-400">{all.length} dividends</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bull">
            <DollarSign size={14} /> ${fmtNum(totalPayout, 2)} total
          </span>
          <span className="flex items-center gap-1 text-ink-400">
            <Percent size={14} /> Avg {fmtNum(avgYield, 2)}% yield
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter size={14} className="text-ink-500" />
        {(["all", "Quarterly", "Monthly", "Annual", "Special"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip transition text-xs ${filter === f ? "bg-brand-500 text-ink-50" : "bg-ink-800 text-ink-400 hover:text-ink-200"}`}
          >
            {f === "all" ? "All" : f}
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
                <th className="text-left py-3 px-4 font-medium text-ink-400">Ex-Date</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">Record Date</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden lg:table-cell">Pay Date</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Amount</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Yield</th>
                <th className="text-center py-3 px-4 font-medium text-ink-400">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => onOpenStock(d.symbol)}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition"
                >
                  <td className="py-3 px-4 font-semibold text-ink-100">{d.symbol}</td>
                  <td className="py-3 px-4 text-ink-400 hidden md:table-cell truncate max-w-[160px]">{d.name}</td>
                  <td className="py-3 px-4 font-mono text-ink-300">{fmtDate(d.exDate)}</td>
                  <td className="py-3 px-4 font-mono text-ink-500 hidden sm:table-cell">{fmtDate(d.recordDate)}</td>
                  <td className="py-3 px-4 font-mono text-ink-500 hidden lg:table-cell">{fmtDate(d.payDate)}</td>
                  <td className="py-3 px-4 text-right font-mono text-bull">${fmtNum(d.amount, 2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-ink-200">{fmtNum(d.yield, 2)}%</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`chip text-xs ${
                      d.frequency === "Special" ? "bg-accent-400/20 text-accent-400" :
                      d.frequency === "Monthly" ? "bg-brand-500/20 text-brand-300" :
                      "bg-ink-700 text-ink-300"
                    }`}>{d.frequency}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-ink-500">
        Ex-date is when stock starts trading without dividend. Must own before ex-date to receive payment.
      </div>
    </div>
  );
}

export default DividendCalendar;
