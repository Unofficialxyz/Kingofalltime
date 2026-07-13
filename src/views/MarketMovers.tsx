import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtPct, fmtCompact } from "../lib/format";
import type { Quote } from "../lib/types";

type Tier = "Large Cap" | "Mid Cap" | "Small Cap";
type Direction = "Gainers" | "Losers";

const TIERS: Tier[] = ["Large Cap", "Mid Cap", "Small Cap"];

function getTierStocks(tier: Tier) {
  const top = REAL_STOCKS.slice(0, 300);
  const withQuotes = top.map((m) => ({ meta: m, q: getQuote(m.symbol) as Quote }));
  withQuotes.sort((a, b) => b.q.marketCap - a.q.marketCap);
  if (tier === "Large Cap") return withQuotes.slice(0, 100);
  if (tier === "Mid Cap") return withQuotes.slice(100, 200);
  return withQuotes.slice(200, 300);
}

export function MarketMovers({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice, formatCompact } = useCurrency();
  const [tier, setTier] = useState<Tier>("Large Cap");
  const [dir, setDir] = useState<Direction>("Gainers");

  const movers = useMemo(() => {
    const stocks = getTierStocks(tier);
    const sorted = [...stocks].sort((a, b) =>
      dir === "Gainers" ? b.q.changePct - a.q.changePct : a.q.changePct - b.q.changePct
    );
    return sorted.slice(0, 15);
  }, [tier, dir]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Market Movers</h1>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={`px-3 py-1.5 rounded-lg text-base font-medium transition border ${
                tier === t ? "tab-active" : "border-white/10 text-ink-400 hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["Gainers", "Losers"] as Direction[]).map((d) => (
            <button
              key={d}
              onClick={() => setDir(d)}
              className={`px-3 py-1.5 rounded-lg text-base font-medium transition border ${
                dir === d ? "tab-active" : "border-white/10 text-ink-400 hover:bg-white/5"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">#</th>
              <th className="text-left p-4 font-medium">Symbol</th>
              <th className="text-right p-4 font-medium">Price</th>
              <th className="text-right p-4 font-medium">Change</th>
              <th className="text-right p-4 font-medium">Volume</th>
              <th className="text-right p-4 font-medium">Mkt Cap</th>
            </tr>
          </thead>
          <tbody>
            {movers.map((m, i) => {
              const up = m.q.changePct >= 0;
              return (
                <tr
                  key={m.meta.symbol}
                  onClick={() => onOpenStock(m.meta.symbol)}
                  className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
                >
                  <td className="p-4 text-ink-500">{i + 1}</td>
                  <td className="p-4">
                    <div className="text-ink-100 font-semibold">{m.meta.symbol}</div>
                    <div className="text-sm text-ink-500 truncate max-w-[160px]">{m.meta.name}</div>
                  </td>
                  <td className="p-4 text-right text-ink-100">{formatPrice(m.q.price)}</td>
                  <td className={`p-4 text-right font-medium ${up ? "text-bull" : "text-bear"}`}>
                    {fmtPct(m.q.changePct)}
                  </td>
                  <td className="p-4 text-right text-ink-300">{fmtCompact(m.q.volume)}</td>
                  <td className="p-4 text-right text-ink-300">{formatCompact(m.q.marketCap)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
