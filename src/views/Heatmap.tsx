import { useMemo } from "react";
import { Grid3x3, TrendingUp, TrendingDown } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { getLiveQuote } from "../lib/dataService";
import { useLiveQuotes } from "../lib/hooks";
import { fmtPctRaw } from "../lib/format";
import type { Quote } from "../lib/types";

interface HeatmapProps {
  onOpenStock: (s: string) => void;
}

const TILE_COUNT = 200;

function heatColor(changePct: number): string {
  // Green for gainers, red for losers; intensity scales with magnitude
  const abs = Math.min(Math.abs(changePct), 5) / 5; // normalize 0..1
  if (changePct >= 0) {
    // Green: from dark to bright
    const alpha = 0.15 + abs * 0.65;
    return `rgba(16,185,129,${alpha.toFixed(2)})`;
  }
  // Red: from dark to bright
  const alpha = 0.15 + abs * 0.65;
  return `rgba(239,68,68,${alpha.toFixed(2)})`;
}

function textColor(changePct: number): string {
  const abs = Math.abs(changePct);
  return abs > 1.5 ? "text-ink-50" : "text-ink-200";
}

export function Heatmap({ onOpenStock }: HeatmapProps) {
  useLiveQuotes();

  const tiles = useMemo(() => {
    const out: { symbol: string; name: string; quote: Quote | null }[] = [];
    const limit = Math.min(STOCK_UNIVERSE.length, TILE_COUNT);
    for (let i = 0; i < limit; i++) {
      const meta = STOCK_UNIVERSE[i];
      if (!meta) break;
      const q = getLiveQuote(meta.symbol);
      out.push({ symbol: meta.symbol, name: meta.name, quote: q });
    }
    return out;
  }, []);

  // Stats
  const stats = useMemo(() => {
    let gainers = 0;
    let losers = 0;
    let totalChange = 0;
    let counted = 0;
    for (const t of tiles) {
      if (!t.quote) continue;
      if (t.quote.changePct > 0) gainers++;
      else if (t.quote.changePct < 0) losers++;
      totalChange += t.quote.changePct;
      counted++;
    }
    return { gainers, losers, avgChange: counted > 0 ? totalChange / counted : 0 };
  }, [tiles]);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Grid3x3 size={18} className="text-brand-400" />
        <h2 className="text-lg font-semibold text-ink-100">Market Heatmap</h2>
        <span className="chip bg-ink-800 text-ink-400">Top {tiles.length} stocks</span>
        <div className="flex items-center gap-3 ml-auto">
          <span className="flex items-center gap-1 text-sm text-bull">
            <TrendingUp size={14} /> {stats.gainers} gainers
          </span>
          <span className="flex items-center gap-1 text-sm text-bear">
            <TrendingDown size={14} /> {stats.losers} losers
          </span>
          <span className={`text-sm font-mono ${stats.avgChange >= 0 ? "text-bull" : "text-bear"}`}>
            Avg {stats.avgChange >= 0 ? "+" : ""}{fmtPctRaw(stats.avgChange)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <span>Color intensity:</span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded" style={{ background: "rgba(239,68,68,0.7)" }} />
          <span>Loss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
          <span>Flat</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded" style={{ background: "rgba(16,185,129,0.7)" }} />
          <span>Gain</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="card p-3">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
          {tiles.map((t) => {
            const changePct = t.quote ? t.quote.changePct : 0;
            const bg = t.quote ? heatColor(changePct) : "rgba(255,255,255,0.03)";
            return (
              <button
                key={t.symbol}
                onClick={() => onOpenStock(t.symbol)}
                className="rounded-md p-2 text-center transition hover:scale-105 hover:z-10 hover:ring-1 hover:ring-brand-400"
                style={{ background: bg, minHeight: "64px" }}
                title={t.name + " - " + (t.quote ? fmtPctRaw(changePct) + "%" : "no data")}
              >
                <div className="text-xs font-bold text-ink-50 truncate">{t.symbol}</div>
                <div className={`text-xs font-mono ${textColor(changePct)}`}>
                  {t.quote ? (changePct >= 0 ? "+" : "") + fmtPctRaw(changePct) + "%" : "—"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-ink-500 text-center">
        Click any tile to view detailed stock information. Colors update every 5 seconds.
      </div>
    </div>
  );
}

export default Heatmap;
