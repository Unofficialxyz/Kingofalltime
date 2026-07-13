import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { useCurrency } from "../lib/currency";

interface IPOEntry {
  date: string;
  company: string;
  symbol: string;
  priceLow: number;
  priceHigh: number;
  lotSize: number;
  issueSize: number; // in crores
}

function buildIPOs(): IPOEntry[] {
  const names: [string, string][] = [
    ["Nexus Tech Solutions", "NEXUSTECH"],
    ["Bharat Green Energy", "BHARATGE"],
    ["Pinnacle Robotics", "PINNACLE"],
    ["Orbit Cloud Systems", "ORBITCLOUD"],
    ["Veda Pharma Labs", "VEDAPHARMA"],
    ["Quantum Leap AI", "QUANTLEAP"],
    ["Stellar Aerospace", "STELLARAERO"],
    ["Apex Fintech Group", "APEXFIN"],
    ["GreenLeaf AgriTech", "GREENLEAF"],
    ["Titan EV Motors", "TITANEV"],
    ["NovaSpace Technologies", "NOVASPACE"],
    ["Pioneer Biotech", "PIONEERBIO"],
    ["Crystal Semiconductor", "CRYSTALSEMI"],
    ["Vanguard Cybersec", "VANGUARDCS"],
    ["Summit Renewable", "SUMMITREN"],
  ];
  const out: IPOEntry[] = [];
  const base = new Date("2025-01-20").getTime();
  const day = 24 * 60 * 60 * 1000;
  for (let i = 0; i < names.length; i++) {
    const low = 50 + ((i * 37) % 400);
    const high = low + 20 + ((i * 13) % 80);
    out.push({
      date: new Date(base + i * 4 * day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      company: names[i][0],
      symbol: names[i][1],
      priceLow: low,
      priceHigh: high,
      lotSize: [25, 50, 100, 200][i % 4],
      issueSize: 200 + ((i * 137) % 1800),
    });
  }
  return out;
}

export function IPOCalendar({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice, formatCompact } = useCurrency();
  const ipos = useMemo(() => buildIPOs(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">IPO Calendar</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{ipos.length}</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Company</th>
              <th className="text-right p-4 font-medium">Price Band</th>
              <th className="text-right p-4 font-medium">Lot Size</th>
              <th className="text-right p-4 font-medium">Issue Size</th>
            </tr>
          </thead>
          <tbody>
            {ipos.map((ipo, i) => (
              <tr
                key={i}
                onClick={() => onOpenStock(ipo.symbol)}
                className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
              >
                <td className="p-4 text-ink-300 whitespace-nowrap">{ipo.date}</td>
                <td className="p-4">
                  <div className="text-ink-100 font-semibold">{ipo.company}</div>
                  <div className="text-sm text-ink-500">{ipo.symbol}</div>
                </td>
                <td className="p-4 text-right text-ink-200 whitespace-nowrap">
                  {formatPrice(ipo.priceLow)} - {formatPrice(ipo.priceHigh)}
                </td>
                <td className="p-4 text-right text-ink-200">{ipo.lotSize}</td>
                <td className="p-4 text-right text-ink-200 whitespace-nowrap">
                  {formatCompact(ipo.issueSize * 10000000)} Cr
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
