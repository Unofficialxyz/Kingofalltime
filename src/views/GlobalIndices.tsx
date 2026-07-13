import { useMemo } from "react";
import { Globe, TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import { fmtNum, fmtPctRaw, fmtCompact } from "../lib/format";

interface GlobalIndicesProps {
  onOpenStock: (s: string) => void;
}

interface IndexData {
  id: number;
  name: string;
  country: string;
  flag: string;
  value: number;
  changePct: number;
  change: number;
  spark: number[];
}

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const INDICES: [string, string, string, number][] = [
  ["Nifty 50", "India", "\u{1F1EE}\u{1F1F3}", 24800],
  ["Sensex", "India", "\u{1F1EE}\u{1F1F3}", 81200],
  ["S&P 500", "United States", "\u{1F1FA}\u{1F1F8}", 5600],
  ["NASDAQ", "United States", "\u{1F1FA}\u{1F1F8}", 18350],
  ["Dow Jones", "United States", "\u{1F1FA}\u{1F1F8}", 41500],
  ["FTSE 100", "United Kingdom", "\u{1F1EC}\u{1F1E7}", 8200],
  ["DAX", "Germany", "\u{1F1E9}\u{1F1EA}", 18700],
  ["CAC 40", "France", "\u{1F1EB}\u{1F1F7}", 7650],
  ["Nikkei 225", "Japan", "\u{1F1EF}\u{1F1F5}", 41200],
  ["Hang Seng", "Hong Kong", "\u{1F1ED}\u{1F1F0}", 17600],
  ["Shanghai", "China", "\u{1F1E8}\u{1F1F3}", 2950],
  ["KOSPI", "South Korea", "\u{1F1F0}\u{1F1F7}", 2850],
  ["ASX 200", "Australia", "\u{1F1E6}\u{1F1FA}", 7850],
  ["TSX", "Canada", "\u{1F1E8}\u{1F1E6}", 19800],
  ["Bovespa", "Brazil", "\u{1F1E7}\u{1F1F7}", 127000],
  ["Straits Times", "Singapore", "\u{1F1F8}\u{1F1EC}", 3350],
  ["TAIEX", "Taiwan", "\u{1F1F9}\u{1F1FC}", 22800],
  ["S&P/ASX 200", "Australia", "\u{1F1E6}\u{1F1FA}", 7850],
];

function buildIndices(): IndexData[] {
  const out: IndexData[] = [];
  for (let i = 0; i < INDICES.length; i++) {
    const [name, country, flag, baseValue] = INDICES[i];
    const changePct = (seeded(i * 3 + 1) - 0.48) * 3;
    const change = baseValue * changePct / 100;
    const value = baseValue + change;
    const spark: number[] = [];
    let p = baseValue * 0.99;
    for (let j = 0; j < 24; j++) {
      p *= 1 + (seeded(i * 100 + j * 7) - 0.49) * 0.008;
      spark.push(p);
    }
    out.push({ id: i, name, country, flag, value, changePct, change, spark });
  }
  return out;
}

export function GlobalIndices({ onOpenStock }: GlobalIndicesProps) {
  const indices = useMemo(buildIndices, []);
  const gainers = indices.filter((i) => i.changePct > 0).length;
  const losers = indices.length - gainers;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Globe size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Global Indices</h2>
        <span className="chip bg-ink-800 text-ink-400">{indices.length} indices</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-bull">
            <TrendingUp size={14} /> {gainers} up
          </span>
          <span className="flex items-center gap-1 text-bear">
            <TrendingDown size={14} /> {losers} down
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {indices.map((idx) => {
          const positive = idx.changePct >= 0;
          return (
            <div
              key={idx.id}
              className="card card-hover p-4 cursor-pointer"
              onClick={() => onOpenStock(idx.name)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{idx.flag}</span>
                  <div>
                    <div className="font-semibold text-ink-100">{idx.name}</div>
                    <div className="text-xs text-ink-500">{idx.country}</div>
                  </div>
                </div>
                <Sparkline points={idx.spark} positive={positive} width={70} height={28} />
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xl font-mono text-ink-100">{fmtNum(idx.value, 2)}</div>
                  <div className={`text-sm font-mono ${positive ? "text-bull" : "text-bear"}`}>
                    {positive ? "+" : ""}{fmtNum(idx.change, 2)} ({positive ? "+" : ""}{fmtPctRaw(idx.changePct)}%)
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs ${positive ? "text-bull" : "text-bear"}`}>
                  {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-ink-500">
        Global indices track major markets worldwide. Click any card to explore related stocks.
      </div>
    </div>
  );
}

export default GlobalIndices;
