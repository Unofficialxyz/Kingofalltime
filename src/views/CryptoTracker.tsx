import { useMemo } from "react";
import { Bitcoin } from "lucide-react";
import { useCurrency } from "../lib/currency";
import { fmtPct, fmtCompact } from "../lib/format";

interface CryptoEntry {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
}

const CRYPTOS: [string, string, number, number, number, number][] = [
  ["BTC", "Bitcoin", 67500, 2.3, 1330000000000, 35000000000],
  ["ETH", "Ethereum", 3450, 1.8, 414000000000, 18000000000],
  ["BNB", "BNB", 612, -0.5, 89000000000, 1500000000],
  ["SOL", "Solana", 178, 4.2, 82000000000, 3200000000],
  ["XRP", "XRP", 0.62, -1.1, 34000000000, 1200000000],
  ["ADA", "Cardano", 0.58, 3.1, 20000000000, 800000000],
  ["AVAX", "Avalanche", 38, 2.7, 15000000000, 600000000],
  ["DOGE", "Dogecoin", 0.16, 5.4, 23000000000, 1100000000],
  ["DOT", "Polkadot", 7.2, -0.8, 10000000000, 300000000],
  ["TRX", "TRON", 0.13, 1.2, 11000000000, 400000000],
  ["MATIC", "Polygon", 0.89, -2.1, 8800000000, 350000000],
  ["LINK", "Chainlink", 17, 3.8, 10000000000, 500000000],
  ["LTC", "Litecoin", 84, 0.9, 6300000000, 400000000],
  ["BCH", "Bitcoin Cash", 410, 1.5, 8100000000, 300000000],
  ["NEAR", "NEAR Protocol", 7.1, 4.5, 7800000000, 280000000],
  ["UNI", "Uniswap", 11, 2.2, 6600000000, 200000000],
  ["ATOM", "Cosmos", 9.3, -1.4, 3600000000, 120000000],
  ["ICP", "Internet Computer", 12, 6.1, 5500000000, 150000000],
  ["FIL", "Filecoin", 5.8, -3.2, 3200000000, 180000000],
  ["HBAR", "Hedera", 0.11, 7.3, 3900000000, 220000000],
  ["APT", "Aptos", 13, 5.0, 4500000000, 190000000],
  ["ARB", "Arbitrum", 1.2, 3.6, 4200000000, 250000000],
  ["OP", "Optimism", 2.8, 2.9, 3100000000, 170000000],
  ["INJ", "Injective", 28, 8.2, 2700000000, 140000000],
  ["SUI", "Sui", 1.7, 6.5, 4900000000, 210000000],
  ["SEI", "Sei", 0.58, 9.1, 2100000000, 160000000],
  ["RNDR", "Render", 9.4, 4.7, 3500000000, 130000000],
  ["AAVE", "Aave", 115, 3.3, 1700000000, 90000000],
  ["MKR", "Maker", 2800, 1.9, 2500000000, 80000000],
  ["TIA", "Celestia", 11, -2.8, 1900000000, 110000000],
];

function buildCryptos(): CryptoEntry[] {
  return CRYPTOS.map((c, i) => ({
    rank: i + 1,
    symbol: c[0],
    name: c[1],
    price: c[2],
    change24h: c[3],
    marketCap: c[4],
    volume: c[5],
  }));
}

export function CryptoTracker({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice, formatCompact } = useCurrency();
  const rows = useMemo(() => buildCryptos(), []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Bitcoin className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Crypto Tracker</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">Top {rows.length}</span>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-white/5 text-ink-400">
              <th className="text-left p-4 font-medium">#</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-right p-4 font-medium">Price</th>
              <th className="text-right p-4 font-medium">24h Change</th>
              <th className="text-right p-4 font-medium">Market Cap</th>
              <th className="text-right p-4 font-medium">Volume</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const up = r.change24h >= 0;
              return (
                <tr
                  key={r.symbol}
                  onClick={() => onOpenStock(r.symbol)}
                  className="border-b border-white/5 last:border-0 card-hover cursor-pointer"
                >
                  <td className="p-4 text-ink-500">{r.rank}</td>
                  <td className="p-4">
                    <div className="text-ink-100 font-semibold">{r.name}</div>
                    <div className="text-sm text-ink-500">{r.symbol}</div>
                  </td>
                  <td className="p-4 text-right text-ink-100 font-medium">{formatPrice(r.price)}</td>
                  <td className={`p-4 text-right font-medium ${up ? "text-bull" : "text-bear"}`}>
                    {fmtPct(r.change24h)}
                  </td>
                  <td className="p-4 text-right text-ink-200">{formatCompact(r.marketCap)}</td>
                  <td className="p-4 text-right text-ink-300">{fmtCompact(r.volume)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
