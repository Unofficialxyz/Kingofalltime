import { useMemo } from "react";
import { Grid3x3 } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import type { Quote } from "../lib/types";

export function Heatmap({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const tiles = useMemo(() => {
    const top = REAL_STOCKS.slice(0, 200);
    return top.map((meta) => {
      const q: Quote = getQuote(meta.symbol);
      return { meta, q };
    });
  }, []);

  function tileColor(changePct: number): string {
    const abs = Math.min(Math.abs(changePct), 5) / 5;
    if (changePct >= 0) {
      const alpha = 0.15 + abs * 0.7;
      return `rgba(16, 185, 129, ${alpha.toFixed(2)})`;
    }
    const alpha = 0.15 + abs * 0.7;
    return `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
  }

  function textColor(changePct: number): string {
    const abs = Math.min(Math.abs(changePct), 5) / 5;
    return abs > 0.5 ? "#ffffff" : "#e2e8f0";
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Grid3x3 className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Market Heatmap</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">Top 200</span>
      </div>

      <div className="flex items-center gap-4 text-sm text-ink-500">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded" style={{ background: "rgba(239, 68, 68, 0.7)" }} />
          <span className="text-base">Losers</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded" style={{ background: "rgba(16, 185, 129, 0.7)" }} />
          <span className="text-base">Gainers</span>
        </div>
        <span className="text-base text-ink-500 ml-auto">Tile size reflects market cap. Color intensity reflects change %.</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5">
        {tiles.map(({ meta, q }) => {
          const up = q.changePct >= 0;
          const bg = tileColor(q.changePct);
          const fg = textColor(q.changePct);
          const pctStr = (up ? "+" : "") + q.changePct.toFixed(2) + "%";
          return (
            <button
              key={meta.symbol}
              onClick={() => onOpenStock(meta.symbol)}
              className="card card-hover p-2 flex flex-col items-center justify-center text-center transition animate-slide-up"
              style={{ background: bg, minHeight: "72px" }}
              title={meta.name + " - " + pctStr}
            >
              <span className="text-base font-bold leading-tight" style={{ color: fg }}>
                {meta.symbol}
              </span>
              <span className="text-sm font-medium leading-tight" style={{ color: fg }}>
                {pctStr}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
