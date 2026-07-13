import { useMemo } from "react";
import { Gem, Fuel, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import { fmtNum, fmtPctRaw } from "../lib/format";

interface CommodityTrackerProps {
  onOpenStock: (s: string) => void;
}

interface Commodity {
  id: number;
  name: string;
  symbol: string;
  icon: string;
  price: number;
  changePct: number;
  unit: string;
  high: number;
  low: number;
  spark: number[];
}

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const COMMODITIES: [string, string, number, string, string][] = [
  ["Gold", "XAU", 2350, "USD/oz", "gem"],
  ["Silver", "XAG", 30.5, "USD/oz", "gem"],
  ["Crude Oil", "CL", 78.4, "USD/bbl", "fuel"],
  ["Brent Oil", "BZ", 82.1, "USD/bbl", "fuel"],
  ["Natural Gas", "NG", 2.35, "USD/MMBtu", "zap"],
  ["Copper", "HG", 4.52, "USD/lb", "gem"],
  ["Platinum", "XPT", 985, "USD/oz", "gem"],
  ["Palladium", "XPD", 950, "USD/oz", "gem"],
  ["Aluminum", "ALU", 2450, "USD/ton", "gem"],
  ["Wheat", "ZW", 580, "USD/bushel", "fuel"],
  ["Corn", "ZC", 445, "USD/bushel", "fuel"],
  ["Coffee", "KC", 225, "USD/lb", "fuel"],
];

function buildCommodities(): Commodity[] {
  const out: Commodity[] = [];
  for (let i = 0; i < COMMODITIES.length; i++) {
    const [name, symbol, basePrice, unit, iconType] = COMMODITIES[i];
    const changePct = (seeded(i * 3 + 1) - 0.48) * 6;
    const price = basePrice * (1 + changePct / 100);
    const high = price * (1 + seeded(i * 5 + 2) * 0.02);
    const low = price * (1 - seeded(i * 7 + 4) * 0.02);
    const spark: number[] = [];
    let p = basePrice * 0.97;
    for (let j = 0; j < 24; j++) {
      p *= 1 + (seeded(i * 100 + j * 7) - 0.49) * 0.02;
      spark.push(p);
    }
    out.push({ id: i, name, symbol, icon: iconType, price, changePct, unit, high, low, spark });
  }
  return out;
}

function Icon({ type }: { type: string }) {
  if (type === "gem") return <Gem size={16} className="text-accent-400" />;
  if (type === "fuel") return <Fuel size={16} className="text-brand-400" />;
  return <Zap size={16} className="text-bull" />;
}

export function CommodityTracker({ onOpenStock }: CommodityTrackerProps) {
  const commodities = useMemo(buildCommodities, []);
  const gainers = commodities.filter((c) => c.changePct > 0).length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Gem size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Commodity Tracker</h2>
        <span className="chip bg-ink-800 text-ink-400">{commodities.length} commodities</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bull">
            <TrendingUp size={14} /> {gainers} up
          </span>
          <span className="flex items-center gap-1 text-bear">
            <TrendingDown size={14} /> {commodities.length - gainers} down
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {commodities.map((c) => {
          const positive = c.changePct >= 0;
          return (
            <div
              key={c.id}
              className="card card-hover p-4 cursor-pointer"
              onClick={() => onOpenStock(c.symbol)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center">
                    <Icon type={c.icon} />
                  </div>
                  <div>
                    <div className="font-semibold text-ink-100">{c.name}</div>
                    <div className="text-xs text-ink-500">{c.symbol} - {c.unit}</div>
                  </div>
                </div>
                <Sparkline points={c.spark} positive={positive} width={70} height={28} />
              </div>

              <div className="flex items-end justify-between mb-2">
                <div>
                  <div className="text-xl font-mono text-ink-100">
                    ${c.price < 10 ? fmtNum(c.price, 3) : fmtNum(c.price, 2)}
                  </div>
                  <div className={`text-sm font-mono ${positive ? "text-bull" : "text-bear"}`}>
                    {positive ? "+" : ""}{fmtPctRaw(c.changePct)}%
                  </div>
                </div>
                <div className="text-right text-xs text-ink-500">
                  <div>H: ${fmtNum(c.high, 2)}</div>
                  <div>L: ${fmtNum(c.low, 2)}</div>
                </div>
              </div>

              <div className="relative h-1 rounded-full bg-ink-800">
                <div
                  className="absolute h-1 rounded-full bg-brand-400"
                  style={{
                    left: ((c.price - c.low) / (c.high - c.low)) * 100 + "%",
                    width: "2px",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-ink-500">
        Commodity prices are indicative. Click any card to explore related stocks.
      </div>
    </div>
  );
}

export default CommodityTracker;
