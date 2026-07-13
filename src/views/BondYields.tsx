import { useMemo } from "react";
import { Landmark, TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import { fmtNum, fmtPctRaw } from "../lib/format";

interface BondYieldsProps {
  onOpenStock: (s: string) => void;
}

interface Bond {
  id: number;
  country: string;
  flag: string;
  maturity: string;
  yield: number;
  changeBps: number;
  prevYield: number;
  spark: number[];
}

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const BONDS: [string, string, string, number][] = [
  ["United States", "\u{1F1FA}\u{1F1F8}", "10Y", 4.25],
  ["United States", "\u{1F1FA}\u{1F1F8}", "2Y", 4.75],
  ["United States", "\u{1F1FA}\u{1F1F8}", "30Y", 4.35],
  ["India", "\u{1F1EE}\u{1F1F3}", "10Y", 7.05],
  ["India", "\u{1F1EE}\u{1F1F3}", "2Y", 7.15],
  ["India", "\u{1F1EE}\u{1F1F3}", "30Y", 7.25],
  ["Germany", "\u{1F1E9}\u{1F1EA}", "10Y", 2.35],
  ["United Kingdom", "\u{1F1EC}\u{1F1E7}", "10Y", 4.05],
  ["Japan", "\u{1F1EF}\u{1F1F5}", "10Y", 0.95],
  ["China", "\u{1F1E8}\u{1F1F3}", "10Y", 2.15],
  ["Australia", "\u{1F1E6}\u{1F1FA}", "10Y", 4.15],
  ["Canada", "\u{1F1E8}\u{1F1E6}", "10Y", 3.45],
  ["France", "\u{1F1EB}\u{1F1F7}", "10Y", 2.95],
  ["Italy", "\u{1F1EE}\u{1F1F9}", "10Y", 3.75],
  ["Spain", "\u{1F1EA}\u{1F1F8}", "10Y", 3.25],
];

function buildBonds(): Bond[] {
  const out: Bond[] = [];
  for (let i = 0; i < BONDS.length; i++) {
    const [country, flag, maturity, baseYield] = BONDS[i];
    const changeBps = (seeded(i * 3 + 1) - 0.45) * 20;
    const yieldVal = baseYield + changeBps / 100;
    const spark: number[] = [];
    let p = baseYield - 0.3;
    for (let j = 0; j < 20; j++) {
      p += (seeded(i * 100 + j * 7) - 0.48) * 0.08;
      spark.push(p);
    }
    out.push({
      id: i,
      country,
      flag,
      maturity,
      yield: yieldVal,
      changeBps,
      prevYield: yieldVal - changeBps / 100,
      spark,
    });
  }
  return out;
}

export function BondYields({ onOpenStock }: BondYieldsProps) {
  const bonds = useMemo(buildBonds, []);
  const rising = bonds.filter((b) => b.changeBps > 0).length;

  // Build yield curve for US
  const usCurve = bonds.filter((b) => b.country === "United States").sort((a, b) => {
    const order: Record<string, number> = { "2Y": 2, "10Y": 10, "30Y": 30 };
    return (order[a.maturity] ?? 99) - (order[b.maturity] ?? 99);
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Landmark size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Government Bond Yields</h2>
        <span className="chip bg-ink-800 text-ink-400">{bonds.length} bonds</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bear">
            <TrendingUp size={14} /> {rising} rising
          </span>
          <span className="flex items-center gap-1 text-bull">
            <TrendingDown size={14} /> {bonds.length - rising} falling
          </span>
        </div>
      </div>

      {/* US Yield Curve */}
      <div className="card p-4">
        <h3 className="font-semibold text-ink-100 mb-3 flex items-center gap-2">
          <span>{"\u{1F1FA}\u{1F1F8}"}</span> US Treasury Yield Curve
        </h3>
        <div className="flex items-end gap-4 h-32">
          {usCurve.map((b) => (
            <div key={b.id} className="flex-1 flex flex-col items-center justify-end">
              <div className="text-xs font-mono text-ink-300 mb-1">{fmtNum(b.yield, 2)}%</div>
              <div
                className="w-full rounded-t bg-gradient-to-t from-brand-500 to-accent-400"
                style={{ height: (b.yield / 5) * 100 + "%" }}
              />
              <div className="text-xs text-ink-500 mt-1">{b.maturity}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bond grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bonds.map((b) => {
          const positive = b.changeBps >= 0;
          return (
            <div
              key={b.id}
              className="card card-hover p-4 cursor-pointer"
              onClick={() => onOpenStock(b.country)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{b.flag}</span>
                  <div>
                    <div className="font-semibold text-ink-100">{b.country}</div>
                    <div className="text-xs text-ink-500">{b.maturity} Government Bond</div>
                  </div>
                </div>
                <Sparkline points={b.spark} positive={positive} width={60} height={28} />
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xl font-mono text-ink-100">{fmtNum(b.yield, 2)}%</div>
                  <div className={`text-sm font-mono ${positive ? "text-bear" : "text-bull"}`}>
                    {positive ? "+" : ""}{fmtNum(b.changeBps, 1)} bps
                  </div>
                </div>
                <div className="text-right text-xs text-ink-500">
                  <div>Prev: {fmtNum(b.prevYield, 2)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-ink-500">
        Rising yields indicate expectations of higher rates. 1 bps = 0.01%.
      </div>
    </div>
  );
}

export default BondYields;
