import { useMemo, useState } from "react";
import { ArrowDownCircle, AlertTriangle, TrendingDown, Filter } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { fmtNum, fmtPctRaw } from "../lib/format";

interface ShortInterestProps {
  onOpenStock: (s: string) => void;
}

interface ShortData {
  id: number;
  symbol: string;
  name: string;
  shortInterest: number;
  shortPct: number;
  daysToCover: number;
  utilization: number;
  borrowFee: number;
  changePct: number;
}

const STOCK_COUNT = 30;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function buildShortData(): ShortData[] {
  const out: ShortData[] = [];
  for (let i = 0; i < STOCK_COUNT; i++) {
    const meta = STOCK_UNIVERSE[(i * 103) % STOCK_UNIVERSE.length];
    const shortPct = seeded(i * 3 + 1) * 25;
    const shortInterest = Math.floor(shortPct * 1e6 * (1 + seeded(i * 5 + 2) * 5));
    const daysToCover = 0.5 + seeded(i * 7 + 3) * 15;
    const utilization = 20 + seeded(i * 11 + 4) * 75;
    const borrowFee = 0.5 + seeded(i * 13 + 5) * 25;
    const changePct = (seeded(i * 17 + 6) - 0.45) * 8;
    out.push({
      id: i,
      symbol: meta.symbol,
      name: meta.name,
      shortInterest,
      shortPct,
      daysToCover,
      utilization,
      borrowFee,
      changePct,
    });
  }
  return out.sort((a, b) => b.shortPct - a.shortPct);
}

function riskLevel(d: ShortData): "High" | "Medium" | "Low" {
  if (d.shortPct > 15 || d.daysToCover > 8) return "High";
  if (d.shortPct > 8 || d.daysToCover > 4) return "Medium";
  return "Low";
}

function riskColor(r: "High" | "Medium" | "Low"): string {
  switch (r) {
    case "High": return "bg-bear/20 text-bear";
    case "Medium": return "bg-accent-400/20 text-accent-400";
    case "Low": return "bg-bull/20 text-bull";
  }
}

export function ShortInterest({ onOpenStock }: ShortInterestProps) {
  const [filter, setFilter] = useState<"all" | "High" | "Medium" | "Low">("all");
  const all = useMemo(buildShortData, []);
  const rows = useMemo(() => {
    if (filter === "all") return all;
    return all.filter((d) => riskLevel(d) === filter);
  }, [all, filter]);

  const highRisk = all.filter((d) => riskLevel(d) === "High").length;
  const avgShort = all.reduce((a, b) => a + b.shortPct, 0) / all.length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <ArrowDownCircle size={18} className="text-bear" />
        <h2 className="text-lg font-semibold text-ink-100">Short Interest</h2>
        <span className="chip bg-ink-800 text-ink-400">{all.length} stocks</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bear">
            <AlertTriangle size={14} /> {highRisk} high risk
          </span>
          <span className="flex items-center gap-1 text-ink-400">
            <TrendingDown size={14} /> Avg {fmtNum(avgShort, 1)}% short
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter size={14} className="text-ink-500" />
        {(["all", "High", "Medium", "Low"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip transition ${filter === f ? "bg-brand-500 text-ink-50" : "bg-ink-800 text-ink-400 hover:text-ink-200"}`}
          >
            {f === "all" ? "All" : f + " Risk"}
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
                <th className="text-right py-3 px-4 font-medium text-ink-400">Short %</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">Days to Cover</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden lg:table-cell">Utilization</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden lg:table-cell">Borrow Fee</th>
                <th className="text-center py-3 px-4 font-medium text-ink-400">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const risk = riskLevel(d);
                return (
                  <tr
                    key={d.id}
                    onClick={() => onOpenStock(d.symbol)}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-semibold text-ink-100">{d.symbol}</td>
                    <td className="py-3 px-4 text-ink-400 hidden md:table-cell truncate max-w-[160px]">{d.name}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono text-ink-200">{fmtNum(d.shortPct, 1)}%</div>
                      <div className="w-20 h-1 rounded-full bg-ink-800 overflow-hidden ml-auto mt-1">
                        <div
                          className="h-full rounded-full bg-bear"
                          style={{ width: Math.min(d.shortPct * 4, 100) + "%" }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-300 hidden sm:table-cell">
                      {fmtNum(d.daysToCover, 1)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-400 hidden lg:table-cell">
                      {fmtNum(d.utilization, 1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-400 hidden lg:table-cell">
                      {fmtNum(d.borrowFee, 2)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`chip text-xs ${riskColor(risk)}`}>{risk}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-ink-500">
        High short interest + high days to cover can lead to short squeeze. Borrow fee indicates cost of shorting.
      </div>
    </div>
  );
}

export default ShortInterest;
