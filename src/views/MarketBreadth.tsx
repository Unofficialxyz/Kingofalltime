import { useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import { fmtNum, fmtPctRaw } from "../lib/format";

interface MarketBreadthProps {
  onOpenStock: (s: string) => void;
}

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

interface BreadthData {
  advancers: number;
  decliners: number;
  unchanged: number;
  newHighs: number;
  newLows: number;
  mcclellan: number;
  adLine: number;
  adLineSpark: number[];
  mcclellanSpark: number[];
  upVolume: number;
  downVolume: number;
  trin: number;
}

function buildBreadth(): BreadthData {
  const advancers = 1200 + Math.floor(seeded(1) * 800);
  const decliners = 900 + Math.floor(seeded(2) * 700);
  const unchanged = 50 + Math.floor(seeded(3) * 100);
  const newHighs = 40 + Math.floor(seeded(4) * 80);
  const newLows = 15 + Math.floor(seeded(5) * 50);
  const mcclellan = (seeded(6) - 0.4) * 200;
  const adLine = (seeded(7) - 0.45) * 5000;

  const adLineSpark: number[] = [];
  let adl = adLine - 500;
  for (let j = 0; j < 30; j++) {
    adl += (seeded(j * 7 + 10) - 0.45) * 200;
    adLineSpark.push(adl);
  }

  const mcclellanSpark: number[] = [];
  let mc = mcclellan - 50;
  for (let j = 0; j < 30; j++) {
    mc += (seeded(j * 11 + 20) - 0.48) * 30;
    mcclellanSpark.push(mc);
  }

  const upVolume = 40 + seeded(8) * 50;
  const downVolume = 100 - upVolume + (seeded(9) - 0.5) * 10;
  const trin = (downVolume / Math.max(decliners, 1)) / (upVolume / Math.max(advancers, 1));

  return {
    advancers, decliners, unchanged, newHighs, newLows,
    mcclellan, adLine, adLineSpark, mcclellanSpark,
    upVolume, downVolume, trin,
  };
}

function StatCard({ label, value, sublabel, positive, icon }: {
  label: string; value: string; sublabel?: string; positive?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-ink-500">{label}</span>
      </div>
      <div className={`text-2xl font-mono ${positive === undefined ? "text-ink-100" : positive ? "text-bull" : "text-bear"}`}>
        {value}
      </div>
      {sublabel && <div className="text-xs text-ink-500 mt-1">{sublabel}</div>}
    </div>
  );
}

export function MarketBreadth({ onOpenStock }: MarketBreadthProps) {
  const data = useMemo(buildBreadth, []);
  const adRatio = data.advancers / Math.max(data.decliners, 1);
  const breadthPositive = data.advancers > data.decliners;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <BarChart3 size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Market Breadth</h2>
        <span className="chip bg-ink-800 text-ink-400">Real-time internals</span>
      </div>

      {/* Top stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard
          label="Advancers"
          value={fmtNum(data.advancers, 0)}
          positive={true}
          icon={<TrendingUp size={14} className="text-bull" />}
        />
        <StatCard
          label="Decliners"
          value={fmtNum(data.decliners, 0)}
          positive={false}
          icon={<TrendingDown size={14} className="text-bear" />}
        />
        <StatCard
          label="New 52W Highs"
          value={fmtNum(data.newHighs, 0)}
          positive={true}
        />
        <StatCard
          label="New 52W Lows"
          value={fmtNum(data.newLows, 0)}
          positive={false}
        />
      </div>

      {/* A/D Line & McClellan */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink-100 flex items-center gap-2">
              <Activity size={16} className="text-brand-400" /> Advance/Decline Line
            </h3>
            <span className={`font-mono text-sm ${data.adLine >= 0 ? "text-bull" : "text-bear"}`}>
              {data.adLine >= 0 ? "+" : ""}{fmtNum(data.adLine, 0)}
            </span>
          </div>
          <Sparkline points={data.adLineSpark} positive={data.adLine >= 0} width={400} height={60} />
          <div className="text-xs text-ink-500 mt-2">
            Cumulative net advancing issues. Rising A/D line confirms uptrend.
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink-100 flex items-center gap-2">
              <Activity size={16} className="text-accent-400" /> McClellan Oscillator
            </h3>
            <span className={`font-mono text-sm ${data.mcclellan >= 0 ? "text-bull" : "text-bear"}`}>
              {data.mcclellan >= 0 ? "+" : ""}{fmtNum(data.mcclellan, 1)}
            </span>
          </div>
          <Sparkline points={data.mcclellanSpark} positive={data.mcclellan >= 0} width={400} height={60} />
          <div className="text-xs text-ink-500 mt-2">
            Positive &gt; +100 = overbought. Negative &lt; -100 = oversold.
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard label="A/D Ratio" value={fmtNum(adRatio, 2)} positive={breadthPositive} />
        <StatCard label="Up Volume" value={fmtNum(data.upVolume, 1) + "%"} positive={true} />
        <StatCard label="Down Volume" value={fmtNum(data.downVolume, 1) + "%"} positive={false} />
        <StatCard
          label="TRIN (Arms Index)"
          value={fmtNum(data.trin, 2)}
          positive={data.trin < 1}
          sublabel={data.trin < 1 ? "Bullish" : "Bearish"}
        />
      </div>

      <div className="text-xs text-ink-500">
        TRIN &lt; 1 indicates bullish breadth. TRIN &gt; 1 indicates bearish breadth.
      </div>
    </div>
  );
}

export default MarketBreadth;
