import { useMemo, useState } from "react";
import { Building, Landmark, PieChart, ChevronRight } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { fmtNum, fmtPctRaw } from "../lib/format";

interface InstitutionalHoldingsProps {
  onOpenStock: (s: string) => void;
}

interface Holder {
  name: string;
  type: "FII" | "DII" | "Mutual Fund" | "Pension" | "Insurance";
  shares: number;
  pctHeld: number;
  changePct: number;
}

interface StockHolding {
  symbol: string;
  name: string;
  totalInstPct: number;
  fiiPct: number;
  diiPct: number;
  holders: Holder[];
}

const STOCK_COUNT = 10;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const HOLDER_NAMES = [
  "BlackRock", "Vanguard", "Fidelity", "State Street", "T. Rowe Price",
  "SBI Mutual Fund", "HDFC Mutual Fund", "ICICI Prudential", "Nippon Life", "UTI AMC",
  "Government Pension Fund", "Norges Bank", "CPPIB", "GIC", "Temasek",
];

function buildHoldings(): StockHolding[] {
  const out: StockHolding[] = [];
  for (let i = 0; i < STOCK_COUNT; i++) {
    const meta = STOCK_UNIVERSE[(i * 97) % STOCK_UNIVERSE.length];
    const holderCount = 4 + Math.floor(seeded(i * 3 + 1) * 4);
    const holders: Holder[] = [];
    let totalPct = 0;
    for (let j = 0; j < holderCount; j++) {
      const name = HOLDER_NAMES[(i * 10 + j) % HOLDER_NAMES.length];
      const type: Holder["type"] = j % 5 === 0 ? "FII" : j % 5 === 1 ? "DII" : j % 5 === 2 ? "Mutual Fund" : j % 5 === 3 ? "Pension" : "Insurance";
      const pctHeld = 1 + seeded(i * 50 + j * 7 + 2) * 12;
      const shares = Math.floor(pctHeld * 1e6 * (1 + seeded(i + j) * 5));
      const changePct = (seeded(i * 50 + j * 7 + 3) - 0.45) * 2;
      holders.push({ name, type, shares, pctHeld, changePct });
      totalPct += pctHeld;
    }
    holders.sort((a, b) => b.pctHeld - a.pctHeld);
    const fiiPct = holders.filter((h) => h.type === "FII").reduce((a, b) => a + b.pctHeld, 0);
    const diiPct = holders.filter((h) => h.type === "DII").reduce((a, b) => a + b.pctHeld, 0);
    out.push({
      symbol: meta.symbol,
      name: meta.name,
      totalInstPct: totalPct,
      fiiPct,
      diiPct,
      holders,
    });
  }
  return out;
}

export function InstitutionalHoldings({ onOpenStock }: InstitutionalHoldingsProps) {
  const data = useMemo(buildHoldings, []);
  const [selected, setSelected] = useState(0);
  const stock = data[selected];

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Landmark size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Institutional Holdings</h2>
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

      {/* Summary cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="card p-4">
          <div className="text-xs text-ink-500 mb-1">Total Institutional</div>
          <div className="text-2xl font-mono text-ink-100">{fmtNum(stock.totalInstPct, 1)}%</div>
          <div className="text-sm text-ink-400 mt-1 truncate">{stock.name}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-500 mb-1 flex items-center gap-1">
            <Building size={12} /> FII Holdings
          </div>
          <div className="text-2xl font-mono text-brand-300">{fmtNum(stock.fiiPct, 1)}%</div>
          <div className="text-sm text-ink-500 mt-1">Foreign Institutional</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-500 mb-1 flex items-center gap-1">
            <PieChart size={12} /> DII Holdings
          </div>
          <div className="text-2xl font-mono text-accent-400">{fmtNum(stock.diiPct, 1)}%</div>
          <div className="text-sm text-ink-500 mt-1">Domestic Institutional</div>
        </div>
      </div>

      {/* Holders table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-ink-100">{stock.symbol} - Top Institutional Holders</h3>
          <span className="text-xs text-ink-500">{stock.holders.length} holders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-ink-900/50">
                <th className="text-left py-3 px-4 font-medium text-ink-400">Institution</th>
                <th className="text-center py-3 px-4 font-medium text-ink-400">Type</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Shares</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">% Held</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">QoQ Change</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {stock.holders.map((h, idx) => {
                const positive = h.changePct >= 0;
                return (
                  <tr
                    key={idx}
                    onClick={() => onOpenStock(stock.symbol)}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-semibold text-ink-100">{h.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`chip text-xs ${
                        h.type === "FII" ? "bg-brand-500/20 text-brand-300" :
                        h.type === "DII" ? "bg-accent-400/20 text-accent-400" :
                        "bg-ink-700 text-ink-300"
                      }`}>{h.type}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-300">{fmtNum(h.shares, 0)}</td>
                    <td className="py-3 px-4 text-right font-mono text-ink-200">{fmtNum(h.pctHeld, 2)}%</td>
                    <td className={`py-3 px-4 text-right font-mono hidden sm:table-cell ${positive ? "text-bull" : "text-bear"}`}>
                      {positive ? "+" : ""}{fmtPctRaw(h.changePct)}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight size={14} className="text-ink-600" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InstitutionalHoldings;
