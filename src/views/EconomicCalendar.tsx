import { useMemo, useState } from "react";
import { Globe, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { fmtNum } from "../lib/format";

interface EconomicCalendarProps {
  onOpenStock: (s: string) => void;
}

type Importance = "High" | "Medium" | "Low";
type EventCategory = "GDP" | "Inflation" | "Interest Rate" | "Unemployment" | "Manufacturing" | "Trade";

interface EconEvent {
  id: number;
  date: string;
  time: string;
  country: string;
  flag: string;
  event: string;
  category: EventCategory;
  importance: Importance;
  actual: number | null;
  forecast: number;
  previous: number;
  unit: string;
}

const EVENT_COUNT = 25;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const COUNTRIES: [string, string][] = [
  ["United States", "\u{1F1FA}\u{1F1F8}"],
  ["India", "\u{1F1EE}\u{1F1F3}"],
  ["Eurozone", "\u{1F1EA}\u{1F1FA}"],
  ["United Kingdom", "\u{1F1EC}\u{1F1E7}"],
  ["Japan", "\u{1F1EF}\u{1F1F5}"],
  ["China", "\u{1F1E8}\u{1F1F3}"],
  ["Germany", "\u{1F1E9}\u{1F1EA}"],
  ["Australia", "\u{1F1E6}\u{1F1FA}"],
  ["Canada", "\u{1F1E8}\u{1F1E6}"],
  ["Brazil", "\u{1F1E7}\u{1F1F7}"],
];

const EVENT_NAMES: Record<EventCategory, string[]> = {
  GDP: ["GDP Growth Rate QoQ", "GDP Annualized Rate", "GDP Price Index"],
  Inflation: ["CPI YoY", "Core CPI MoM", "PPI MoM", "PCE Price Index"],
  "Interest Rate": ["Fed Funds Rate", "Policy Rate Decision", "Bank Rate"],
  Unemployment: ["Unemployment Rate", "Non-Farm Payrolls", "Initial Jobless Claims"],
  Manufacturing: ["Manufacturing PMI", "Industrial Production", "Factory Orders"],
  Trade: ["Trade Balance", "Current Account", "Retail Sales"],
};

const UNITS: Record<EventCategory, string> = {
  GDP: "%",
  Inflation: "%",
  "Interest Rate": "%",
  Unemployment: "%",
  Manufacturing: "",
  Trade: "B",
};

function buildEvents(): EconEvent[] {
  const out: EconEvent[] = [];
  const base = new Date("2025-07-15").getTime();
  const cats: EventCategory[] = ["GDP", "Inflation", "Interest Rate", "Unemployment", "Manufacturing", "Trade"];
  const imps: Importance[] = ["High", "Medium", "Low"];
  for (let i = 0; i < EVENT_COUNT; i++) {
    const [country, flag] = COUNTRIES[i % COUNTRIES.length];
    const cat = cats[i % cats.length];
    const names = EVENT_NAMES[cat];
    const event = names[Math.floor(seeded(i * 3 + 1) * names.length)];
    const forecast = seeded(i * 5 + 2) * 10 - 2;
    const previous = forecast + (seeded(i * 7 + 4) - 0.5) * 3;
    const hasActual = i % 4 !== 0;
    const actual = hasActual ? forecast + (seeded(i * 11 + 6) - 0.5) * 2 : null;
    const hour = 8 + Math.floor(seeded(i * 13 + 8) * 10);
    out.push({
      id: i,
      date: new Date(base + Math.floor(i / 3) * 86400000).toISOString().slice(0, 10),
      time: String(hour).padStart(2, "0") + ":30",
      country,
      flag,
      event,
      category: cat,
      importance: imps[i % imps.length],
      actual,
      forecast,
      previous,
      unit: UNITS[cat],
    });
  }
  return out;
}

function impColor(imp: Importance): string {
  switch (imp) {
    case "High": return "bg-bear/20 text-bear";
    case "Medium": return "bg-accent-400/20 text-accent-400";
    case "Low": return "bg-ink-700 text-ink-400";
  }
}

export function EconomicCalendar({ onOpenStock }: EconomicCalendarProps) {
  const [filter, setFilter] = useState<"all" | "High" | "Medium" | "Low">("all");
  const all = useMemo(buildEvents, []);
  const rows = useMemo(() => {
    if (filter === "all") return all;
    return all.filter((e) => e.importance === filter);
  }, [all, filter]);

  const highCount = all.filter((e) => e.importance === "High").length;
  const released = all.filter((e) => e.actual !== null).length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Globe size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Economic Calendar</h2>
        <span className="chip bg-ink-800 text-ink-400">{all.length} events</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bear">
            <AlertTriangle size={14} /> {highCount} high impact
          </span>
          <span className="flex items-center gap-1 text-bull">
            <TrendingUp size={14} /> {released} released
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "High", "Medium", "Low"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip transition ${filter === f ? "bg-brand-500 text-ink-50" : "bg-ink-800 text-ink-400 hover:text-ink-200"}`}
          >
            {f === "all" ? "All" : f + " Priority"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-ink-900/50">
                <th className="text-left py-3 px-4 font-medium text-ink-400">Date</th>
                <th className="text-center py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">Time</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400">Country</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400">Event</th>
                <th className="text-center py-3 px-4 font-medium text-ink-400">Importance</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Actual</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Forecast</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400 hidden md:table-cell">Previous</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const beat = e.actual !== null && e.actual >= e.forecast;
                return (
                  <tr
                    key={e.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition"
                  >
                    <td className="py-3 px-4 font-mono text-ink-300 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-ink-600" /> {e.date}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-ink-500 hidden sm:table-cell">{e.time}</td>
                    <td className="py-3 px-4 text-ink-200 whitespace-nowrap">
                      <span className="mr-1">{e.flag}</span> {e.country}
                    </td>
                    <td className="py-3 px-4 text-ink-300">{e.event}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`chip text-xs ${impColor(e.importance)}`}>{e.importance}</span>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono ${e.actual === null ? "text-ink-600" : beat ? "text-bull" : "text-bear"}`}>
                      {e.actual === null ? "—" : fmtNum(e.actual, 1) + e.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-400">{fmtNum(e.forecast, 1) + e.unit}</td>
                    <td className="py-3 px-4 text-right font-mono text-ink-500 hidden md:table-cell">{fmtNum(e.previous, 1) + e.unit}</td>
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

export default EconomicCalendar;
