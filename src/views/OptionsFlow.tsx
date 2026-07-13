import { useMemo, useState } from "react";
import { Activity, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { getLiveQuote } from "../lib/dataService";
import { useLiveQuotes } from "../lib/hooks";
import { useCurrency } from "../lib/currency";
import { fmtNum, fmtCompact } from "../lib/format";

interface OptionsFlowProps {
  onOpenStock: (s: string) => void;
}

interface OptionRow {
  strike: number;
  callVol: number;
  callOI: number;
  callIV: number;
  putVol: number;
  putOI: number;
  putIV: number;
}

interface StockOptions {
  symbol: string;
  name: string;
  spot: number;
  rows: OptionRow[];
  totalCallVol: number;
  totalPutVol: number;
  pcr: number;
}

const STOCK_COUNT = 10;
const STRIKES_PER_STOCK = 7;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function buildOptions(): StockOptions[] {
  const out: StockOptions[] = [];
  for (let i = 0; i < STOCK_COUNT; i++) {
    const meta = STOCK_UNIVERSE[(i * 71) % STOCK_UNIVERSE.length];
    const quote = getLiveQuote(meta.symbol);
    const spot = quote?.price ?? 100 + seeded(i + 1) * 900;
    const strikeStep = Math.max(1, Math.round(spot * 0.025));
    const atmStrike = Math.round(spot / strikeStep) * strikeStep;
    const rows: OptionRow[] = [];
    let totalCallVol = 0;
    let totalPutVol = 0;
    for (let j = 0; j < STRIKES_PER_STOCK; j++) {
      const strike = atmStrike + (j - Math.floor(STRIKES_PER_STOCK / 2)) * strikeStep;
      const moneyness = Math.abs(strike - spot) / spot;
      const callVol = Math.floor((1 - moneyness * 5) * (5000 + seeded(i * 10 + j * 3) * 45000));
      const putVol = Math.floor((1 - moneyness * 5) * (3000 + seeded(i * 10 + j * 7 + 3) * 30000));
      totalCallVol += Math.max(0, callVol);
      totalPutVol += Math.max(0, putVol);
      rows.push({
        strike,
        callVol: Math.max(0, callVol),
        callOI: Math.max(0, callVol) * Math.floor(2 + seeded(i * 10 + j * 2) * 8),
        callIV: 0.1 + moneyness * 0.5 + seeded(i * 10 + j * 5) * 0.2,
        putVol: Math.max(0, putVol),
        putOI: Math.max(0, putVol) * Math.floor(2 + seeded(i * 10 + j * 4 + 1) * 8),
        putIV: 0.1 + moneyness * 0.5 + seeded(i * 10 + j * 6 + 2) * 0.2,
      });
    }
    out.push({
      symbol: meta.symbol,
      name: meta.name,
      spot,
      rows,
      totalCallVol,
      totalPutVol,
      pcr: totalCallVol > 0 ? totalPutVol / totalCallVol : 0,
    });
  }
  return out;
}

export function OptionsFlow({ onOpenStock }: OptionsFlowProps) {
  useLiveQuotes();
  const { formatPrice } = useCurrency();
  const data = useMemo(buildOptions, []);
  const [selected, setSelected] = useState(0);
  const stock = data[selected];

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Activity size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Options Flow</h2>
        <span className="chip bg-ink-800 text-ink-400">{data.length} stocks</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {data.map((s, i) => (
          <button
            key={s.symbol}
            onClick={() => setSelected(i)}
            className={`chip transition ${i === selected ? "bg-brand-500 text-ink-50" : "bg-ink-800 text-ink-400 hover:text-ink-200"}`}
          >
            {s.symbol}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <div className="text-xs text-ink-500 mb-1">Spot Price</div>
          <div className="text-2xl font-mono text-ink-100">{formatPrice(stock.spot)}</div>
          <div className="text-sm text-ink-400 mt-1 truncate">{stock.name}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-500 mb-1">Total Call Volume</div>
          <div className="text-2xl font-mono text-bull">{fmtCompact(stock.totalCallVol)}</div>
          <div className="flex items-center gap-1 text-sm text-bull mt-1">
            <ArrowUp size={14} /> {fmtNum(stock.totalCallVol / stock.totalPutVol, 2)}x puts
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-500 mb-1">Put/Call Ratio</div>
          <div className={`text-2xl font-mono ${stock.pcr > 1 ? "text-bear" : "text-bull"}`}>
            {fmtNum(stock.pcr, 2)}
          </div>
          <div className="flex items-center gap-1 text-sm text-ink-400 mt-1">
            <TrendingUp size={14} /> {stock.pcr > 1 ? "Bearish sentiment" : "Bullish sentiment"}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-ink-100">{stock.symbol} Options Chain</h3>
          <span className="text-xs text-ink-500">Strikes near ATM</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-ink-900/50">
                <th className="text-right py-2 px-3 font-medium text-bull">Call Vol</th>
                <th className="text-right py-2 px-3 font-medium text-bull hidden sm:table-cell">Call OI</th>
                <th className="text-right py-2 px-3 font-medium text-bull hidden md:table-cell">Call IV</th>
                <th className="text-center py-2 px-3 font-medium text-ink-300">Strike</th>
                <th className="text-right py-2 px-3 font-medium text-bear hidden md:table-cell">Put IV</th>
                <th className="text-right py-2 px-3 font-medium text-bear hidden sm:table-cell">Put OI</th>
                <th className="text-right py-2 px-3 font-medium text-bear">Put Vol</th>
              </tr>
            </thead>
            <tbody>
              {stock.rows.map((r, idx) => {
                const isATM = Math.abs(r.strike - stock.spot) === Math.min(...stock.rows.map((x) => Math.abs(x.strike - stock.spot)));
                return (
                  <tr
                    key={idx}
                    onClick={() => onOpenStock(stock.symbol)}
                    className={`border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition ${isATM ? "bg-brand-500/5" : ""}`}
                  >
                    <td className="py-2 px-3 text-right font-mono text-bull">{fmtCompact(r.callVol)}</td>
                    <td className="py-2 px-3 text-right font-mono text-bull/70 hidden sm:table-cell">{fmtCompact(r.callOI)}</td>
                    <td className="py-2 px-3 text-right font-mono text-ink-500 hidden md:table-cell">{fmtNum(r.callIV * 100, 1)}%</td>
                    <td className="py-2 px-3 text-center font-mono font-semibold text-ink-100">
                      {isATM && <span className="text-accent-400 mr-1">{"\u25C6"}</span>}
                      {fmtNum(r.strike, 0)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-ink-500 hidden md:table-cell">{fmtNum(r.putIV * 100, 1)}%</td>
                    <td className="py-2 px-3 text-right font-mono text-bear/70 hidden sm:table-cell">{fmtCompact(r.putOI)}</td>
                    <td className="py-2 px-3 text-right font-mono text-bear">{fmtCompact(r.putVol)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-500">
        <ArrowDown size={14} />
        <span>PCR &gt; 1 indicates bearish sentiment. IV = Implied Volatility. OI = Open Interest.</span>
      </div>
    </div>
  );
}

export default OptionsFlow;
