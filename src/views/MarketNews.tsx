import { useMemo, useState } from "react";
import { Newspaper, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { STOCK_UNIVERSE } from "../lib/universe";

interface MarketNewsProps {
  onOpenStock: (s: string) => void;
}

type Sentiment = "bullish" | "bearish" | "neutral";
type Category = "Earnings" | "M&A" | "Macro" | "Downgrade" | "Upgrade" | "Regulatory" | "Product" | "Analyst";

interface NewsItem {
  id: number;
  symbol: string;
  name: string;
  headline: string;
  source: string;
  time: string;
  sentiment: Sentiment;
  category: Category;
}

const NEWS_COUNT = 60;

const SOURCES = ["Bloomberg", "Reuters", "CNBC", "WSJ", "MarketWatch", "Barrons", "FT", "Seeking Alpha", "Investing.com", "ET Markets"];
const CATEGORIES: Category[] = ["Earnings", "M&A", "Macro", "Downgrade", "Upgrade", "Regulatory", "Product", "Analyst"];

const HEADLINES: Record<Category, string[]> = {
  Earnings: [
    "beats Q earnings estimates, revenue up double digits",
    "misses earnings expectations, guides lower for next quarter",
    "reports record quarterly profit, margins expand",
    "posts in-line earnings, announces buyback program",
    "earnings surprise: EPS comes in above consensus",
  ],
  "M&A": [
    "acquires rival in blockbuster deal worth billions",
    "rumored as acquisition target, stock surges",
    "merger talks confirmed, regulatory approval pending",
    "divests non-core assets to focus on growth",
    "rejects takeover bid, considers strategic alternatives",
  ],
  Macro: [
    "rises as Fed signals pause on rate hikes",
    "falls on inflation concerns and rising bond yields",
    " volatile amid geopolitical tensions",
    "tracks broader market rally on economic optimism",
    "resilient as consumer spending data beats expectations",
  ],
  Downgrade: [
    "downgraded by Goldman Sachs on valuation concerns",
    "analyst cuts rating to Sell, cites slowing growth",
    "price target reduced at Morgan Stanley",
    "faces double downgrade on margin pressure fears",
    "bear case builds as competition intensifies",
  ],
  Upgrade: [
    "upgraded to Buy on strong fundamentals",
    "analyst raises price target, cites new growth catalyst",
    "added to conviction buy list at JP Morgan",
    "rating lifted on improving demand outlook",
    "bullish momentum builds, upgrade follows strong quarter",
  ],
  Regulatory: [
    "faces regulatory probe over compliance practices",
    "wins key regulatory approval for new product",
    "antitrust concerns raised over market practices",
    "clears regulatory hurdle, shares jump",
    "new regulations could impact near-term profitability",
  ],
  Product: [
    "unveils new product line, shares hit record high",
    "product launch disappoints, stock slides",
    "announces strategic partnership, expands market reach",
    "innovation drives customer growth, analysts bullish",
    "delays product rollout, shares under pressure",
  ],
  Analyst: [
    "initiated with Outperform rating",
    "analyst day highlights long-term growth story",
    "consensus estimates revised higher",
    "research report flags potential upside",
    "sector rotation favors , flows turn positive",
  ],
};

function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], idx: number): T {
  return arr[Math.floor(seeded(idx) * arr.length)];
}

function timeAgo(idx: number): string {
  const minutes = Math.floor(seeded(idx * 3 + 7) * 480) + 1;
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return hours + "h " + mins + "m ago";
  const days = Math.floor(hours / 24);
  return days + "d ago";
}

function sentimentFor(idx: number, category: Category): Sentiment {
  if (category === "Downgrade") return "bearish";
  if (category === "Upgrade") return "bullish";
  if (category === "Earnings" || category === "M&A" || category === "Product") {
    return seeded(idx * 5 + 11) > 0.5 ? "bullish" : "bearish";
  }
  if (category === "Regulatory") return seeded(idx * 5 + 13) > 0.5 ? "bearish" : "neutral";
  return seeded(idx * 5 + 17) > 0.6 ? "bullish" : seeded(idx * 5 + 19) > 0.5 ? "bearish" : "neutral";
}

function generateNews(): NewsItem[] {
  const items: NewsItem[] = [];
  const limit = Math.min(STOCK_UNIVERSE.length, 500);
  for (let i = 0; i < NEWS_COUNT; i++) {
    const stockIdx = Math.floor(seeded(i * 2 + 1) * limit);
    const meta = STOCK_UNIVERSE[stockIdx] ?? STOCK_UNIVERSE[0];
    const category = pick(CATEGORIES, i * 3 + 2);
    const headlineTemplate = pick(HEADLINES[category], i * 5 + 3);
    const sentiment = sentimentFor(i, category);
    items.push({
      id: i,
      symbol: meta.symbol,
      name: meta.name,
      headline: meta.name + " " + headlineTemplate,
      source: pick(SOURCES, i * 7 + 5),
      time: timeAgo(i),
      sentiment,
      category,
    });
  }
  return items;
}

function SentimentIcon({ sentiment, className }: { sentiment: Sentiment; className?: string }) {
  if (sentiment === "bullish") return <TrendingUp size={16} className={className ?? "text-bull"} />;
  if (sentiment === "bearish") return <TrendingDown size={16} className={className ?? "text-bear"} />;
  return <AlertCircle size={16} className={className ?? "text-accent-400"} />;
}

export function MarketNews({ onOpenStock }: MarketNewsProps) {
  const [filter, setFilter] = useState<Category | "All">("All");

  const allNews = useMemo(() => generateNews(), []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of allNews) {
      counts[n.category] = (counts[n.category] ?? 0) + 1;
    }
    return counts;
  }, [allNews]);

  const sentimentCounts = useMemo(() => {
    let bullish = 0;
    let bearish = 0;
    let neutral = 0;
    for (const n of allNews) {
      if (n.sentiment === "bullish") bullish++;
      else if (n.sentiment === "bearish") bearish++;
      else neutral++;
    }
    return { bullish, bearish, neutral };
  }, [allNews]);

  const filteredNews = useMemo(() => {
    if (filter === "All") return allNews;
    return allNews.filter((n) => n.category === filter);
  }, [allNews, filter]);

  return (
    <div className="flex gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Main news list */}
      <main className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-2">
          <Newspaper size={18} className="text-brand-400" />
          <h2 className="text-lg font-semibold text-ink-100">Market News</h2>
          <span className="chip bg-ink-800 text-ink-400">{filteredNews.length} stories</span>
        </div>

        <div className="space-y-2">
          {filteredNews.map((n) => (
            <div
              key={n.id}
              className="card card-hover p-4 flex items-start gap-3 cursor-pointer"
              onClick={() => onOpenStock(n.symbol)}
            >
              <div className="shrink-0 mt-0.5">
                <SentimentIcon sentiment={n.sentiment} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink-100 font-medium leading-snug">{n.headline}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="chip bg-ink-800 text-ink-400 text-[10px]">{n.category}</span>
                  <span className="text-xs text-ink-500">{n.source}</span>
                  <span className="text-xs text-ink-600">·</span>
                  <span className="text-xs text-ink-500">{n.time}</span>
                  <span className="text-xs text-ink-600">·</span>
                  <span className="text-xs font-semibold text-brand-400">${n.symbol}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 space-y-4">
        {/* Category counts */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-ink-100 mb-3">Categories</h3>
          <div className="space-y-1">
            <button
              onClick={() => setFilter("All")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition text-sm ${
                filter === "All" ? "bg-ink-800 text-brand-400" : "text-ink-400 hover:bg-white/5 hover:text-ink-200"
              }`}
            >
              <span>All News</span>
              <span className="font-mono text-xs">{allNews.length}</span>
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition text-sm ${
                  filter === cat ? "bg-ink-800 text-brand-400" : "text-ink-400 hover:bg-white/5 hover:text-ink-200"
                }`}
              >
                <span>{cat}</span>
                <span className="font-mono text-xs">{categoryCounts[cat] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sentiment breakdown */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-ink-100 mb-3">Sentiment Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-bull shrink-0" />
              <span className="text-sm text-ink-300 flex-1">Bullish</span>
              <span className="font-mono text-sm text-bull">{sentimentCounts.bullish}</span>
            </div>
            <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
              <div
                className="h-full bg-bull"
                style={{ width: `${(sentimentCounts.bullish / allNews.length) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-bear shrink-0" />
              <span className="text-sm text-ink-300 flex-1">Bearish</span>
              <span className="font-mono text-sm text-bear">{sentimentCounts.bearish}</span>
            </div>
            <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
              <div
                className="h-full bg-bear"
                style={{ width: `${(sentimentCounts.bearish / allNews.length) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-accent-400 shrink-0" />
              <span className="text-sm text-ink-300 flex-1">Neutral</span>
              <span className="font-mono text-sm text-accent-400">{sentimentCounts.neutral}</span>
            </div>
            <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
              <div
                className="h-full bg-accent-400"
                style={{ width: `${(sentimentCounts.neutral / allNews.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default MarketNews;
