import { useMemo } from "react";
import { Activity } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { fmtCompact } from "../lib/format";

interface BreadthStats {
  advancers: number;
  decliners: number;
  unchanged: number;
  newHighs: number;
  newLows: number;
  adLine: number;
  totalVolume: number;
}

function computeBreadth(): BreadthStats {
  const top = REAL_STOCKS.slice(0, 500);
  let advancers = 0;
  let decliners = 0;
  let unchanged = 0;
  let newHighs = 0;
  let newLows = 0;
  let totalVolume = 0;
  for (const meta of top) {
    const q = getQuote(meta.symbol);
    if (q.changePct > 0.01) advancers++;
    else if (q.changePct < -0.01) decliners++;
    else unchanged++;
    if (q.price >= q.high52 * 0.99) newHighs++;
    if (q.price <= q.low52 * 1.01) newLows++;
    totalVolume += q.volume;
  }
  const adLine = advancers - decliners;
  return { advancers, decliners, unchanged, newHighs, newLows, adLine, totalVolume };
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card p-4 animate-slide-up flex flex-col gap-1">
      <span className="text-base text-ink-400">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-sm text-ink-500">{sub}</span>
    </div>
  );
}

export function MarketBreadth({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const stats = useMemo(() => computeBreadth(), []);
  const adRatio = stats.advancers + stats.decliners > 0
    ? (stats.advancers / (stats.advancers + stats.decliners) * 100).toFixed(1)
    : "0.0";
  const breadth = stats.adLine >= 0 ? "Positive" : "Negative";

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Market Breadth</h1>
        <span className={`chip ml-2 text-base ${stats.adLine >= 0 ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>
          {breadth}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Advancers" value={String(stats.advancers)} sub="Stocks up" color="text-bull" />
        <StatCard label="Decliners" value={String(stats.decliners)} sub="Stocks down" color="text-bear" />
        <StatCard label="Unchanged" value={String(stats.unchanged)} sub="No movement" color="text-ink-300" />
        <StatCard label="A/D Ratio" value={adRatio + "%"} sub="Advancing share" color="text-ink-100" />
        <StatCard label="New Highs" value={String(stats.newHighs)} sub="52w highs" color="text-bull" />
        <StatCard label="New Lows" value={String(stats.newLows)} sub="52w lows" color="text-bear" />
        <StatCard label="A/D Line" value={(stats.adLine >= 0 ? "+" : "") + String(stats.adLine)} sub="Net advance" color={stats.adLine >= 0 ? "text-bull" : "text-bear"} />
        <StatCard label="Total Volume" value={fmtCompact(stats.totalVolume)} sub="Across 500 stocks" color="text-ink-100" />
      </div>

      <div className="card p-4 animate-fade-in">
        <h2 className="text-lg font-semibold text-ink-100 mb-3">Advance/Decline Bar</h2>
        <div className="flex h-8 rounded-lg overflow-hidden">
          <div
            className="bg-bull flex items-center justify-center text-base font-semibold text-ink-950"
            style={{ width: adRatio + "%" }}
          >
            {stats.advancers}
          </div>
          <div
            className="bg-bear flex items-center justify-center text-base font-semibold text-ink-950"
            style={{ width: (100 - parseFloat(adRatio)) + "%" }}
          >
            {stats.decliners}
          </div>
        </div>
        <p className="text-base text-ink-500 mt-3">
          {breadth} market breadth. {stats.advancers} advancing vs {stats.decliners} declining stocks.
        </p>
      </div>

      <button
        onClick={() => onOpenStock("AAPL")}
        className="btn-outline text-base self-start"
      >
        View Top Stock
      </button>
    </div>
  );
}
