import { useMemo } from "react";
import { UserCheck } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtCompact } from "../lib/format";

interface InsiderTrade {
  date: string;
  symbol: string;
  insider: string;
  type: "Buy" | "Sell";
  shares: number;
  value: number;
}

const INSIDERS = ["CEO John Smith", "CFO Mary Chen", "Director Raj Kumar", "VP Sarah Lee", "CTO Alan Park", "Director Emily Wong"];

function buildTrades(): InsiderTrade[] {
  const out: InsiderTrade[] = [];
  const base = new Date("2025-01-05").getTime();
  const day = 24 * 60 * 60 * 1000;
  const picks = REAL_STOCKS.slice(0, 40).filter((_, i) => i % 2 === 0).slice(0, 20);
  for (let i = 0; i < picks.length; i++) {
    const meta = picks[i];
    const q = getQuote(meta.symbol);
    const isBuy = i % 3 !== 0;
    const shares = Math.floor(1000 + (i * 543) % 50000);
    out.push({
      date: new Date(base + i * day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      symbol: meta.symbol,
      insider: INSIDERS[i % INSIDERS.length],
      type: isBuy ? "Buy" : "Sell",
      shares,
      value: shares * q.price,
    });
  }
  return out;
}

export function InsiderTrading({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatCompact } = useCurrency();
  const trades = useMemo(() => buildTrades(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <UserCheck className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Insider Trading</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{trades.length}</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Symbol</th>
              <th className="text-left p-4 font-medium">Insider</th>
              <th className="text-left p-4 font-medium">Type</th>
              <th className="text-right p-4 font-medium">Shares</th>
              <th className="text-right p-4 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr
                key={i}
                onClick={() => onOpenStock(t.symbol)}
                className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
              >
                <td className="p-4 text-ink-300 whitespace-nowrap">{t.date}</td>
                <td className="p-4 text-ink-100 font-semibold">{t.symbol}</td>
                <td className="p-4 text-ink-200">{t.insider}</td>
                <td className="p-4">
                  <span className={`chip ${t.type === "Buy" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>
                    {t.type}
                  </span>
                </td>
                <td className="p-4 text-right text-ink-200">{fmtCompact(t.shares)}</td>
                <td className="p-4 text-right text-ink-200">{formatCompact(t.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
