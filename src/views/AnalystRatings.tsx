import { useMemo } from "react";
import { Star } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";

interface RatingRow {
  symbol: string;
  name: string;
  buy: number;
  hold: number;
  sell: number;
  consensus: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  targetPrice: number;
  upside: number;
}

function buildRatings(): RatingRow[] {
  const picks = REAL_STOCKS.slice(0, 120).filter((_, i) => i % 5 === 0).slice(0, 20);
  const out: RatingRow[] = [];
  for (let i = 0; i < picks.length; i++) {
    const meta = picks[i];
    const q = getQuote(meta.symbol);
    const total = 30;
    const buy = 8 + (i % 18);
    const sell = 2 + ((i * 3) % 8);
    const hold = Math.max(0, total - buy - sell);
    const score = (buy - sell) / total;
    let consensus: RatingRow["consensus"];
    if (score > 0.6) consensus = "Strong Buy";
    else if (score > 0.2) consensus = "Buy";
    else if (score > -0.2) consensus = "Hold";
    else if (score > -0.6) consensus = "Sell";
    else consensus = "Strong Sell";
    const targetPrice = q.price * (1 + score * 0.3 + 0.05);
    const upside = ((targetPrice - q.price) / q.price) * 100;
    out.push({ symbol: meta.symbol, name: meta.name, buy, hold, sell, consensus, targetPrice, upside });
  }
  return out;
}

function consensusChip(c: RatingRow["consensus"]): string {
  if (c === "Strong Buy") return "bg-bull/15 text-bull";
  if (c === "Buy") return "bg-bull/10 text-bull-soft";
  if (c === "Hold") return "bg-ink-700/40 text-ink-300";
  if (c === "Sell") return "bg-bear/10 text-bear-soft";
  return "bg-bear/15 text-bear";
}

export function AnalystRatings({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice } = useCurrency();
  const rows = useMemo(() => buildRatings(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Star className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Analyst Ratings</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{rows.length}</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Symbol</th>
              <th className="text-right p-4 font-medium text-bull">Buy</th>
              <th className="text-right p-4 font-medium text-ink-300">Hold</th>
              <th className="text-right p-4 font-medium text-bear">Sell</th>
              <th className="text-left p-4 font-medium">Consensus</th>
              <th className="text-right p-4 font-medium">Target</th>
              <th className="text-right p-4 font-medium">Upside</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const up = r.upside >= 0;
              return (
                <tr
                  key={i}
                  onClick={() => onOpenStock(r.symbol)}
                  className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
                >
                  <td className="p-4">
                    <div className="text-ink-100 font-semibold">{r.symbol}</div>
                    <div className="text-sm text-ink-500 truncate max-w-[180px]">{r.name}</div>
                  </td>
                  <td className="p-4 text-right text-bull font-medium">{r.buy}</td>
                  <td className="p-4 text-right text-ink-300">{r.hold}</td>
                  <td className="p-4 text-right text-bear font-medium">{r.sell}</td>
                  <td className="p-4">
                    <span className={`chip ${consensusChip(r.consensus)}`}>{r.consensus}</span>
                  </td>
                  <td className="p-4 text-right text-ink-200">{formatPrice(r.targetPrice)}</td>
                  <td className={`p-4 text-right font-medium ${up ? "text-bull" : "text-bear"}`}>
                    {(up ? "+" : "") + r.upside.toFixed(1) + "%"}
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
