import { useMemo } from "react";
import { Grid3x3, TrendingUp, TrendingDown } from "lucide-react";
import { SECTORS } from "../lib/universe";
import { getLiveQuote } from "../lib/dataService";
import { useLiveQuotes } from "../lib/hooks";
import { fmtPctRaw } from "../lib/format";

interface SectorHeatmapProps {
  onOpenStock: (s: string) => void;
}

interface SubIndustry {
  name: string;
  changePct: number;
  stocks: string[];
}

interface SectorData {
  sector: string;
  avgChange: number;
  subIndustries: SubIndustry[];
}

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const SUB_INDUSTRIES: Record<string, string[]> = {
  Technology: ["Semiconductors", "Software", "IT Services", "Cloud Computing", "AI & ML"],
  Financials: ["Banks", "Insurance", "NBFCs", "Asset Management", "FinTech"],
  Healthcare: ["Pharma", "Biotech", "Medical Devices", "Hospitals", "Healthcare IT"],
  "Consumer Discretionary": ["Auto", "Retail", "E-Commerce", "Luxury", "Restaurants"],
  "Consumer Staples": ["Food & Beverages", "Tobacco", "Household", "Personal Care", "Supermarkets"],
  Energy: ["Oil & Gas", "Renewables", "Coal", "Refineries", "Pipelines"],
  Industrials: ["Aerospace", "Defense", "Machinery", "Construction", "Logistics"],
  Materials: ["Steel", "Chemicals", "Mining", "Cement", "Paper"],
  "Communication Services": ["Telecom", "Media", "Streaming", "Gaming", "Advertising"],
  Utilities: ["Power", "Water", "Gas", "Electric", "Nuclear"],
  "Real Estate": ["REITs", "Residential", "Commercial", "Industrial RE", "Mortgage"],
};

function buildSectorData(): SectorData[] {
  return SECTORS.map((sector, si) => {
    const subs = SUB_INDUSTRIES[sector] ?? ["General"];
    const subIndustries: SubIndustry[] = subs.map((sub, ssi) => {
      const changePct = (seeded(si * 100 + ssi * 13 + 1) - 0.45) * 8;
      const stocks: string[] = [];
      for (let k = 0; k < 3; k++) {
        const idx = (si * 50 + ssi * 10 + k) % 200;
        const q = getLiveQuote("STOCK" + idx);
        if (q) stocks.push(q.symbol);
      }
      return { name: sub, changePct, stocks };
    });
    const avgChange = subIndustries.reduce((a, b) => a + b.changePct, 0) / subIndustries.length;
    return { sector, avgChange, subIndustries };
  });
}

function heatColor(changePct: number): string {
  const abs = Math.min(Math.abs(changePct), 5) / 5;
  const alpha = 0.15 + abs * 0.65;
  return changePct >= 0 ? `rgba(16,185,129,${alpha.toFixed(2)})` : `rgba(239,68,68,${alpha.toFixed(2)})`;
}

export function SectorHeatmap({ onOpenStock }: SectorHeatmapProps) {
  useLiveQuotes();
  const sectors = useMemo(buildSectorData, []);
  const gainers = sectors.filter((s) => s.avgChange > 0).length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Grid3x3 size={18} className="text-brand-400" />
        <h2 className="text-lg font-semibold text-ink-100">Sector Heatmap</h2>
        <span className="chip bg-ink-800 text-ink-400">{sectors.length} sectors</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bull">
            <TrendingUp size={14} /> {gainers} up
          </span>
          <span className="flex items-center gap-1 text-bear">
            <TrendingDown size={14} /> {sectors.length - gainers} down
          </span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {sectors.map((s) => (
          <div key={s.sector} className="card p-4">
            <div
              className="flex items-center justify-between mb-3 -mx-4 -mt-4 px-4 py-3 rounded-t-lg"
              style={{ background: heatColor(s.avgChange) }}
            >
              <h3 className="font-semibold text-ink-50">{s.sector}</h3>
              <span className="font-mono text-ink-50">
                {s.avgChange >= 0 ? "+" : ""}{fmtPctRaw(s.avgChange)}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {s.subIndustries.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => sub.stocks[0] && onOpenStock(sub.stocks[0])}
                  className="rounded-md p-2 text-center transition hover:scale-105 hover:ring-1 hover:ring-brand-400"
                  style={{ background: heatColor(sub.changePct), minHeight: "56px" }}
                >
                  <div className="text-xs font-medium text-ink-100 truncate">{sub.name}</div>
                  <div className="text-xs font-mono text-ink-50">
                    {sub.changePct >= 0 ? "+" : ""}{fmtPctRaw(sub.changePct)}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-500">
        <span>Color intensity:</span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded" style={{ background: "rgba(239,68,68,0.7)" }} />
          <span>Loss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded" style={{ background: "rgba(16,185,129,0.7)" }} />
          <span>Gain</span>
        </div>
      </div>
    </div>
  );
}

export default SectorHeatmap;
