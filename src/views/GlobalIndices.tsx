import { useMemo } from "react";
import { Globe } from "lucide-react";
import { fmtPct } from "../lib/format";

interface IndexEntry {
  name: string;
  country: string;
  flag: string;
  value: number;
  change: number;
  changePct: number;
}

const INDICES: [string, string, string, number, number][] = [
  ["NIFTY 50", "India", "🇮🇳", 23765, 125.4],
  ["SENSEX", "India", "🇮🇳", 78200, 410.2],
  ["NIFTY Bank", "India", "🇮🇳", 51230, -85.3],
  ["DOW JONES", "USA", "🇺🇸", 42150, 180.5],
  ["NASDAQ", "USA", "🇺🇸", 18250, 95.8],
  ["S&P 500", "USA", "🇺🇸", 5225, 22.4],
  ["RUSSELL 2000", "USA", "🇺🇸", 2085, -12.3],
  ["FTSE 100", "UK", "🇬🇧", 8120, 15.2],
  ["DAX", "Germany", "🇩🇪", 18450, 65.8],
  ["CAC 40", "France", "🇫🇷", 7920, -22.1],
  ["NIKKEI 225", "Japan", "🇯🇵", 39580, 210.5],
  ["TOPIX", "Japan", "🇯🇵", 2740, 8.2],
  ["HANG SENG", "HongKong", "🇭🇰", 17250, -95.4],
  ["SHANGHAI", "China", "🇨🇳", 3180, 12.5],
  ["SHENZHEN", "China", "🇨🇳", 9850, -35.2],
  ["KOSPI", "Korea", "🇰🇷", 2680, 18.3],
  ["TAIEX", "Taiwan", "🇹🇼", 20150, 85.6],
  ["STI", "Singapore", "🇸🇬", 3280, -5.2],
  ["ASX 200", "Australia", "🇦🇺", 7820, 32.1],
  ["BOVESPA", "Brazil", "🇧🇷", 128500, -450.8],
  ["IPC", "Mexico", "🇲🇽", 56200, 125.3],
  ["JSE TOP 40", "South Africa", "🇿🇦", 75800, 210.5],
  ["TADAWUL", "SaudiArabia", "🇸🇦", 11250, -35.2],
  ["BIST 100", "Turkey", "🇹🇷", 9850, 85.6],
  ["SET", "Thailand", "🇹🇭", 1380, -5.2],
  ["JKSE", "Indonesia", "🇮🇩", 7380, 32.1],
  ["FTSE Bursa KLCI", "Malaysia", "🇲🇾", 1585, 2.3],
  ["PSEi", "Philippines", "🇵🇭", 6250, -12.5],
  ["VN-Index", "Vietnam", "🇻🇳", 1280, 8.5],
  ["SMI", "Switzerland", "🇨🇭", 11850, 25.4],
];

function buildIndices(): IndexEntry[] {
  return INDICES.map((idx) => {
    const [name, country, flag, value, change] = idx;
    const changePct = (change / (value - change)) * 100;
    return { name, country, flag, value, change, changePct };
  });
}

export function GlobalIndices({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const rows = useMemo(() => buildIndices(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Globe className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Global Indices</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{rows.length}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {rows.map((r) => {
          const up = r.change >= 0;
          return (
            <button
              key={r.name}
              onClick={() => onOpenStock(r.name)}
              className="card card-hover p-4 animate-slide-up flex flex-col gap-2 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.flag}</span>
                  <span className="text-base font-semibold text-ink-100">{r.name}</span>
                </div>
                <span className="text-sm text-ink-500">{r.country}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-bold text-ink-100">
                  {r.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className="flex flex-col items-end">
                  <span className={`text-base font-medium ${up ? "text-bull" : "text-bear"}`}>
                    {up ? "+" : ""}{r.change.toFixed(2)}
                  </span>
                  <span className={`text-sm font-medium ${up ? "text-bull" : "text-bear"}`}>
                    {fmtPct(r.changePct)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
