import { useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import { fmtNum, fmtPctRaw } from "../lib/format";

interface CurrencyTrackerProps {
  onOpenStock: (s: string) => void;
}

interface ForexPair {
  id: number;
  pair: string;
  base: string;
  quote: string;
  rate: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  spark: number[];
}

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const PAIRS: [string, string, string, number][] = [
  ["USD/INR", "USD", "INR", 83.5],
  ["EUR/USD", "EUR", "USD", 1.085],
  ["GBP/USD", "GBP", "USD", 1.27],
  ["USD/JPY", "USD", "JPY", 157.5],
  ["USD/CNY", "USD", "CNY", 7.25],
  ["AUD/USD", "AUD", "USD", 0.66],
  ["USD/CAD", "USD", "CAD", 1.37],
  ["USD/CHF", "USD", "CHF", 0.90],
  ["NZD/USD", "NZD", "USD", 0.61],
  ["EUR/GBP", "EUR", "GBP", 0.855],
  ["EUR/JPY", "EUR", "JPY", 171.0],
  ["GBP/JPY", "GBP", "JPY", 199.8],
  ["USD/KRW", "USD", "KRW", 1370],
  ["USD/HKD", "USD", "HKD", 7.82],
  ["USD/SGD", "USD", "SGD", 1.35],
];

function buildPairs(): ForexPair[] {
  const out: ForexPair[] = [];
  for (let i = 0; i < PAIRS.length; i++) {
    const [pair, base, quote, baseRate] = PAIRS[i];
    const changePct = (seeded(i * 3 + 1) - 0.48) * 2.5;
    const rate = baseRate * (1 + changePct / 100);
    const dayHigh = rate * (1 + seeded(i * 5 + 2) * 0.008);
    const dayLow = rate * (1 - seeded(i * 7 + 4) * 0.008);
    const spark: number[] = [];
    let p = baseRate * 0.998;
    for (let j = 0; j < 24; j++) {
      p *= 1 + (seeded(i * 100 + j * 7) - 0.49) * 0.003;
      spark.push(p);
    }
    out.push({ id: i, pair, base, quote, rate, changePct, dayHigh, dayLow, spark });
  }
  return out;
}

export function CurrencyTracker({ onOpenStock }: CurrencyTrackerProps) {
  const pairs = useMemo(buildPairs, []);
  const gainers = pairs.filter((p) => p.changePct > 0).length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <DollarSign size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Currency Tracker</h2>
        <span className="chip bg-ink-800 text-ink-400">{pairs.length} pairs</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bull">
            <TrendingUp size={14} /> {gainers} up
          </span>
          <span className="flex items-center gap-1 text-bear">
            <TrendingDown size={14} /> {pairs.length - gainers} down
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pairs.map((p) => {
          const positive = p.changePct >= 0;
          return (
            <div
              key={p.id}
              className="card card-hover p-4 cursor-pointer"
              onClick={() => onOpenStock(p.base)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-ink-100 flex items-center gap-1">
                    {p.base}
                    <ArrowRight size={12} className="text-ink-600" />
                    {p.quote}
                  </div>
                </div>
                <Sparkline points={p.spark} positive={positive} width={70} height={28} />
              </div>

              <div className="flex items-end justify-between mb-2">
                <div>
                  <div className="text-xl font-mono text-ink-100">
                    {p.rate < 10 ? fmtNum(p.rate, 4) : fmtNum(p.rate, 2)}
                  </div>
                  <div className={`text-sm font-mono ${positive ? "text-bull" : "text-bear"}`}>
                    {positive ? "+" : ""}{fmtPctRaw(p.changePct)}%
                  </div>
                </div>
                <div className="text-right text-xs text-ink-500">
                  <div>H: {fmtNum(p.dayHigh, 4)}</div>
                  <div>L: {fmtNum(p.dayLow, 4)}</div>
                </div>
              </div>

              <div className="relative h-1 rounded-full bg-ink-800">
                <div
                  className="absolute h-1 rounded-full bg-brand-400"
                  style={{
                    left: ((p.rate - p.dayLow) / (p.dayHigh - p.dayLow)) * 100 + "%",
                    width: "2px",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-ink-500">
        Forex rates are indicative. Click any card to explore related stocks.
      </div>
    </div>
  );
}

export default CurrencyTracker;
