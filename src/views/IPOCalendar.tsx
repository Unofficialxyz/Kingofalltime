import { useMemo } from "react";
import { Rocket, Calendar, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { fmtCompact, fmtNum } from "../lib/format";

interface IPOCalendarProps {
  onOpenStock: (s: string) => void;
}

interface IPO {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  priceLow: number;
  priceHigh: number;
  date: string;
  issueSize: number;
  subscription: number;
  status: "Upcoming" | "Open" | "Closed" | "Listed";
}

const IPO_COUNT = 20;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function buildIPOs(): IPO[] {
  const out: IPO[] = [];
  const statuses: IPO["status"][] = ["Upcoming", "Open", "Closed", "Listed"];
  const base = new Date("2025-07-15").getTime();
  for (let i = 0; i < IPO_COUNT; i++) {
    const meta = STOCK_UNIVERSE[(i * 37) % STOCK_UNIVERSE.length];
    const priceLow = 50 + Math.floor(seeded(i * 3 + 1) * 1450);
    const priceHigh = priceLow + Math.floor(seeded(i * 5 + 2) * 600) + 20;
    const date = new Date(base + i * 86400000 * 4).toISOString().slice(0, 10);
    const issueSize = (500 + seeded(i * 7 + 4) * 9500) * 1e7;
    const sub = seeded(i * 11 + 6) * 45;
    out.push({
      id: i,
      symbol: meta.symbol,
      name: meta.name,
      sector: meta.sector,
      priceLow,
      priceHigh,
      date,
      issueSize,
      subscription: sub,
      status: statuses[i % statuses.length],
    });
  }
  return out;
}

function statusColor(s: IPO["status"]): string {
  switch (s) {
    case "Open": return "bg-bull/20 text-bull";
    case "Upcoming": return "bg-brand-500/20 text-brand-300";
    case "Closed": return "bg-ink-700 text-ink-300";
    case "Listed": return "bg-accent-400/20 text-accent-400";
    default: return "bg-ink-700 text-ink-300";
  }
}

export function IPOCalendar({ onOpenStock }: IPOCalendarProps) {
  const ipos = useMemo(buildIPOs, []);

  const totalIssue = ipos.reduce((a, b) => a + b.issueSize, 0);
  const openCount = ipos.filter((i) => i.status === "Open").length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Rocket size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">IPO Calendar</h2>
        <span className="chip bg-ink-800 text-ink-400">{ipos.length} offerings</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-ink-400">
            <DollarSign size={14} className="text-bull" /> {fmtCompact(totalIssue)}
          </span>
          <span className="flex items-center gap-1 text-bull">
            <TrendingUp size={14} /> {openCount} open
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ipos.map((ipo) => (
          <div
            key={ipo.id}
            className="card card-hover p-4 cursor-pointer"
            onClick={() => onOpenStock(ipo.symbol)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0">
                  <Building2 size={16} className="text-brand-300" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-ink-100 truncate">{ipo.symbol}</div>
                  <div className="text-xs text-ink-500 truncate">{ipo.name}</div>
                </div>
              </div>
              <span className={`chip ${statusColor(ipo.status)} text-xs`}>{ipo.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <div className="text-xs text-ink-500">Price Band</div>
                <div className="font-mono text-ink-200">
                  {"\u20B9"}{fmtNum(ipo.priceLow, 0)} - {fmtNum(ipo.priceHigh, 0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Issue Size</div>
                <div className="font-mono text-ink-200">{fmtCompact(ipo.issueSize)}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500 flex items-center gap-1">
                  <Calendar size={11} /> Date
                </div>
                <div className="font-mono text-ink-200">{ipo.date}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Subscription</div>
                <div className={`font-mono ${ipo.subscription > 10 ? "text-bull" : "text-ink-200"}`}>
                  {fmtNum(ipo.subscription, 2)}x
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-ink-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-400"
                  style={{ width: Math.min(ipo.subscription * 5, 100) + "%" }}
                />
              </div>
              <span className="text-xs text-ink-500">{ipo.sector}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IPOCalendar;
