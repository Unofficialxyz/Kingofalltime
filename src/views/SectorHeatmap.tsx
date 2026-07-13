import { useMemo } from "react";
import { Grid3x3 } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtPct } from "../lib/format";
import type { Sector } from "../lib/types";

interface SectorPerf {
  sector: Sector;
  changePct: number;
  stockCount: number;
  topStock: string;
}

function buildSectors(): SectorPerf[] {
  const map = new Map<Sector, { total: number; count: number; best: { sym: string; chg: number } }>();
  const top = REAL_STOCKS.slice(0, 300);
  for (const meta of top) {
    const q = getQuote(meta.symbol);
    const entry = map.get(meta.sector) ?? { total: 0, count: 0, best: { sym: meta.symbol, chg: q.changePct } };
    entry.total += q.changePct;
    entry.count += 1;
    if (q.changePct > entry.best.chg) entry.best = { sym: meta.symbol, chg: q.changePct };
    map.set(meta.sector, entry);
  }
  const out: SectorPerf[] = [];
  for (const [sector, e] of map) {
    out.push({
      sector,
      changePct: e.total / e.count,
      stockCount: e.count,
      topStock: e.best.sym,
    });
  }
  return out.sort((a, b) => b.changePct - a.changePct);
}

function tileColor(changePct: number): string {
  const abs = Math.min(Math.abs(changePct), 5) / 5;
  if (changePct >= 0) {
    return `rgba(16, 185, 129, ${(0.15 + abs * 0.65).toFixed(2)})`;
  }
  return `rgba(239, 68, 68, ${(0.15 + abs * 0.65).toFixed(2)})`;
}

function textColor(changePct: number): string {
  const abs = Math.min(Math.abs(changePct), 5) / 5;
  return abs > 0.4 ? "#ffffff" : "#e2e8f0";
}

export function SectorHeatmap({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatCompact } = useCurrency();
  const sectors = useMemo(() => buildSectors(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Grid3x3 className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Sector Heatmap</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{sectors.length} Sectors</span>
      </div>

      <div className="flex items-center gap-4 text-sm text-ink-500">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded" style={{ background: "rgba(239, 68, 68, 0.65)" }} />
          <span className="text-base">Bearish</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded" style={{ background: "rgba(16, 185, 129, 0.65)" }} />
          <span className="text-base">Bullish</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {sectors.map((s) => {
          const bg = tileColor(s.changePct);
          const fg = textColor(s.changePct);
          const up = s.changePct >= 0;
          const pctStr = (up ? "+" : "") + s.changePct.toFixed(2) + "%";
          return (
            <button
              key={s.sector}
              onClick={() => onOpenStock(s.topStock)}
              className="card card-hover p-3 flex flex-col gap-1 text-left transition animate-slide-up"
              style={{ background: bg, minHeight: "90px" }}
            >
              <span className="text-base font-bold leading-tight" style={{ color: fg }}>{s.sector}</span>
              <span className="text-lg font-bold" style={{ color: fg }}>{pctStr}</span>
              <span className="text-sm" style={{ color: fg }}>{s.stockCount} stocks</span>
              <span className="text-sm mt-auto" style={{ color: fg }}>
                Top: {s.topStock} ({formatCompact(1)})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
