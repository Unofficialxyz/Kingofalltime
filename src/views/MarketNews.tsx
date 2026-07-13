import { useMemo, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { STOCK_UNIVERSE, getMeta } from '../lib/universe';
import { getLiveQuote } from '../lib/dataService';
import { useLiveQuotes } from '../lib/hooks';
import { fmtPctRaw } from '../lib/format';
import type { Region, Sector } from '../lib/types';

interface Props {
  onOpenStock: (s: string) => void;
}

type Sentiment = 'positive' | 'negative';
type Category = 'Earnings' | 'M&A' | 'Product' | 'Regulatory' | 'Analyst' | 'Market';

interface NewsItem {
  id: number;
  symbol: string;
  name: string;
  headline: string;
  source: string;
  time: string;
  sentiment: Sentiment;
  category: Category;
  changePct: number;
}

const SOURCES = ['Reuters', 'Bloomberg', 'CNBC', 'MarketWatch', 'WSJ', 'Financial Times', 'Barrons', 'Seeking Alpha'];
const CATEGORIES: Category[] = ['Earnings', 'M&A', 'Product', 'Regulatory', 'Analyst', 'Market'];

const POSITIVE_TEMPLATES = [
  'beats Q earnings expectations, raises guidance',
  'announces strategic partnership, shares surge',
  'reports record revenue growth in latest quarter',
  'unveils breakthrough product, analysts bullish',
  'expands into new markets, upgrades outlook',
  'board approves major buyback program',
  'dividend hike signals management confidence',
  'tops analyst estimates, stock hits new high',
  'wins landmark contract, revenue to jump',
  'profit margins expand, beat on both lines',
];

const NEGATIVE_TEMPLATES = [
  'misses revenue targets, cuts full-year guidance',
  'faces regulatory probe, shares tumble',
  'CEO departs abruptly, leadership uncertainty',
  'warns on slowing demand, outlook grim',
  'lawsuit filed over product safety concerns',
  'downgraded by major analyst, price target slashed',
  'supply chain disruptions hit production',
  'reports widening losses, cash burn accelerates',
  'faces activist pressure, strategic review urged',
  'competition intensifies, market share at risk',
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function timeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function MarketNews({ onOpenStock }: Props) {
  useLiveQuotes();
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [filterSentiment, setFilterSentiment] = useState<Sentiment | 'All'>('All');

  const news = useMemo<NewsItem[]>(() => {
    // Pick 60 stocks deterministically from the universe
    const stocks = STOCK_UNIVERSE.slice(0, 500);
    const items: NewsItem[] = [];
    for (let i = 0; i < 60; i++) {
      const stock = stocks[Math.floor(seededRandom(i + 1) * stocks.length)];
      const meta = getMeta(stock.symbol);
      if (!meta) continue;
      const quote = getLiveQuote(stock.symbol);
      if (!quote) continue;
      const positive = seededRandom(i * 3 + 7) > 0.4;
      const sentiment: Sentiment = positive ? 'positive' : 'negative';
      const template = positive
        ? POSITIVE_TEMPLATES[Math.floor(seededRandom(i * 5 + 3) * POSITIVE_TEMPLATES.length)]
        : NEGATIVE_TEMPLATES[Math.floor(seededRandom(i * 5 + 3) * NEGATIVE_TEMPLATES.length)];
      const category = CATEGORIES[Math.floor(seededRandom(i * 2 + 11) * CATEGORIES.length)];
      const source = SOURCES[Math.floor(seededRandom(i * 3 + 17) * SOURCES.length)];
      const minutes = Math.floor(seededRandom(i * 7 + 23) * 1440);
      const headline = `${meta.name} ${template}`;
      items.push({
        id: i,
        symbol: meta.symbol,
        name: meta.name,
        headline,
        source,
        time: timeAgo(minutes),
        sentiment,
        category,
        changePct: quote.changePct,
      });
    }
    return items;
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of news) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [news]);

  // Sentiment breakdown
  const sentimentCounts = useMemo(() => {
    let positive = 0, negative = 0;
    for (const item of news) {
      if (item.sentiment === 'positive') positive++;
      else negative++;
    }
    return { positive, negative };
  }, [news]);

  // Filtered news
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      if (filterCategory !== 'All' && item.category !== filterCategory) return false;
      if (filterSentiment !== 'All' && item.sentiment !== filterSentiment) return false;
      return true;
    });
  }, [news, filterCategory, filterSentiment]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Newspaper className="w-5 h-5 text-brand-500" />
        <h2 className="text-xl font-bold text-ink-900">Market News</h2>
        <span className="chip text-xs">{news.length} stories</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Sentiment breakdown */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-ink-900 mb-3">Sentiment Breakdown</h3>
            <div className="space-y-3">
              <button
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${filterSentiment === 'positive' ? 'bg-bull/10 ring-1 ring-bull' : 'hover:bg-ink-50'}`}
                onClick={() => setFilterSentiment(filterSentiment === 'positive' ? 'All' : 'positive')}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-bull" />
                  <span className="text-sm text-ink-700">Positive</span>
                </div>
                <span className="text-sm font-bold text-bull tabular-nums">{sentimentCounts.positive}</span>
              </button>
              <button
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${filterSentiment === 'negative' ? 'bg-bear/10 ring-1 ring-bear' : 'hover:bg-ink-50'}`}
                onClick={() => setFilterSentiment(filterSentiment === 'negative' ? 'All' : 'negative')}
              >
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-bear" />
                  <span className="text-sm text-ink-700">Negative</span>
                </div>
                <span className="text-sm font-bold text-bear tabular-nums">{sentimentCounts.negative}</span>
              </button>
              {filterSentiment !== 'All' && (
                <button
                  className="w-full text-xs text-brand-500 hover:text-brand-600 text-left px-2"
                  onClick={() => setFilterSentiment('All')}
                >
                  Clear sentiment filter
                </button>
              )}
            </div>
          </div>

          {/* Category counts */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-ink-900 mb-3">Categories</h3>
            <div className="space-y-1">
              <button
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${filterCategory === 'All' ? 'bg-brand-500/10 text-brand-600 font-medium' : 'hover:bg-ink-50 text-ink-700'}`}
                onClick={() => setFilterCategory('All')}
              >
                <span className="text-sm">All Categories</span>
                <span className="text-sm tabular-nums">{news.length}</span>
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${filterCategory === cat ? 'bg-brand-500/10 text-brand-600 font-medium' : 'hover:bg-ink-50 text-ink-700'}`}
                  onClick={() => setFilterCategory(filterCategory === cat ? 'All' : cat)}
                >
                  <span className="text-sm">{cat}</span>
                  <span className="text-sm tabular-nums">{categoryCounts[cat] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* News list */}
        <div className="lg:col-span-3">
          {filteredNews.length === 0 ? (
            <div className="card p-12 text-center">
              <Newspaper className="w-12 h-12 mx-auto text-ink-300 mb-4" />
              <p className="text-ink-400 text-lg mb-2">No news matches your filters</p>
              <p className="text-ink-500 text-sm">Try selecting a different category or sentiment.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNews.map((item) => {
                const positive = item.sentiment === 'positive';
                const up = item.changePct >= 0;
                return (
                  <div
                    key={item.id}
                    className="card card-hover p-3 cursor-pointer"
                    onClick={() => onOpenStock(item.symbol)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Sentiment icon */}
                      <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${positive ? 'bg-bull/10' : 'bg-bear/10'}`}>
                        {positive ? (
                          <TrendingUp className="w-5 h-5 text-bull" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-bear" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-ink-900 font-medium leading-snug">
                            {item.headline}
                          </p>
                          <span className={`flex-shrink-0 text-xs font-semibold tabular-nums ${up ? 'text-bull' : 'text-bear'}`}>
                            {up ? '+' : ''}{fmtPctRaw(item.changePct)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-400">
                          <span className="font-semibold text-ink-600">{item.symbol}</span>
                          <span>•</span>
                          <span>{item.source}</span>
                          <span>•</span>
                          <span>{item.time}</span>
                          <span>•</span>
                          <span className={`chip text-xs px-1.5 py-0 ${positive ? 'text-bull bg-bull/10' : 'text-bear bg-bear/10'}`}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
