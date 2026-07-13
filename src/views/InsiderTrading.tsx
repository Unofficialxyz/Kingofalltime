import { useMemo, useState } from "react";
import { UserCircle, ArrowUpCircle, ArrowDownCircle, Filter } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { useCurrency } from "../lib/currency";
import { fmtNum, fmtCompact, fmtDate } from "../lib/format";

interface InsiderTradingProps {
  onOpenStock: (s: string) => void;
}

type TradeType = "Buy" | "Sell";

interface InsiderTrade {
  id: number;
  symbol: string;
  name: string;
  officer: string;
  title: string;
  type: TradeType;
  shares: number;
  price: number;
  value: number;
  date: string;
}

const TRADE_COUNT = 30;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const OFFICERS = ["Rajesh Kumar", "Sarah Chen", "Michael Brown", "Priya Sharma", "David Lee", "Anita Desai", "John Carter", "Wei Zhang", "Emma Wilson", "Carlos Mendez"];
const TITLES = ["CEO", "CFO", "CTO", "Director", "VP - Sales", "COO", "Board Member", "President"];

function buildTrades(): InsiderTrade[] {
  const out: InsiderTrade[] = [];
  const base = new Date("2025-07-01").getTime();
  for (let i = 0; i < TRADE_COUNT; i++) {
    const meta = STOCK_UNIVERSE[(i * 89) % STOCK_UNIVERSE.length];
    const type: TradeType = seeded(i * 3 + 1) > 0.45 ? "Sell" : "Buy";
    const shares = Math.floor(100 + seeded(i * 5 + 2) * 99900);
    const price = 20 + seeded(i * 7 + 4) * 480;
    out.push({
      id: i,
      symbol: meta.symbol,
      name: meta.name,
      officer: OFFICERS[i % OFFICERS.length],
      title: TITLES[i % TITLES.length],
      type,
      shares,
      price,
      value: shares * price,
      date: new Date(base + i * 86400000 * 2).toISOString().slice(0, 10),
    });
  }
  return out;
}

export function InsiderTrading({ onOpenStock }: InsiderTradingProps) {
  const [filter, setFilter] = useState<"all" | "Buy" | "Sell">("all");
  const { formatPrice } = useCurrency();
  const all = useMemo(buildTrades, []);
  const rows = useMemo(() => {
    if (filter === "all") return all;
    return all.filter((t) => t.type === filter);
  }, [all, filter]);

  const buyValue = all.filter((t) => t.type === "Buy").reduce((a, b) => a + b.value, 0);
  const sellValue = all.filter((t) => t.type === "Sell").reduce((a, b) => a + b.value, 0);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <UserCircle size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Insider Trading</h2>
        <span className="chip bg-ink-800 text-ink-400">{all.length} transactions</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bull">
            <ArrowUpCircle size={14} /> {fmtCompact(buyValue)} bought
          </span>
          <span className="flex items-center gap-1 text-bear">
            <ArrowDownCircle size={14} /> {fmtCompact(sellValue)} sold
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter size={14} className="text-ink-500" />
        {(["all", "Buy", "Sell"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip transition ${filter === f ? "bg-brand-500 text-ink-50" : "bg-ink-800 text-ink-400 hover:text-ink-200"}`}
          >
            {f === "all" ? "All" : f + "s Only"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-ink-900/50">
                <th className="text-left py-3 px-4 font-medium text-ink-400">Insider</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">Title</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400">Symbol</th>
                <th className="text-center py-3 px-4 font-medium text-ink-400">Type</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Shares</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden md:table-cell">Price</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Value</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => onOpenStock(t.symbol)}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition"
                >
                  <td className="py-3 px-4 text-ink-200 whitespace-nowrap">{t.officer}</td>
                  <td className="py-3 px-4 text-ink-500 hidden sm:table-cell">{t.title}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-ink-100">{t.symbol}</div>
                    <div className="text-xs text-ink-500 truncate max-w-[140px]">{t.name}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`chip text-xs ${t.type === "Buy" ? "bg-bull/20 text-bull" : "bg-bear/20 text-bear"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-ink-300">{fmtNum(t.shares, 0)}</td>
                  <td className="py-3 px-4 text-right font-mono text-ink-400 hidden md:table-cell">{formatPrice(t.price)}</td>
                  <td className={`py-3 px-4 text-right font-mono ${t.type === "Buy" ? "text-bull" : "text-bear"}`}>
                    {fmtCompact(t.value)}
                  </td>
                  <td className="py-3 px-4 text-ink-500 hidden lg:table-cell">{fmtDate(t.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-ink-500">
        Insider transactions are reported within 2 business days. Click any row to view stock details.
      </div>
    </div>
  );
}

export default InsiderTrading;
