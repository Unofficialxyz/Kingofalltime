import { useMemo } from 'react';
import { Newspaper, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { STOCK_UNIVERSE } from '../lib/universe';
import { useLiveQuotes } from '../lib/liveFeed';

interface Props { onOpenStock: (s: string) => void; }

interface NewsItem {
  id: string;
  symbol: string;
  headline: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
}

function seeded(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return (h >>> 0) / 4294967296;
}

const HEADLINES = [
  { tpl: '{name} beats earnings estimates, raises full-year guidance', cat: 'Earnings', pos: true },
  { tpl: '{name} announces strategic partnership to expand AI capabilities', cat: 'Partnership', pos: true },
  { tpl: '{name} reports record quarterly revenue growth', cat: 'Earnings', pos: true },
  { tpl: '{name} faces regulatory scrutiny over market practices', cat: 'Regulation', pos: false },
  { tpl: '{name} unveils next-generation product lineup', cat: 'Product', pos: true },
  { tpl: '{name} CEO discusses growth strategy at investor conference', cat: 'Events', pos: true },
  { tpl: '{name} stock downgraded by major analyst firm', cat: 'Analyst', pos: false },
  { tpl: '{name} expands into emerging markets', cat: 'Expansion', pos: true },
  { tpl: '{name} reports disappointing quarterly results', cat: 'Earnings', pos: false },
  { tpl: '{name} launches share buyback program', cat: 'Capital', pos: true },
  { tpl: '{name} hit by supply chain disruptions', cat: 'Operations', pos: false },
  { tpl: '{name} acquires competitor in landmark deal', cat: 'M&A', pos: true },
  { tpl: '{name} raises dividend for consecutive year', cat: 'Dividend', pos: true },
  { tpl: '{name} faces class-action lawsuit from shareholders', cat: 'Legal', pos: false },
  { tpl: '{name} secures major government contract', cat: 'Contracts', pos: true },
  { tpl: '{name} CFO resigns amid restructuring', cat: 'Management', pos: false },
];

const SOURCES = ['Reuters', 'Bloomberg', 'CNBC', 'MarketWatch', 'Financial Times', 'WSJ', 'Barrons', 'Seeking Alpha'];

export function MarketNews({ onOpenStock }: Props) {
  useLiveQuotes();

  const news = useMemo<NewsItem[]>(() => {
    const items: NewsItem[] = [];
    for (let i = 0; i < 60; i++) {
      const stock = STOCK_UNIVERSE[Math.floor(seeded('news' + i) * STOCK_UNIVERSE.length)];
      const hl = HEADLINES[Math.floor(seeded('hl' + i) * HEADLINES.length)];
      const minsAgo = Math.floor(seeded('time' + i) * 720);
      items.push({
        id: `news-${i}`,
        symbol: stock.symbol,
        headline: hl.tpl.replace('{name}', stock.name),
        source: SOURCES[Math.floor(seeded('src' + i) * SOURCES.length)],
        time: `${minsAgo < 60 ? minsAgo + 'm' : Math.floor(minsAgo / 60) + 'h'} ago`,
        sentiment: hl.pos ? 'positive' : 'negative',
        category: hl.cat,
      });
    }
    return items;
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, NewsItem[]>();
    for (const n of news) {
      const arr = map.get(n.category) ?? [];
      arr.push(n);
      map.set(n.category, arr);
    }
    return map;
  }, [news]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink-50 flex items-center gap-2"><Newspaper size={20} className="text-brand-400" /> Market News</h1>
        <p className="text-ink-400 text-sm">AI-generated news feed across the global stock universe.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {news.slice(0, 30).map((n) => (
            <button
              key={n.id}
              onClick={() => onOpenStock(n.symbol)}
              className="card card-hover p-4 w-full text-left group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${n.sentiment === 'positive' ? 'bg-bull/15 text-bull' : n.sentiment === 'negative' ? 'bg-bear/15 text-bear' : 'bg-white/5 text-ink-400'}`}>
                  {n.sentiment === 'positive' ? <TrendingUp size={16} /> : n.sentiment === 'negative' ? <TrendingDown size={16} /> : <AlertCircle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-ink-100 text-sm group-hover:text-brand-300 transition">{n.symbol}</span>
                    <span className="chip bg-white/5 text-ink-500 text-[10px]">{n.category}</span>
                  </div>
                  <p className="text-sm text-ink-200 leading-snug">{n.headline}</p>
                  <div className="text-xs text-ink-500 mt-1">{n.source} · {n.time}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="card p-4">
            <h3 className="font-semibold text-ink-100 text-sm mb-3">News by category</h3>
            <div className="space-y-2">
              {Array.from(categories.entries()).slice(0, 10).map(([cat, items]) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-ink-300">{cat}</span>
                  <span className="text-ink-500 font-mono">{items.length}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold text-ink-100 text-sm mb-3">Sentiment breakdown</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-bull flex items-center gap-1"><TrendingUp size={12} /> Positive</span>
                <span className="font-mono text-ink-300">{news.filter((n) => n.sentiment === 'positive').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-bear flex items-center gap-1"><TrendingDown size={12} /> Negative</span>
                <span className="font-mono text-ink-300">{news.filter((n) => n.sentiment === 'negative').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
