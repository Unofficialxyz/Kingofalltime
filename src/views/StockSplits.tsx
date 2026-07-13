import { useMemo } from "react";
import { SplitSquareHorizontal } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";

interface SplitEntry {
  date: string;
  symbol: string;
  name: string;
  ratio: string;
  type: "Split" | "Buyback";
  value: number;
}

function buildSplits(): SplitEntry[] {
  const out: SplitEntry[] = [];
  const base = new Date("2025-01-08").getTime();
  const day = 24 * 60 * 60 * 1000;
  const picks = REAL_STOCKS.slice(0, 60).filter((_, i) => i % 2 === 0).slice(0, 20);
  const splitRatios = ["2:1", "3:1", "3:2", "5:1", "4:1", "10:1"];
  for (let i = 0; i < picks.length; i++) {
    const meta = picks[i];
    const q = getQuote(meta.symbol);
    const isBuyback = i % 5 === 0;
    out.push({
      date: new Date(base + i * 2 * day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      symbol: meta.symbol,
      name: meta.name,
      ratio: isBuyback ? "N/A" : splitRatios[i % splitRatios.length],
      type: isBuyback ? "Buyback" : "Split",
      value: q.marketCap * (0.02 + (i % 4) * 0.01),
    });
  }
  return out;
}

export function StockSplits({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatCompact } = useCurrency();
  const rows = useMemo(() => buildSplits(), []);
  const splits = rows.filter((r) => r.type === "Split").length;
  const buybacks = rows.filter((r) => r.type === "Buyback").length;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <SplitSquareHorizontal className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Stock Splits & Buybacks</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{rows.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 animate-slide-up flex flex-col gap-1">
          <span className="text-base text-ink-400">Stock Splits</span>
          <span className="text-2xl font-bold text-brand-300">{splits}</span>
        </div>
        <div className="card p-4 animate-slide-up flex flex-col gap-1">
          <span className="text-base text-ink-400">Buybacks</span>
          <span className="text-2xl font-bold text-accent">{buybacks}</span>
        </div>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Symbol</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Ratio</th>
              <th className="text-left p-4 font-medium">Type</th>
              <th className="text-right p-4 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                onClick={() => onOpenStock(r.symbol)}
                className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
              >
                <td className="p-4 text-ink-300 whitespace-nowrap">{r.date}</td>
                <td className="p-4 text-ink-100 font-semibold">{r.symbol}</td>
                <td className="p-4 text-ink-300 truncate max-w-[200px]">{r.name}</td>
                <td className="p-4 text-ink-200">{r.ratio}</td>
                <td className="p-4">
                  <span className={`chip ${r.type === "Split" ? "bg-brand-500/15 text-brand-300" : "bg-accent/15 text-accent"}`}>
                    {r.type}
                  </span>
                </td>
                <td className="p-4 text-right text-ink-200">{formatCompact(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
