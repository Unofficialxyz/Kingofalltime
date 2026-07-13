import { useMemo, useState } from "react";
import { Newspaper, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Sentiment = "positive" | "negative" | "neutral";

interface NewsItem {
  id: number;
  headline: string;
  source: string;
  category: string;
  sentiment: Sentiment;
  time: string;
  symbol: string;
}

const CATEGORIES = ["All", "Earnings", "M&A", "Macro", "Tech", "Energy", "Finance", "Healthcare", "Crypto", "Retail"];

const HEADLINES: { text: string; cat: string; sent: Sentiment; sym: string }[] = [
  { text: "Apple announces record quarterly revenue beating estimates", cat: "Earnings", sent: "positive", sym: "AAPL" },
  { text: "Microsoft cloud business surges 30% on AI demand", cat: "Tech", sent: "positive", sym: "MSFT" },
  { text: "Alphabet faces antitrust probe over ad business", cat: "Macro", sent: "negative", sym: "GOOGL" },
  { text: "Amazon reports strong holiday sales growth", cat: "Retail", sent: "positive", sym: "AMZN" },
  { text: "Meta invests heavily in VR metaverse division", cat: "Tech", sent: "neutral", sym: "META" },
  { text: "NVIDIA hits new all-time high on chip demand", cat: "Tech", sent: "positive", sym: "NVDA" },
  { text: "Tesla deliveries miss expectations for the quarter", cat: "Earnings", sent: "negative", sym: "TSLA" },
  { text: "JPMorgan profit rises on strong trading desk performance", cat: "Finance", sent: "positive", sym: "JPM" },
  { text: "Visa expands digital payment network in Asia", cat: "Finance", sent: "neutral", sym: "V" },
  { text: "Johnson & Johnson recalls batch of consumer products", cat: "Healthcare", sent: "negative", sym: "JNJ" },
  { text: "Walmart announces major stock buyback program", cat: "Finance", sent: "positive", sym: "WMT" },
  { text: "Mastercard launches new crypto rewards card", cat: "Crypto", sent: "neutral", sym: "MA" },
  { text: "Procter & Gamble raises dividend for 68th year", cat: "Finance", sent: "positive", sym: "PG" },
  { text: "UnitedHealth Group warns on rising medical costs", cat: "Healthcare", sent: "negative", sym: "UNH" },
  { text: "Home Depot sees slowdown in renovation spending", cat: "Retail", sent: "negative", sym: "HD" },
  { text: "Disney streaming subscribers top 150 million", cat: "Tech", sent: "positive", sym: "DIS" },
  { text: "Bank of America reports mixed quarterly results", cat: "Earnings", sent: "neutral", sym: "BAC" },
  { text: "Exxon Mobil profits surge on rising oil prices", cat: "Energy", sent: "positive", sym: "XOM" },
  { text: "Pfizer announces breakthrough vaccine candidate", cat: "Healthcare", sent: "positive", sym: "PFE" },
  { text: "Coca-Cola expands into alcoholic beverages market", cat: "Retail", sent: "neutral", sym: "KO" },
  { text: "PepsiCo raises full-year guidance on snack demand", cat: "Earnings", sent: "positive", sym: "PEP" },
  { text: "Intel loses market share to AMD in server chips", cat: "Tech", sent: "negative", sym: "INTC" },
  { text: "Cisco acquires cybersecurity startup for $4 billion", cat: "M&A", sent: "positive", sym: "CSCO" },
  { text: "Oracle cloud revenue jumps on enterprise demand", cat: "Tech", sent: "positive", sym: "ORCL" },
  { text: "Adobe raises subscription prices across product line", cat: "Tech", sent: "neutral", sym: "ADBE" },
  { text: "Netflix cracks down on password sharing globally", cat: "Tech", sent: "positive", sym: "NFLX" },
  { text: "Salesforce announces major workforce reduction", cat: "Tech", sent: "negative", sym: "CRM" },
  { text: "AMD wins major contract with cloud provider", cat: "Tech", sent: "positive", sym: "AMD" },
  { text: "Broadcom chip demand softens in mobile segment", cat: "Tech", sent: "negative", sym: "AVGO" },
  { text: "Costco membership renewals hit record high", cat: "Retail", sent: "positive", sym: "COST" },
  { text: "Abbott Laboratories receives FDA approval for device", cat: "Healthcare", sent: "positive", sym: "ABT" },
  { text: "Nike faces inventory glut ahead of holiday season", cat: "Retail", sent: "negative", sym: "NKE" },
  { text: "Merck cancer drug shows promising trial results", cat: "Healthcare", sent: "positive", sym: "MRK" },
  { text: "Qualcomm wins new licensing deal with handset maker", cat: "Tech", sent: "positive", sym: "QCOM" },
  { text: "Texas Instruments warns of industrial demand slowdown", cat: "Earnings", sent: "negative", sym: "TXN" },
  { text: "IBM quantum computing division secures government contract", cat: "Tech", sent: "positive", sym: "IBM" },
  { text: "Goldman Sachs bonuses cut amid dealmaking slump", cat: "Finance", sent: "negative", sym: "GS" },
  { text: "Morgan Stanley wealth management assets reach record", cat: "Finance", sent: "positive", sym: "MS" },
  { text: "Chevron announces major share repurchase program", cat: "Energy", sent: "positive", sym: "CVX" },
  { text: "Boeing faces delivery delays on 737 production issues", cat: "Macro", sent: "negative", sym: "BA" },
  { text: "Caterpillar mining equipment orders rebound", cat: "Macro", sent: "positive", sym: "CAT" },
  { text: "General Electric completes spinoff of energy unit", cat: "M&A", sent: "neutral", sym: "GE" },
  { text: "Ford EV sales accelerate but margins remain thin", cat: "Earnings", sent: "neutral", sym: "F" },
  { text: "General Motors announces new battery factory", cat: "Macro", sent: "positive", sym: "GM" },
  { text: "Citigroup unveils sweeping restructuring plan", cat: "Finance", sent: "neutral", sym: "C" },
  { text: "Wells Fargo settles mortgage probe with regulators", cat: "Finance", sent: "neutral", sym: "WFC" },
  { text: "PayPal launches crypto checkout for merchants", cat: "Crypto", sent: "positive", sym: "PYPL" },
  { text: "Uber rideshare revenue grows in international markets", cat: "Earnings", sent: "positive", sym: "UBER" },
  { text: "Airbnb bookings slow as travel normalizes post-pandemic", cat: "Earnings", sent: "negative", sym: "ABNB" },
  { text: "Shopify merchant volume hits new milestone", cat: "Retail", sent: "positive", sym: "SHOP" },
  { text: "Block announces partnership with major retailer", cat: "Crypto", sent: "neutral", sym: "SQ" },
  { text: "Snowflake cloud data warehouse revenue beats estimates", cat: "Tech", sent: "positive", sym: "SNOW" },
  { text: "Palantir secures large defense contract extension", cat: "Macro", sent: "positive", sym: "PLTR" },
  { text: "CrowdStrike expands platform with new identity tools", cat: "Tech", sent: "positive", sym: "CRWD" },
  { text: "Cloudflare network traffic grows 40% year over year", cat: "Tech", sent: "positive", sym: "NET" },
  { text: "Zoom faces competition pressure on enterprise pricing", cat: "Tech", sent: "negative", sym: "ZM" },
  { text: "Coinbase trading volume surges on crypto rally", cat: "Crypto", sent: "positive", sym: "COIN" },
  { text: "Robinhood launches new retirement savings product", cat: "Finance", sent: "neutral", sym: "HOOD" },
  { text: "DoorDash expands grocery delivery to new cities", cat: "Retail", sent: "neutral", sym: "DASH" },
  { text: "Plug Power wins green hydrogen facility contract", cat: "Energy", sent: "positive", sym: "PLUG" },
  { text: "Enphase Energy solar shipments beat quarterly estimates", cat: "Energy", sent: "positive", sym: "ENPH" },
];

const SOURCES = ["Reuters", "Bloomberg", "CNBC", "WSJ", "MarketWatch", "Financial Times", "Barrons"];
const TIMES = ["2m ago", "15m ago", "32m ago", "1h ago", "2h ago", "3h ago", "4h ago", "5h ago", "6h ago", "8h ago"];

function buildNews(): NewsItem[] {
  const items: NewsItem[] = [];
  for (let i = 0; i < HEADLINES.length; i++) {
    const h = HEADLINES[i];
    items.push({
      id: i,
      headline: h.text,
      source: SOURCES[i % SOURCES.length],
      category: h.cat,
      sentiment: h.sent,
      time: TIMES[i % TIMES.length],
      symbol: h.sym,
    });
  }
  return items;
}

const ALL_NEWS = buildNews();

export function MarketNews({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    if (category === "All") return ALL_NEWS;
    return ALL_NEWS.filter((n) => n.category === category);
  }, [category]);

  function sentimentChip(s: Sentiment): { icon: React.ReactNode; cls: string; label: string } {
    if (s === "positive") {
      return { icon: <TrendingUp className="w-3.5 h-3.5" />, cls: "bg-bull/15 text-bull", label: "Positive" };
    }
    if (s === "negative") {
      return { icon: <TrendingDown className="w-3.5 h-3.5" />, cls: "bg-bear/15 text-bear", label: "Negative" };
    }
    return { icon: <Minus className="w-3.5 h-3.5" />, cls: "bg-ink-700/40 text-ink-300", label: "Neutral" };
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Newspaper className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Market News</h1>
        <span className="chip bg-brand-500/15 text-brand-300 text-base ml-2">{filtered.length}</span>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-base font-medium transition border ${
              category === c
                ? "tab-active"
                : "border-white/10 text-ink-400 hover:bg-white/5 hover:text-ink-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="flex flex-col gap-2">
        {filtered.map((n) => {
          const s = sentimentChip(n.sentiment);
          return (
            <button
              key={n.id}
              onClick={() => onOpenStock(n.symbol)}
              className="card card-hover p-4 animate-slide-up text-left flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-base font-semibold text-ink-100 flex-1">{n.headline}</span>
                <span className={`chip ${s.cls} shrink-0`}>
                  {s.icon}
                  {s.label}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="chip bg-brand-500/10 text-brand-300 text-sm">{n.category}</span>
                <span className="text-sm text-ink-500">{n.source}</span>
                <span className="text-sm text-ink-600">{n.time}</span>
                <span className="text-sm text-ink-400 ml-auto">Related: <span className="text-ink-200 font-medium">{n.symbol}</span></span>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="card p-12 text-center animate-fade-in">
            <Newspaper className="w-12 h-12 text-ink-600 mx-auto mb-3" />
            <p className="text-base text-ink-400">No news in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
