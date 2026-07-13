import { useMemo } from "react";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { getLiveQuote } from "../lib/dataService";
import { useLiveQuotes } from "../lib/hooks";
import { fmtPctRaw, fmtCompact } from "../lib/format";

interface MarketMoversProps {
  onOpenStock: (s: string) => void;
}

type Tier = "Large Cap" | "Mid Cap" | "Small Cap";

interface MoverEntry {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  marketCap: number;
}

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function buildMovers(tier: Tier): { gainers: MoverEntry[]; losers: MoverEntry[] } {
  const capRanges: Record<Tier, [number, number]> = {
    "Large Cap": [2e11, 5e12],
    "Mid Cap": [5e9, 2e11],
    "Small Cap": [1e8, 5e9],
  };
  const [minCap, maxCap] = capRanges[tier];
  const gainers: MoverEntry[] = [];
  const losers: MoverEntry[] = [];

  for (let i = 0; i < 15; i++) {
    const meta = STOCK_UNIVERSE[(i * 137 + (tier === "Large Cap" ? 0 : tier === "Mid Cap" ? 100 : 200)) % STOCK_UNIVERSE.length];
    const quote = getLiveQuote(meta.symbol);
    const marketCap = minCap + seeded(i * 3 + 1) * (maxCap - minCap);
    const price = quote?.price ?? 50 + seeded(i * 5 + 2) * 950;
    const gainChange = 1 + seeded(i * 7 + 3) * 9;
    const lossChange = -(1 + seeded(i * 11 + 4) * 9);
    const volume = Math.floor(1e6 + seeded(i * 13 + 5) * 5e7);
    gainers.push({ symbol: meta.symbol, name: meta.name, price, changePct: gainChange, volume, marketCap });
    losers.push({ symbol: meta.symbol, name: meta.name, price: price * 0.98, changePct: lossChange, volume, marketCap });
  }

  gainers.sort((a, b) => b.changePct - a.changePct);
  losers.sort((a, b) => a.changePct - b.changePct);
  return { gainers: gainers.slice(0, 5), losers: losers.slice(0, 5) };
}

function MoverRow({ entry, isGainer, onOpenStock }: {
  entry: MoverEntry; isGainer: boolean; onOpenStock: (s: string) => void;
}) {
  return (
    <tr
      onClick={() => onOpenStock(entry.symbol)}
      className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition"
    >
      <td className="py-2 px-3">
        <div className="font-semibold text-ink-100">{entry.symbol}</div>
        <div className="text-xs text-ink-500 truncate max-w-[120px]">{entry.name}</div>
      </td>
      <td className="py-2 px-3 text-right font-mono text-ink-200">${fmtCompact(entry.price)}</td>
      <td className={`py-2 px-3 text-right font-mono ${isGainer ? "text-bull" : "text-bear"}`}>
        {isGainer ? "+" : ""}{fmtPctRaw(entry.changePct)}%
      </td>
      <td className="py-2 px-3 text-right font-mono text-ink-500 hidden sm:table-cell">{fmtCompact(entry.volume)}</td>
    </tr>
  );
}

function TierColumn({ tier, onOpenStock }: { tier: Tier; onOpenStock: (s: string) => void }) {
  const { gainers, losers } = useMemo(() => buildMovers(tier), [tier]);
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <h3 className="font-semibold text-ink-100">{tier}</h3>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/5">
        <div>
          <div className="px-3 py-2 bg-bull/5 flex items-center gap-1 text-xs text-bull">
            <TrendingUp size={12} /> Top Gainers
          </div>
          <table className="w-full text-sm">
            <tbody>
              {gainers.map((g, i) => <MoverRow key={i} entry={g} isGainer={true} onOpenStock={onOpenStock} />)}
            </tbody>
          </table>
        </div>
        <div>
          <div className="px-3 py-2 bg-bear/5 flex items-center gap-1 text-xs text-bear">
            <TrendingDown size={12} /> Top Losers
          </div>
          <table className="w-full text-sm">
            <tbody>
              {losers.map((l, i) => <MoverRow key={i} entry={l} isGainer={false} onOpenStock={onOpenStock} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function MarketMovers({ onOpenStock }: MarketMoversProps) {
  useLiveQuotes();

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <ArrowUp size={18} className="text-bull" />
        <ArrowDown size={18} className="text-bear" />
        <h2 className="text-lg font-semibold text-ink-100">Market Movers</h2>
        <span className="chip bg-ink-800 text-ink-400">By market cap tier</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TierColumn tier="Large Cap" onOpenStock={onOpenStock} />
        <TierColumn tier="Mid Cap" onOpenStock={onOpenStock} />
        <TierColumn tier="Small Cap" onOpenStock={onOpenStock} />
      </div>

      <div className="text-xs text-ink-500">
        Market cap tiers: Large ($200B+), Mid ($5B-$200B), Small ($100M-$5B). Click any row for details.
      </div>
    </div>
  );
}

export default MarketMovers;
