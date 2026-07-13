import { useMemo, useState } from "react";
import { Star, ThumbsUp, ThumbsDown, Minus, Award } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { fmtNum, fmtPct } from "../lib/format";

interface AnalystRatingsProps {
  onOpenStock: (s: string) => void;
}

interface Rating {
  id: number;
  symbol: string;
  name: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  targetPrice: number;
  currentPrice: number;
  upside: number;
}

const STOCK_COUNT = 20;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function buildRatings(): Rating[] {
  const out: Rating[] = [];
  for (let i = 0; i < STOCK_COUNT; i++) {
    const meta = STOCK_UNIVERSE[(i * 113) % STOCK_UNIVERSE.length];
    const total = 10 + Math.floor(seeded(i * 3 + 1) * 30);
    const strongBuy = Math.floor(seeded(i * 5 + 2) * total * 0.4);
    const buy = Math.floor(seeded(i * 7 + 3) * (total - strongBuy) * 0.5);
    const hold = Math.floor(seeded(i * 11 + 4) * (total - strongBuy - buy) * 0.6);
    const sell = Math.floor(seeded(i * 13 + 5) * Math.max(total - strongBuy - buy - hold, 1) * 0.5);
    const strongSell = Math.max(0, total - strongBuy - buy - hold - sell);
    const score = (strongBuy * 2 + buy - hold - sell - strongSell * 2) / total;
    let consensus: Rating["consensus"];
    if (score > 1) consensus = "Strong Buy";
    else if (score > 0.3) consensus = "Buy";
    else if (score > -0.3) consensus = "Hold";
    else if (score > -1) consensus = "Sell";
    else consensus = "Strong Sell";
    const currentPrice = 50 + seeded(i * 17 + 6) * 950;
    const targetPrice = currentPrice * (1 + (score / 2) * 0.3 + (seeded(i * 19 + 7) - 0.5) * 0.1);
    const upside = (targetPrice - currentPrice) / currentPrice;
    out.push({
      id: i, symbol: meta.symbol, name: meta.name,
      strongBuy, buy, hold, sell, strongSell, consensus,
      targetPrice, currentPrice, upside,
    });
  }
  return out.sort((a, b) => b.strongBuy + b.buy - a.strongBuy - a.buy);
}

function consensusColor(c: Rating["consensus"]): string {
  switch (c) {
    case "Strong Buy": return "bg-bull/20 text-bull";
    case "Buy": return "bg-bull/10 text-bull";
    case "Hold": return "bg-accent-400/20 text-accent-400";
    case "Sell": return "bg-bear/10 text-bear";
    case "Strong Sell": return "bg-bear/20 text-bear";
  }
}

export function AnalystRatings({ onOpenStock }: AnalystRatingsProps) {
  const [filter, setFilter] = useState<"all" | "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell">("all");
  const all = useMemo(buildRatings, []);
  const rows = useMemo(() => {
    if (filter === "all") return all;
    return all.filter((r) => r.consensus === filter);
  }, [all, filter]);

  const strongBuys = all.filter((r) => r.consensus === "Strong Buy").length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Star size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Analyst Ratings</h2>
        <span className="chip bg-ink-800 text-ink-400">{all.length} stocks</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bull">
            <Award size={14} /> {strongBuys} strong buys
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip transition text-xs ${filter === f ? "bg-brand-500 text-ink-50" : "bg-ink-800 text-ink-400 hover:text-ink-200"}`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
          const positive = r.upside >= 0;
          return (
            <div
              key={r.id}
              className="card card-hover p-4 cursor-pointer"
              onClick={() => onOpenStock(r.symbol)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-ink-100">{r.symbol}</div>
                  <div className="text-xs text-ink-500 truncate max-w-[160px]">{r.name}</div>
                </div>
                <span className={`chip text-xs ${consensusColor(r.consensus)}`}>{r.consensus}</span>
              </div>

              {/* Rating bar */}
              <div className="flex h-2 rounded-full overflow-hidden mb-3">
                <div className="bg-bull" style={{ width: (r.strongBuy / total) * 100 + "%" }} />
                <div className="bg-bull/50" style={{ width: (r.buy / total) * 100 + "%" }} />
                <div className="bg-accent-400" style={{ width: (r.hold / total) * 100 + "%" }} />
                <div className="bg-bear/50" style={{ width: (r.sell / total) * 100 + "%" }} />
                <div className="bg-bear" style={{ width: (r.strongSell / total) * 100 + "%" }} />
              </div>

              {/* Rating counts */}
              <div className="grid grid-cols-5 gap-1 text-center text-xs mb-3">
                <div>
                  <div className="text-bull font-mono">{r.strongBuy}</div>
                  <div className="text-ink-600 flex justify-center"><ThumbsUp size={10} /></div>
                </div>
                <div>
                  <div className="text-bull/70 font-mono">{r.buy}</div>
                  <div className="text-ink-600 flex justify-center"><ThumbsUp size={10} /></div>
                </div>
                <div>
                  <div className="text-accent-400 font-mono">{r.hold}</div>
                  <div className="text-ink-600 flex justify-center"><Minus size={10} /></div>
                </div>
                <div>
                  <div className="text-bear/70 font-mono">{r.sell}</div>
                  <div className="text-ink-600 flex justify-center"><ThumbsDown size={10} /></div>
                </div>
                <div>
                  <div className="text-bear font-mono">{r.strongSell}</div>
                  <div className="text-ink-600 flex justify-center"><ThumbsDown size={10} /></div>
                </div>
              </div>

              {/* Target price */}
              <div className="flex items-center justify-between text-sm border-t border-white/5 pt-2">
                <div>
                  <div className="text-xs text-ink-500">Target</div>
                  <div className="font-mono text-ink-200">${fmtNum(r.targetPrice)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">Current</div>
                  <div className="font-mono text-ink-200">${fmtNum(r.currentPrice)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">Upside</div>
                  <div className={`font-mono ${positive ? "text-bull" : "text-bear"}`}>
                    {positive ? "+" : ""}{fmtPct(r.upside)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AnalystRatings;
