import { useMemo } from "react";
import { Coins } from "lucide-react";
import { useCurrency } from "../lib/currency";
import { fmtPct } from "../lib/format";

interface Commodity {
  name: string;
  symbol: string;
  price: number;
  change: number;
  unit: string;
}

const COMMODITIES: [string, string, number, number, string][] = [
  ["Gold", "XAU", 2350, 0.8, "per oz"],
  ["Silver", "XAG", 30.5, 1.2, "per oz"],
  ["Crude Oil WTI", "WTI", 78.3, -0.5, "per barrel"],
  ["Brent Crude", "BRENT", 82.1, -0.3, "per barrel"],
  ["Natural Gas", "NG", 2.15, 2.4, "per MMBtu"],
  ["Copper", "CU", 4.52, 0.6, "per lb"],
  ["Platinum", "XPT", 980, -0.2, "per oz"],
  ["Palladium", "XPD", 1020, 1.5, "per oz"],
  ["Aluminum", "AL", 2450, 0.3, "per tonne"],
  ["Zinc", "ZN", 2800, -0.4, "per tonne"],
  ["Nickel", "NI", 18500, 1.1, "per tonne"],
  ["Lead", "PB", 2150, -0.6, "per tonne"],
  ["Tin", "SN", 32000, 0.9, "per tonne"],
  ["Wheat", "WHEAT", 580, -1.2, "per bushel"],
  ["Corn", "CORN", 445, 0.4, "per bushel"],
  ["Soybeans", "SOYB", 1180, 1.8, "per bushel"],
  ["Coffee", "COFFEE", 225, 3.2, "per lb"],
  ["Sugar", "SUGAR", 0.21, 0.7, "per lb"],
  ["Cotton", "COTTON", 0.82, -0.9, "per lb"],
  ["Cocoa", "COCOA", 9500, 5.1, "per tonne"],
];

function buildCommodities(): Commodity[] {
  return COMMODITIES.map((c) => ({
    name: c[0],
    symbol: c[1],
    price: c[2],
    change: c[3],
    unit: c[4],
  }));
}

export function CommodityTracker({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice } = useCurrency();
  const rows = useMemo(() => buildCommodities(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Coins className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Commodity Tracker</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{rows.length}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {rows.map((r) => {
          const up = r.change >= 0;
          return (
            <button
              key={r.symbol}
              onClick={() => onOpenStock(r.symbol)}
              className="card card-hover p-4 animate-slide-up flex flex-col gap-2 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-ink-100">{r.name}</span>
                <span className="chip bg-brand-500/10 text-brand-300 text-sm">{r.symbol}</span>
              </div>
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-ink-100">{formatPrice(r.price)}</span>
                  <span className="text-sm text-ink-500">{r.unit}</span>
                </div>
                <span className={`text-base font-medium ${up ? "text-bull" : "text-bear"}`}>
                  {fmtPct(r.change)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
