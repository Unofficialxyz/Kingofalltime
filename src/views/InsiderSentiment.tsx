import { useMemo } from "react";
import { Users, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { SECTORS, STOCK_UNIVERSE } from "../lib/universe";
import { fmtCompact, fmtNum } from "../lib/format";

interface InsiderSentimentProps {
  onOpenStock: (s: string) => void;
}

interface SectorSentiment {
  sector: string;
  buyValue: number;
  sellValue: number;
  netValue: number;
  buyCount: number;
  sellCount: number;
  sentiment: "Bullish" | "Bearish" | "Neutral";
}

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function buildSentiment(): SectorSentiment[] {
  return SECTORS.map((sector, si) => {
    const buyValue = (100 + seeded(si * 3 + 1) * 900) * 1e6;
    const sellValue = (50 + seeded(si * 5 + 2) * 850) * 1e6;
    const netValue = buyValue - sellValue;
    const buyCount = Math.floor(5 + seeded(si * 7 + 3) * 25);
    const sellCount = Math.floor(3 + seeded(si * 11 + 4) * 20);
    const ratio = buyValue / Math.max(sellValue, 1);
    const sentiment: SectorSentiment["sentiment"] = ratio > 1.3 ? "Bullish" : ratio < 0.8 ? "Bearish" : "Neutral";
    return { sector, buyValue, sellValue, netValue, buyCount, sellCount, sentiment };
  });
}

function sentColor(s: SectorSentiment["sentiment"]): string {
  switch (s) {
    case "Bullish": return "bg-bull/20 text-bull";
    case "Bearish": return "bg-bear/20 text-bear";
    case "Neutral": return "bg-ink-700 text-ink-300";
  }
}

export function InsiderSentiment({ onOpenStock }: InsiderSentimentProps) {
  const data = useMemo(buildSentiment, []);
  const totalBuy = data.reduce((a, b) => a + b.buyValue, 0);
  const totalSell = data.reduce((a, b) => a + b.sellValue, 0);
  const bullishCount = data.filter((d) => d.sentiment === "Bullish").length;
  const bearishCount = data.filter((d) => d.sentiment === "Bearish").length;

  // Pick a representative stock per sector
  const sectorStocks = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of STOCK_UNIVERSE) {
      if (!map[s.sector]) map[s.sector] = s.symbol;
    }
    return map;
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Users size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Insider Sentiment</h2>
        <span className="chip bg-ink-800 text-ink-400">{data.length} sectors</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bull">
            <TrendingUp size={14} /> {fmtCompact(totalBuy)} bought
          </span>
          <span className="flex items-center gap-1 text-bear">
            <TrendingDown size={14} /> {fmtCompact(totalSell)} sold
          </span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-ink-400">Overall Buy vs Sell Ratio</span>
          <span className={`font-mono text-sm ${totalBuy > totalSell ? "text-bull" : "text-bear"}`}>
            {fmtNum(totalBuy / Math.max(totalSell, 1), 2)}x
          </span>
        </div>
        <div className="h-4 rounded-full bg-ink-800 overflow-hidden flex">
          <div
            className="h-full bg-bull"
            style={{ width: (totalBuy / (totalBuy + totalSell)) * 100 + "%" }}
          />
          <div
            className="h-full bg-bear"
            style={{ width: (totalSell / (totalBuy + totalSell)) * 100 + "%" }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-bull">{bullishCount} bullish sectors</span>
          <span className="text-bear">{bearishCount} bearish sectors</span>
        </div>
      </div>

      {/* Sector grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.map((d) => {
          const ratio = d.buyValue / Math.max(d.sellValue, 1);
          return (
            <div
              key={d.sector}
              className="card card-hover p-4 cursor-pointer"
              onClick={() => sectorStocks[d.sector] && onOpenStock(sectorStocks[d.sector])}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-ink-100">{d.sector}</h3>
                <span className={`chip text-xs ${sentColor(d.sentiment)}`}>{d.sentiment}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <div className="text-xs text-ink-500">Buy Value</div>
                  <div className="font-mono text-bull">{fmtCompact(d.buyValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">Sell Value</div>
                  <div className="font-mono text-bear">{fmtCompact(d.sellValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">Buy Trades</div>
                  <div className="font-mono text-ink-300">{d.buyCount}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">Sell Trades</div>
                  <div className="font-mono text-ink-300">{d.sellCount}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-ink-600" />
                <div className="flex-1 h-1.5 rounded-full bg-ink-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-bull"
                    style={{ width: (d.buyValue / (d.buyValue + d.sellValue)) * 100 + "%" }}
                  />
                </div>
                <span className="text-xs font-mono text-ink-400">{fmtNum(ratio, 2)}x</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InsiderSentiment;
