import { useMemo } from "react";
import { Bitcoin, TrendingUp, TrendingDown, Coins } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import { fmtNum, fmtCompact, fmtPctRaw } from "../lib/format";

interface CryptoTrackerProps {
  onOpenStock: (s: string) => void;
}

interface Crypto {
  id: number;
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  marketCap: number;
  volume: number;
  supply: number;
  spark: number[];
}

const CRYPTO_COUNT = 30;

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const CRYPTO_NAMES: [string, string, number][] = [
  ["BTC", "Bitcoin", 65000],
  ["ETH", "Ethereum", 3500],
  ["BNB", "BNB", 580],
  ["SOL", "Solana", 145],
  ["XRP", "XRP", 0.52],
  ["ADA", "Cardano", 0.45],
  ["DOGE", "Dogecoin", 0.12],
  ["AVAX", "Avalanche", 35],
  ["TRX", "TRON", 0.13],
  ["DOT", "Polkadot", 7.2],
  ["MATIC", "Polygon", 0.72],
  ["LINK", "Chainlink", 14.5],
  ["LTC", "Litecoin", 85],
  ["BCH", "Bitcoin Cash", 410],
  ["UNI", "Uniswap", 9.8],
  ["ATOM", "Cosmos", 8.5],
  ["XLM", "Stellar", 0.11],
  ["ICP", "Internet Computer", 12.3],
  ["FIL", "Filecoin", 5.6],
  ["HBAR", "Hedera", 0.09],
  ["VET", "VeChain", 0.03],
  ["SAND", "The Sandbox", 0.45],
  ["MANA", "Decentraland", 0.42],
  ["AXS", "Axie Infinity", 6.8],
  ["THETA", "Theta Network", 1.6],
  ["EOS", "EOS", 0.68],
  ["AAVE", "Aave", 98],
  ["FTM", "Fantom", 0.72],
  ["NEAR", "NEAR Protocol", 5.2],
  ["ALGO", "Algorand", 0.18],
];

function buildCryptos(): Crypto[] {
  const out: Crypto[] = [];
  for (let i = 0; i < CRYPTO_COUNT; i++) {
    const [symbol, name, basePrice] = CRYPTO_NAMES[i];
    const changePct = (seeded(i * 3 + 1) - 0.45) * 18;
    const price = basePrice * (1 + changePct / 100);
    const supply = (1e9 + seeded(i * 5 + 2) * 9e10) / (basePrice > 100 ? 100 : 1);
    const spark: number[] = [];
    let p = basePrice * 0.95;
    for (let j = 0; j < 20; j++) {
      p *= 1 + (seeded(i * 100 + j * 7) - 0.48) * 0.04;
      spark.push(p);
    }
    out.push({
      id: i,
      symbol,
      name,
      price,
      changePct,
      marketCap: price * supply,
      volume: supply * (0.02 + seeded(i * 7 + 4) * 0.08),
      supply,
      spark,
    });
  }
  return out;
}

export function CryptoTracker({ onOpenStock }: CryptoTrackerProps) {
  const cryptos = useMemo(buildCryptos, []);
  const totalMcap = cryptos.reduce((a, b) => a + b.marketCap, 0);
  const gainers = cryptos.filter((c) => c.changePct > 0).length;
  const losers = cryptos.length - gainers;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Bitcoin size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">Crypto Tracker</h2>
        <span className="chip bg-ink-800 text-ink-400">{cryptos.length} coins</span>
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span className="flex items-center gap-1 text-ink-400">
            <Coins size={14} /> MCap: {fmtCompact(totalMcap)}
          </span>
          <span className="flex items-center gap-1 text-bull">
            <TrendingUp size={14} /> {gainers} up
          </span>
          <span className="flex items-center gap-1 text-bear">
            <TrendingDown size={14} /> {losers} down
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cryptos.map((c) => {
          const positive = c.changePct >= 0;
          return (
            <div
              key={c.id}
              className="card card-hover p-4 cursor-pointer"
              onClick={() => onOpenStock(c.symbol)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-400/20 flex items-center justify-center text-xs font-bold text-ink-100">
                    {c.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-ink-100">{c.symbol}</div>
                    <div className="text-xs text-ink-500 truncate max-w-[120px]">{c.name}</div>
                  </div>
                </div>
                <Sparkline points={c.spark} positive={positive} width={60} height={28} />
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-lg font-mono text-ink-100">
                    ${c.price < 1 ? fmtNum(c.price, 4) : fmtNum(c.price, 2)}
                  </div>
                  <div className={`text-sm font-mono ${positive ? "text-bull" : "text-bear"}`}>
                    {positive ? "+" : ""}{fmtPctRaw(c.changePct)}%
                  </div>
                </div>
                <div className="text-right text-xs text-ink-500">
                  <div>MCap {fmtCompact(c.marketCap)}</div>
                  <div>Vol {fmtCompact(c.volume)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CryptoTracker;
