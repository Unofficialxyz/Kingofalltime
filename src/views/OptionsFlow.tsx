import { useMemo } from "react";
import { Layers } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtCompact } from "../lib/format";

interface OptionRow {
  strike: number;
  callOI: number;
  callVol: number;
  putOI: number;
  putVol: number;
}

function buildChain(symbol: string, spot: number): OptionRow[] {
  const rows: OptionRow[] = [];
  const stride = spot * 0.02;
  for (let i = -5; i <= 5; i++) {
    const strike = Math.round((spot + i * stride) / 0.5) * 0.5;
    const dist = Math.abs(i);
    const base = 1000 * (6 - dist);
    rows.push({
      strike,
      callOI: Math.floor(base * (1 + (i * 17) % 50 / 100)),
      callVol: Math.floor(base * 0.6 * (1 + (i * 11) % 30 / 100)),
      putOI: Math.floor(base * (1 + ((-i) * 13) % 50 / 100)),
      putVol: Math.floor(base * 0.6 * (1 + ((-i) * 7) % 30 / 100)),
    });
  }
  return rows;
}

export function OptionsFlow({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice } = useCurrency();
  const symbol = useMemo(() => REAL_STOCKS.find((s) => s.symbol === "AAPL")?.symbol ?? "AAPL", []);
  const spot = useMemo(() => getQuote(symbol).price, [symbol]);
  const chain = useMemo(() => buildChain(symbol, spot), [symbol, spot]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Layers className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Options Flow</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{symbol}</span>
        <span className="text-base text-ink-400 ml-2">Spot: {formatPrice(spot)}</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-right p-4 font-medium">Strike</th>
              <th className="text-right p-4 font-medium text-bull">Call OI</th>
              <th className="text-right p-4 font-medium text-bull">Call Vol</th>
              <th className="text-right p-4 font-medium text-bear">Put OI</th>
              <th className="text-right p-4 font-medium text-bear">Put Vol</th>
              <th className="text-right p-4 font-medium">PCR</th>
            </tr>
          </thead>
          <tbody>
            {chain.map((r, i) => {
              const pcr = r.callOI > 0 ? r.putOI / r.callOI : 0;
              const atm = Math.abs(r.strike - spot) < spot * 0.02;
              return (
                <tr
                  key={i}
                  onClick={() => onOpenStock(symbol)}
                  className={`border-b border-white/5 last:border-0 card-hover cursor-pointer ${atm ? "bg-brand-500/5" : ""}`}
                >
                  <td className="p-4 text-right text-ink-100 font-semibold">
                    {r.strike.toFixed(2)}{atm ? " ★" : ""}
                  </td>
                  <td className="p-4 text-right text-bull">{fmtCompact(r.callOI)}</td>
                  <td className="p-4 text-right text-bull-soft">{fmtCompact(r.callVol)}</td>
                  <td className="p-4 text-right text-bear">{fmtCompact(r.putOI)}</td>
                  <td className="p-4 text-right text-bear-soft">{fmtCompact(r.putVol)}</td>
                  <td className="p-4 text-right text-ink-200">{pcr.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-base text-ink-500">★ marks the at-the-money strike. PCR = Put/Call Open Interest ratio.</p>
    </div>
  );
}
