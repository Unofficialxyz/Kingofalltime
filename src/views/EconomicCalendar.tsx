import { useMemo } from "react";
import { Globe } from "lucide-react";

type Importance = "High" | "Medium" | "Low";

interface EconEvent {
  date: string;
  event: string;
  country: string;
  importance: Importance;
  actual: string;
  forecast: string;
  previous: string;
}

function buildEvents(): EconEvent[] {
  const data: [string, string, Importance, string, string, string][] = [
    ["US CPI MoM", "USA", "High", "0.3%", "0.2%", "0.1%"],
    ["US Fed Rate Decision", "USA", "High", "5.50%", "5.50%", "5.50%"],
    ["US Nonfarm Payrolls", "USA", "High", "215K", "200K", "256K"],
    ["US GDP Growth QoQ", "USA", "High", "3.2%", "3.0%", "4.9%"],
    ["US Unemployment Rate", "USA", "High", "3.7%", "3.8%", "3.7%"],
    ["EU CPI YoY", "Europe", "High", "2.4%", "2.5%", "2.9%"],
    ["ECB Rate Decision", "Europe", "High", "4.00%", "4.00%", "4.00%"],
    ["UK CPI YoY", "UK", "High", "3.2%", "3.1%", "3.4%"],
    ["Japan CPI YoY", "Japan", "Medium", "2.8%", "2.9%", "3.3%"],
    ["China GDP YoY", "China", "High", "5.2%", "5.0%", "4.9%"],
    ["India CPI YoY", "India", "High", "5.08%", "5.10%", "5.55%"],
    ["India GDP Growth", "India", "High", "7.8%", "7.0%", "7.6%"],
    ["Germany Ifo Business Climate", "Germany", "Medium", "87.3", "87.0", "86.6"],
    ["US Retail Sales MoM", "USA", "Medium", "0.6%", "0.4%", "0.3%"],
    ["US ISM Manufacturing PMI", "USA", "High", "49.0", "48.5", "47.4"],
    ["EU GDP Growth QoQ", "Europe", "Medium", "0.4%", "0.3%", "0.2%"],
    ["UK GDP Growth QoQ", "UK", "Medium", "0.2%", "0.1%", "0.0%"],
    ["Japan Trade Balance", "Japan", "Low", "-0.5T", "-0.4T", "-0.7T"],
    ["China Retail Sales YoY", "China", "Medium", "7.6%", "7.0%", "10.1%"],
    ["India Manufacturing PMI", "India", "Medium", "57.5", "57.0", "56.9"],
  ];
  const out: EconEvent[] = [];
  const base = new Date("2025-01-10").getTime();
  const day = 24 * 60 * 60 * 1000;
  for (let i = 0; i < data.length; i++) {
    const [event, country, imp, actual, forecast, previous] = data[i];
    out.push({
      date: new Date(base + i * day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      event,
      country,
      importance: imp,
      actual,
      forecast,
      previous,
    });
  }
  return out;
}

function impChip(imp: Importance): string {
  if (imp === "High") return "bg-bear/15 text-bear";
  if (imp === "Medium") return "bg-accent/15 text-accent";
  return "bg-ink-700/40 text-ink-300";
}

export function EconomicCalendar({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const events = useMemo(() => buildEvents(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Globe className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Economic Calendar</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{events.length}</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Event</th>
              <th className="text-left p-4 font-medium">Country</th>
              <th className="text-left p-4 font-medium">Importance</th>
              <th className="text-right p-4 font-medium">Actual</th>
              <th className="text-right p-4 font-medium">Forecast</th>
              <th className="text-right p-4 font-medium">Previous</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 card-hover">
                <td className="p-4 text-ink-300 whitespace-nowrap">{e.date}</td>
                <td className="p-4 text-ink-100 font-medium">{e.event}</td>
                <td className="p-4 text-ink-300">{e.country}</td>
                <td className="p-4">
                  <span className={`chip ${impChip(e.importance)}`}>{e.importance}</span>
                </td>
                <td className="p-4 text-right text-ink-100 font-medium">{e.actual}</td>
                <td className="p-4 text-right text-ink-400">{e.forecast}</td>
                <td className="p-4 text-right text-ink-500">{e.previous}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
