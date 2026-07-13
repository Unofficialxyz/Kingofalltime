import { useMemo } from "react";
import { Landmark } from "lucide-react";
import { fmtPct } from "../lib/format";

interface BondYield {
  country: string;
  flag: string;
  y2: number;
  y5: number;
  y10: number;
  y30: number;
  change: number;
}

const BONDS: [string, string, number, number, number, number, number][] = [
  ["USA", "🇺🇸", 4.68, 4.32, 4.18, 4.42, 0.03],
  ["India", "🇮🇳", 7.05, 7.12, 7.08, 7.15, -0.02],
  ["Germany", "🇩🇪", 2.85, 2.42, 2.38, 2.58, 0.01],
  ["Japan", "🇯🇵", 0.42, 0.58, 0.95, 1.85, 0.04],
  ["UK", "🇬🇧", 4.25, 4.02, 3.98, 4.28, -0.01],
  ["France", "🇫🇷", 3.12, 2.88, 2.95, 3.42, 0.02],
  ["Italy", "🇮🇹", 3.45, 3.38, 3.62, 4.05, 0.05],
  ["Spain", "🇪🇸", 3.18, 2.95, 3.08, 3.52, 0.01],
  ["Canada", "🇨🇦", 4.22, 3.88, 3.72, 3.85, 0.02],
  ["Australia", "🇦🇺", 4.05, 3.92, 3.98, 4.25, -0.03],
  ["China", "🇨🇳", 2.15, 2.28, 2.45, 2.82, 0.01],
  ["Brazil", "🇧🇷", 10.75, 10.82, 10.88, 11.15, -0.05],
  ["South Korea", "🇰🇷", 3.25, 3.28, 3.38, 3.72, 0.02],
  ["South Africa", "🇿🇦", 8.15, 8.22, 8.85, 9.15, 0.04],
  ["Mexico", "🇲🇽", 11.05, 10.92, 10.78, 10.95, -0.02],
];

function buildBonds(): BondYield[] {
  return BONDS.map((b) => ({
    country: b[0],
    flag: b[1],
    y2: b[2],
    y5: b[3],
    y10: b[4],
    y30: b[5],
    change: b[6],
  }));
}

export function BondYields({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const rows = useMemo(() => buildBonds(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Landmark className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Government Bond Yields</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{rows.length} Countries</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Country</th>
              <th className="text-right p-4 font-medium">2Y</th>
              <th className="text-right p-4 font-medium">5Y</th>
              <th className="text-right p-4 font-medium">10Y</th>
              <th className="text-right p-4 font-medium">30Y</th>
              <th className="text-right p-4 font-medium">10Y Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const up = r.change >= 0;
              return (
                <tr
                  key={r.country}
                  onClick={() => onOpenStock(r.country)}
                  className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
                >
                  <td className="p-4 text-ink-100 font-semibold">
                    <span className="mr-2">{r.flag}</span>{r.country}
                  </td>
                  <td className="p-4 text-right text-ink-200">{r.y2.toFixed(2)}%</td>
                  <td className="p-4 text-right text-ink-200">{r.y5.toFixed(2)}%</td>
                  <td className="p-4 text-right text-ink-100 font-medium">{r.y10.toFixed(2)}%</td>
                  <td className="p-4 text-right text-ink-200">{r.y30.toFixed(2)}%</td>
                  <td className={`p-4 text-right font-medium ${up ? "text-bull" : "text-bear"}`}>
                    {fmtPct(r.change)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-base text-ink-500">Yields shown as annual percentage rates. Change reflects 10Y yield movement.</p>
    </div>
  );
}
