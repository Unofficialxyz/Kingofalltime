import { useMemo } from "react";
import { DollarSign } from "lucide-react";
import { useCurrency } from "../lib/currency";
import { fmtPct } from "../lib/format";

interface ForexPair {
  pair: string;
  rate: number;
  change: number;
  low52: number;
  high52: number;
}

const PAIRS: [string, number, number, number, number][] = [
  ["EUR/USD", 1.0850, 0.12, 1.0440, 1.1270],
  ["GBP/USD", 1.2700, -0.05, 1.1840, 1.3140],
  ["USD/JPY", 151.20, 0.23, 128.50, 151.80],
  ["USD/CNY", 7.2450, 0.04, 7.0500, 7.3500],
  ["USD/INR", 83.25, 0.08, 81.50, 83.45],
  ["AUD/USD", 0.6580, -0.15, 0.6270, 0.6880],
  ["USD/CAD", 1.3580, 0.02, 1.3180, 1.3850],
  ["USD/KRW", 1335.0, 0.18, 1280.0, 1370.0],
  ["USD/SGD", 1.3420, -0.03, 1.3180, 1.3580],
  ["USD/HKD", 7.8200, 0.01, 7.7600, 7.8500],
  ["USD/BRL", 5.0200, -0.32, 4.7800, 5.1800],
  ["USD/MXN", 16.85, -0.21, 16.20, 17.50],
  ["USD/ZAR", 18.75, 0.45, 18.10, 19.40],
  ["USD/SAR", 3.7500, 0.0, 3.7400, 3.7600],
  ["USD/AED", 3.6720, 0.0, 3.6700, 3.6750],
  ["USD/TRY", 32.15, 0.62, 28.50, 32.80],
  ["USD/IDR", 15820, 0.11, 15400, 16200],
  ["USD/THB", 35.80, -0.08, 34.20, 36.50],
  ["USD/MYR", 4.7200, 0.03, 4.5800, 4.7800],
  ["USD/PHP", 56.20, 0.06, 55.10, 57.00],
];

function buildPairs(): ForexPair[] {
  return PAIRS.map((p) => ({
    pair: p[0],
    rate: p[1],
    change: p[2],
    low52: p[3],
    high52: p[4],
  }));
}

export function CurrencyTracker({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { symbol } = useCurrency();
  const rows = useMemo(() => buildPairs(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <DollarSign className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Currency Tracker</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{rows.length}</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Pair</th>
              <th className="text-right p-4 font-medium">Rate</th>
              <th className="text-right p-4 font-medium">Change</th>
              <th className="text-right p-4 font-medium">52w Low</th>
              <th className="text-right p-4 font-medium">52w High</th>
              <th className="text-right p-4 font-medium">Range</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const up = r.change >= 0;
              const rangePct = ((r.high52 - r.low52) / r.low52) * 100;
              return (
                <tr
                  key={r.pair}
                  onClick={() => onOpenStock(r.pair)}
                  className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
                >
                  <td className="p-4 text-ink-100 font-semibold">{r.pair}</td>
                  <td className="p-4 text-right text-ink-100 font-medium">
                    {symbol}{r.rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>
                  <td className={`p-4 text-right font-medium ${up ? "text-bull" : "text-bear"}`}>
                    {fmtPct(r.change)}
                  </td>
                  <td className="p-4 text-right text-ink-500">{r.low52.toFixed(2)}</td>
                  <td className="p-4 text-right text-ink-500">{r.high52.toFixed(2)}</td>
                  <td className="p-4 text-right text-ink-400">{rangePct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
