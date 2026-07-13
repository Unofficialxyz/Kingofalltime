import { useMemo, useState } from "react";
import { Split, ArrowDown, ArrowUp, Filter } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { fmtNum, fmtDate } from "../lib/format";

interface StockSplitsProps {
  onOpenStock: (s: string) => void;
}

type ActionType = "Split" | "Buyback";

interface SplitEntry {
  id: number;
  symbol: string;
  name: string;
  type: ActionType;
  ratio: string;
  date: string;
  status: "Announced" | "Pending" | "Completed";
  oldValue: number;
  newValue: number;
}

const ENTRY_COUNT = 25;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const STATUSES: SplitEntry["status"][] = ["Announced", "Pending", "Completed"];

function buildEntries(): SplitEntry[] {
  const out: SplitEntry[] = [];
  const base = new Date("2025-07-01").getTime();
  for (let i = 0; i < ENTRY_COUNT; i++) {
    const meta = STOCK_UNIVERSE[(i * 131) % STOCK_UNIVERSE.length];
    const isSplit = i % 3 !== 0;
    const type: ActionType = isSplit ? "Split" : "Buyback";
    const splitNum = [2, 3, 4, 5, 10][Math.floor(seeded(i * 3 + 1) * 5)];
    const ratio = isSplit ? `1:${splitNum}` : `${fmtNum(1 + seeded(i * 5 + 2) * 4, 1)}% Buyback`;
    const oldValue = 50 + seeded(i * 7 + 3) * 950;
    const newValue = isSplit ? oldValue / splitNum : oldValue * (1 - seeded(i * 11 + 4) * 0.1);
    out.push({
      id: i,
      symbol: meta.symbol,
      name: meta.name,
      type,
      ratio,
      date: new Date(base + i * 86400000 * 4).toISOString().slice(0, 10),
      status: STATUSES[i % STATUSES.length],
      oldValue,
      newValue,
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function StockSplits({ onOpenStock }: StockSplitsProps) {
  const [filter, setFilter] = useState<"all" | ActionType>("all");
  const all = useMemo(buildEntries, []);
  const rows = useMemo(() => {
    if (filter === "all") return all;
    return all.filter((e) => e.type === filter);
  }, [all, filter]);

  const splits = all.filter((e) => e.type === "Split").length;
  const buybacks = all.filter((e) => e.type === "Buyback").length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Split size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Stock Splits & Buybacks</h2>
        <span className="chip bg-ink-800 text-ink-400">{all.length} events</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bull">
            <ArrowUp size={14} /> {splits} splits
          </span>
          <span className="flex items-center gap-1 text-brand-300">
            <ArrowDown size={14} /> {buybacks} buybacks
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter size={14} className="text-ink-500" />
        {(["all", "Split", "Buyback"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip transition ${filter === f ? "bg-brand-500 text-ink-50" : "bg-ink-800 text-ink-400 hover:text-ink-200"}`}
          >
            {f === "all" ? "All" : f + "s"}
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
                <th className="text-center py-3 px-4 font-medium text-ink-400">Type</th>
                <th className="text-center py-3 px-4 font-medium text-ink-400">Ratio</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400">Date</th>
                <th className="text-center py-3 px-4 font-medium text-ink-400">Status</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">Old Price</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">New Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => onOpenStock(e.symbol)}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition"
                >
                  <td className="py-3 px-4 font-semibold text-ink-100">{e.symbol}</td>
                  <td className="py-3 px-4 text-ink-400 hidden md:table-cell truncate max-w-[160px]">{e.name}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`chip text-xs ${e.type === "Split" ? "bg-bull/20 text-bull" : "bg-brand-500/20 text-brand-300"}`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-ink-200">{e.ratio}</td>
                  <td className="py-3 px-4 font-mono text-ink-300">{fmtDate(e.date)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`chip text-xs ${
                      e.status === "Completed" ? "bg-bull/20 text-bull" :
                      e.status === "Pending" ? "bg-accent-400/20 text-accent-400" :
                      "bg-ink-700 text-ink-300"
                    }`}>{e.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-ink-400 hidden sm:table-cell">${fmtNum(e.oldValue, 2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-ink-200 hidden sm:table-cell">${fmtNum(e.newValue, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-ink-500">
        Stock splits increase share count without changing market cap. Buybacks reduce shares, often boosting EPS.
      </div>
    </div>
  );
}

export default StockSplits;
