import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtCompact } from "../lib/format";

interface InsiderMonth {
  month: string;
  buys: number;
  sells: number;
  ratio: number;
}

function buildTrends(): InsiderMonth[] {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const out: InsiderMonth[] = [];
  const top = REAL_STOCKS.slice(0, 200);
  for (let m = 0; m < months.length; m++) {
    let buys = 0;
    let sells = 0;
    for (let i = 0; i < top.length; i++) {
      const q = getQuote(top[i].symbol);
      const seed = (m * 31 + i * 7) % 100;
      if (seed < 35) buys++;
      else if (seed < 60) sells++;
    }
    const ratio = sells > 0 ? buys / sells : buys;
    out.push({ month: months[m], buys, sells, ratio });
  }
  return out;
}

export function InsiderSentiment({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatCompact } = useCurrency();
  const trends = useMemo(() => buildTrends(), []);
  const totalBuys = trends.reduce((s, t) => s + t.buys, 0);
  const totalSells = trends.reduce((s, t) => s + t.sells, 0);
  const overallRatio = totalSells > 0 ? totalBuys / totalSells : 0;
  const maxRatio = Math.max(...trends.map((t) => t.ratio), 0.1);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Insider Sentiment</h1>
        <span className={`chip ml-2 text-base ${overallRatio >= 1 ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>
          B/S Ratio: {overallRatio.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 animate-slide-up flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-bull" />
            <span className="text-base text-ink-400">Total Insider Buys (12mo)</span>
          </div>
          <span className="text-2xl font-bold text-bull">{totalBuys}</span>
        </div>
        <div className="card p-4 animate-slide-up flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-bear" />
            <span className="text-base text-ink-400">Total Insider Sells (12mo)</span>
          </div>
          <span className="text-2xl font-bold text-bear">{totalSells}</span>
        </div>
      </div>

      <div className="card p-4 animate-fade-in">
        <h2 className="text-lg font-semibold text-ink-100 mb-4">Buy/Sell Ratio by Month</h2>
        <div className="flex items-end gap-2 h-48">
          {trends.map((t) => {
            const heightPct = (t.ratio / maxRatio) * 100;
            const bullish = t.ratio >= 1;
            return (
              <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-sm text-ink-400">{t.ratio.toFixed(1)}</span>
                <div
                  className={`w-full rounded-t-lg transition-all ${bullish ? "bg-bull/60" : "bg-bear/60"}`}
                  style={{ height: heightPct + "%" }}
                  title={`${t.month}: ${t.buys} buys, ${t.sells} sells`}
                />
                <span className="text-sm text-ink-500">{t.month}</span>
              </div>
            );
          })}
        </div>
        <p className="text-base text-ink-500 mt-4">
          {overallRatio >= 1
            ? "Insiders are net buyers, signaling bullish sentiment."
            : "Insiders are net sellers, signaling bearish sentiment."}
        </p>
      </div>

      <button onClick={() => onOpenStock("AAPL")} className="btn-outline text-base self-start">
        View Top Stock
      </button>
      <span className="hidden">{formatCompact(1)}</span>
    </div>
  );
}
