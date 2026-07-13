import { useMemo } from "react";
import { Building2 } from "lucide-react";
import { REAL_STOCKS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtCompact } from "../lib/format";

interface InstitutionHolding {
  institution: string;
  type: "FII" | "DII";
  holdings: number;
  change: number;
  topStock: string;
}

const FIIS = ["BlackRock", "Vanguard", "Fidelity", "T Rowe Price", "Capital Group", "Norges Bank", "Temasek", "GIC"];
const DIIS = ["LIC India", "SBI Mutual Fund", "HDFC Mutual Fund", "ICICI Prudential", "Nippon India", "Axis MF", "Kotak Mahindra", "UTI AMC"];

function buildHoldings(): InstitutionHolding[] {
  const out: InstitutionHolding[] = [];
  const top = REAL_STOCKS.slice(0, 40);
  for (let i = 0; i < FIIS.length; i++) {
    const meta = top[i % top.length];
    const q = getQuote(meta.symbol);
    const holdings = q.marketCap * (0.02 + (i % 5) * 0.01);
    out.push({
      institution: FIIS[i],
      type: "FII",
      holdings,
      change: ((i * 3) % 10 - 4) * 0.1,
      topStock: meta.symbol,
    });
  }
  for (let i = 0; i < DIIS.length; i++) {
    const meta = top[(i + 8) % top.length];
    const q = getQuote(meta.symbol);
    const holdings = q.marketCap * (0.015 + (i % 5) * 0.008);
    out.push({
      institution: DIIS[i],
      type: "DII",
      holdings,
      change: ((i * 5) % 10 - 3) * 0.1,
      topStock: meta.symbol,
    });
  }
  return out;
}

export function InstitutionalHoldings({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatCompact } = useCurrency();
  const rows = useMemo(() => buildHoldings(), []);
  const fiiTotal = rows.filter((r) => r.type === "FII").reduce((s, r) => s + r.holdings, 0);
  const diiTotal = rows.filter((r) => r.type === "DII").reduce((s, r) => s + r.holdings, 0);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Building2 className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Institutional Holdings</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{rows.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 animate-slide-up flex flex-col gap-1">
          <span className="text-base text-ink-400">Total FII Holdings</span>
          <span className="text-2xl font-bold text-brand-300">{formatCompact(fiiTotal)}</span>
        </div>
        <div className="card p-4 animate-slide-up flex flex-col gap-1">
          <span className="text-base text-ink-400">Total DII Holdings</span>
          <span className="text-2xl font-bold text-accent">{formatCompact(diiTotal)}</span>
        </div>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Institution</th>
              <th className="text-left p-4 font-medium">Type</th>
              <th className="text-right p-4 font-medium">Holdings</th>
              <th className="text-right p-4 font-medium">Change</th>
              <th className="text-left p-4 font-medium">Top Holding</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const up = r.change >= 0;
              return (
                <tr
                  key={i}
                  onClick={() => onOpenStock(r.topStock)}
                  className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
                >
                  <td className="p-4 text-ink-100 font-semibold">{r.institution}</td>
                  <td className="p-4">
                    <span className={`chip ${r.type === "FII" ? "bg-brand-500/15 text-brand-300" : "bg-accent/15 text-accent"}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="p-4 text-right text-ink-200">{formatCompact(r.holdings)}</td>
                  <td className={`p-4 text-right font-medium ${up ? "text-bull" : "text-bear"}`}>
                    {(up ? "+" : "") + r.change.toFixed(1) + "%"}
                  </td>
                  <td className="p-4 text-ink-300">{r.topStock}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
