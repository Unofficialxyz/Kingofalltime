import { useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, Brain, Zap, Globe2, Flame, Award } from "lucide-react";
import { getRegionAIResults, AI_AGENTS_COUNT } from "../lib/aiAnalysis";
import { REAL_STOCKS, TOTAL_STOCKS, TOTAL_AI_COMPANIES } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { useLiveQuotes } from "../lib/hooks";
import { Sparkline } from "../components/Sparkline";
import type { Quote } from "../lib/types";

const SECTORS_12 = [
  "Technology", "Finance", "Healthcare", "Energy", "Consumer", "Industrial",
  "Materials", "Utilities", "RealEstate", "Communication", "Semiconductors", "EV",
];

function sparkData(symbol: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i++) { h ^= symbol.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = (h >>> 0) || 1;
  const rand = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out: number[] = [];
  let v = 100;
  for (let i = 0; i < 20; i++) { v += (rand() - 0.48) * 4; out.push(v); }
  return out;
}

function fmtPct(n: number): string {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
}

function fmtTotal(n: number): string {
  if (n >= 1e15) return (n / 1e15).toFixed(2) + "Q";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  return n.toLocaleString();
}

export function Dashboard({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice, formatCompact } = useCurrency();

  const regionResults = useMemo(() => getRegionAIResults(), []);

  const sectors = useMemo(() => {
    let h = 2166136261;
    const seed = new Date().toDateString();
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    let a = (h >>> 0) || 1;
    const rand = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return SECTORS_12.map((name, i) => ({ name, change: (rand() - 0.45) * 6, idx: i }));
  }, []);

  const { gainers, losers, active } = useMemo(() => {
    const ranked = REAL_STOCKS.map((s) => ({ meta: s, q: getQuote(s.symbol) }))
      .sort((a, b) => b.q.changePct - a.q.changePct);
    return {
      gainers: ranked.slice(0, 5),
      losers: ranked.slice(-5).reverse(),
      active: [...ranked].sort((a, b) => b.q.volume - a.q.volume).slice(0, 5),
    };
  }, []);

  const liveSymbols = useMemo(
    () => [...gainers, ...losers, ...active].map((x) => x.meta.symbol),
    [gainers, losers, active]
  );
  const { quotes } = useLiveQuotes(liveSymbols);

  const fearGreed = 62;

  const fgLabel = fearGreed > 75 ? "Extreme Greed" : fearGreed > 55 ? "Greed" : fearGreed > 45 ? "Neutral" : fearGreed > 25 ? "Fear" : "Extreme Fear";
  const fgColor = fearGreed > 55 ? "#10b981" : fearGreed > 45 ? "#f59e0b" : "#ef4444";

  function liveQuote(sym: string, fallback: Quote): Quote {
    return quotes.get(sym) ?? fallback;
  }

  function StockRow({ sym, name, q }: { sym: string; name: string; q: Quote }) {
    const up = q.changePct >= 0;
    const color = up ? "#10b981" : "#ef4444";
    return (
      <button
        onClick={() => onOpenStock(sym)}
        className="card card-hover w-full flex items-center gap-3 p-3 text-left animate-slide-up"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-base font-semibold text-ink-100 truncate">{sym}</span>
          <span className="text-sm text-ink-500 truncate">{name}</span>
        </div>
        <Sparkline data={sparkData(sym)} width={64} height={28} color={color} />
        <div className="flex flex-col items-end min-w-[96px]">
          <span className="text-base font-semibold text-ink-100">{formatPrice(q.price)}</span>
          <span className={`text-sm font-medium ${up ? "text-bull" : "text-bear"}`}>
            {fmtPct(q.changePct)}
          </span>
        </div>
      </button>
    );
  }

  function StockList({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: { meta: { symbol: string; name: string }; q: Quote }[] }) {
    return (
      <div className="card p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-lg font-semibold text-ink-100">{title}</h3>
        </div>
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <StockRow key={r.meta.symbol} sym={r.meta.symbol} name={r.meta.name} q={liveQuote(r.meta.symbol, r.q)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 w-full">
      {/* Sidebar - hidden on mobile, shown on lg+ */}
      <aside className="hidden lg:flex flex-col w-72 gap-4 shrink-0">
        {/* Best Stock of the Day */}
        <div className="card p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold gradient-text">Best Stock of the Day</h2>
          </div>
          <div className="flex flex-col gap-3">
            {regionResults.slice(0, 6).map((r) => (
              <button
                key={r.region}
                onClick={() => onOpenStock(r.bestStock.symbol)}
                className="card card-hover p-3 text-left animate-slide-up"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-semibold text-ink-100 flex items-center gap-1">
                    <Globe2 className="w-4 h-4 text-brand-400" />
                    {r.region}
                  </span>
                  <span className="chip bg-brand-500/15 text-brand-300">
                    <Brain className="w-3.5 h-3.5" />
                    {r.bestStock.score.toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-ink-100">{r.bestStock.symbol}</span>
                  <span className="text-base text-ink-200">{formatPrice(r.bestStock.price)}</span>
                </div>
                <div className={`text-sm font-medium ${r.bestStock.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                  {fmtPct(r.bestStock.changePct)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cheapest & Best Stock of the Day */}
        <div className="card p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold gradient-text">Cheapest & Best Stock</h2>
          </div>
          <div className="flex flex-col gap-3">
            {regionResults.slice(0, 6).map((r) => (
              <button
                key={r.region}
                onClick={() => onOpenStock(r.cheapestBestStock.symbol)}
                className="card card-hover p-3 text-left animate-slide-up"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-semibold text-ink-100 flex items-center gap-1">
                    <Globe2 className="w-4 h-4 text-brand-400" />
                    {r.region}
                  </span>
                  <span className="chip bg-accent/15 text-accent">
                    <Brain className="w-3.5 h-3.5" />
                    {r.cheapestBestStock.score.toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-ink-100">{r.cheapestBestStock.symbol}</span>
                  <span className="text-base text-ink-200">{formatPrice(r.cheapestBestStock.price)}</span>
                </div>
                <div className={`text-sm font-medium ${r.cheapestBestStock.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                  {fmtPct(r.cheapestBestStock.changePct)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Hero */}
        <section className="card p-6 animate-fade-in">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-brand-400" />
              <h1 className="text-2xl font-bold gradient-text">Global Stock Analysis</h1>
            </div>
            <p className="text-base text-ink-400">
              AI-powered analysis across {fmtTotal(TOTAL_STOCKS)}+ stocks worldwide with {AI_AGENTS_COUNT.toLocaleString()} AI agents and 1000+ analysis techniques.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card card-hover p-4">
                <div className="text-sm text-ink-500 mb-1">Total Stocks</div>
                <div className="text-xl font-bold text-ink-100">{fmtTotal(TOTAL_STOCKS)}+</div>
              </div>
              <div className="card card-hover p-4">
                <div className="text-sm text-ink-500 mb-1">AI Companies</div>
                <div className="text-xl font-bold text-ink-100">{TOTAL_AI_COMPANIES.toLocaleString()}</div>
              </div>
              <div className="card card-hover p-4">
                <div className="text-sm text-ink-500 mb-1">AI Agents</div>
                <div className="text-xl font-bold text-ink-100">{AI_AGENTS_COUNT.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="chip bg-brand-500/15 text-brand-300 text-base">
                <Brain className="w-4 h-4" />
                {AI_AGENTS_COUNT.toLocaleString()} AI Agents
              </span>
              <span className="chip bg-accent/15 text-accent text-base">
                <Zap className="w-4 h-4" />
                1000+ Analysis Techniques
              </span>
            </div>
          </div>
        </section>

        {/* Fear & Greed + Sector Performance */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fear & Greed */}
          <div className="card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-ink-100">Fear & Greed Index</h2>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-40 h-20 overflow-hidden">
                <svg viewBox="0 0 160 80" className="w-full h-full">
                  <path d="M 10 70 A 70 70 0 0 1 150 70" fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
                  <path
                    d="M 10 70 A 70 70 0 0 1 150 70"
                    fill="none"
                    stroke={fgColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="220"
                    strokeDashoffset={220 - (220 * fearGreed) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex items-end justify-center pb-1">
                  <span className="text-2xl font-bold" style={{ color: fgColor }}>{fearGreed}</span>
                </div>
              </div>
              <span className="text-base font-semibold" style={{ color: fgColor }}>{fgLabel}</span>
              <span className="text-sm text-ink-500">Market sentiment gauge</span>
            </div>
          </div>

          {/* Sector Performance */}
          <div className="card p-6 animate-fade-in lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-semibold text-ink-100">Sector Performance</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sectors.map((s) => {
                const up = s.change >= 0;
                return (
                  <div key={s.name} className="card card-hover p-3 animate-slide-up">
                    <div className="text-base font-semibold text-ink-100 mb-1">{s.name}</div>
                    <div className={`flex items-center gap-1 text-base font-medium ${up ? "text-bull" : "text-bear"}`}>
                      {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {fmtPct(s.change)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top Gainers / Losers / Most Active */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StockList
            title="Top Gainers"
            icon={<TrendingUp className="w-5 h-5 text-bull" />}
            rows={gainers}
          />
          <StockList
            title="Top Losers"
            icon={<TrendingDown className="w-5 h-5 text-bear" />}
            rows={losers}
          />
          <StockList
            title="Most Active"
            icon={<Activity className="w-5 h-5 text-brand-400" />}
            rows={active.map((r) => ({ meta: r.meta, q: { ...r.q, price: liveQuote(r.meta.symbol, r.q).price } }))}
          />
        </section>
      </main>
    </div>
  );
}
