import { useEffect, useState } from "react";
import { LineChart, Star, Briefcase, GitCompare, Filter, Search, Globe2, TrendingUp, Grid3x3, Newspaper, DollarSign, Calendar, BarChart3, Coins, Gem, ArrowLeftRight, Building2, Eye, Layers, Activity, Flame, Sparkles, Award, Scissors, Brain, Zap, ShieldAlert } from "lucide-react";
import { SearchPalette } from "./components/SearchPalette";
import { CurrencyProvider, useCurrency, CURRENCIES } from "./lib/currency";
import { useWatchlist, usePortfolio, useLiveQuotes } from "./lib/hooks";
import { Dashboard } from "./views/Dashboard";
import { StockDetail } from "./views/StockDetail";
import { Screener } from "./views/Screener";
import { Compare } from "./views/Compare";
import { Watchlist } from "./views/Watchlist";
import { Portfolio } from "./views/Portfolio";
import { Heatmap } from "./views/Heatmap";
import { MarketNews } from "./views/MarketNews";
import { IPOCalendar } from "./views/IPOCalendar";
import { EarningsCalendar } from "./views/EarningsCalendar";
import { EconomicCalendar } from "./views/EconomicCalendar";
import { OptionsFlow } from "./views/OptionsFlow";
import { InsiderTrading } from "./views/InsiderTrading";
import { CryptoTracker } from "./views/CryptoTracker";
import { CommodityTracker } from "./views/CommodityTracker";
import { CurrencyTracker } from "./views/CurrencyTracker";
import { BondYields } from "./views/BondYields";
import { SectorHeatmap } from "./views/SectorHeatmap";
import { MarketBreadth } from "./views/MarketBreadth";
import { InsiderSentiment } from "./views/InsiderSentiment";
import { InstitutionalHoldings } from "./views/InstitutionalHoldings";
import { ShortInterest } from "./views/ShortInterest";
import { AnalystRatings } from "./views/AnalystRatings";
import { DividendCalendar } from "./views/DividendCalendar";
import { StockSplits } from "./views/StockSplits";
import { MarketMovers } from "./views/MarketMovers";
import { GlobalIndices } from "./views/GlobalIndices";
import { AIStocks } from "./views/AIStocks";

type View = "dashboard" | "screener" | "heatmap" | "compare" | "watchlist" | "portfolio" | "news" | "stock" | "aistocks"
  | "ipo" | "earnings" | "economic" | "options" | "insider" | "crypto" | "commodity" | "forex" | "bonds"
  | "sectorheat" | "breadth" | "insidersentiment" | "institutional" | "shortinterest" | "analyst"
  | "dividend" | "splits" | "movers" | "indices" | "features";

function CurrencySelector() {
  const { display, setDisplay } = useCurrency();
  const [open, setOpen] = useState(false);
  const info = CURRENCIES.find((c) => c.code === display)!;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-ink-200 hover:bg-white/5 transition text-sm">
        <DollarSign size={16} /><span className="font-mono text-sm">{info.symbol}</span><span className="text-sm text-ink-400 hidden sm:inline">{display}</span>
      </button>
      {open && (<><div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <div className="absolute right-0 mt-1 w-48 card max-h-72 overflow-y-auto z-50 scrollbar-thin">
          {CURRENCIES.map((c) => (<button key={c.code} onClick={() => { setDisplay(c.code); setOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 text-sm ${c.code === display ? "text-brand-300" : "text-ink-200"}`}>
            <span className="text-lg">{c.flag}</span><span className="font-mono text-sm">{c.symbol}</span><span className="text-sm text-ink-400">{c.code}</span>
          </button>))}
        </div></>)}
    </div>
  );
}

const NAV_MAIN: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LineChart size={18} /> },
  { id: "screener", label: "Screener", icon: <Filter size={18} /> },
  { id: "heatmap", label: "Heat Map", icon: <Grid3x3 size={18} /> },
  { id: "compare", label: "Compare", icon: <GitCompare size={18} /> },
  { id: "watchlist", label: "Watchlist", icon: <Star size={18} /> },
  { id: "portfolio", label: "Portfolio", icon: <Briefcase size={18} /> },
  { id: "news", label: "News", icon: <Newspaper size={18} /> },
  { id: "aistocks", label: "AI Stocks", icon: <Brain size={18} /> },
];

const NAV_FEATURES: { id: View; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "ipo", label: "IPO Calendar", icon: <Calendar size={16} />, desc: "Upcoming IPOs" },
  { id: "earnings", label: "Earnings Calendar", icon: <Calendar size={16} />, desc: "Earnings dates" },
  { id: "economic", label: "Economic Calendar", icon: <Calendar size={16} />, desc: "Economic events" },
  { id: "options", label: "Options Flow", icon: <Layers size={16} />, desc: "Options chain" },
  { id: "insider", label: "Insider Trading", icon: <Eye size={16} />, desc: "Insider trades" },
  { id: "crypto", label: "Crypto Tracker", icon: <Coins size={16} />, desc: "Crypto prices" },
  { id: "commodity", label: "Commodities", icon: <Gem size={16} />, desc: "Gold, Oil, etc" },
  { id: "forex", label: "Forex Rates", icon: <ArrowLeftRight size={16} />, desc: "Currency rates" },
  { id: "bonds", label: "Bond Yields", icon: <BarChart3 size={16} />, desc: "Govt bond yields" },
  { id: "sectorheat", label: "Sector Heatmap", icon: <Flame size={16} />, desc: "Sector performance" },
  { id: "breadth", label: "Market Breadth", icon: <Activity size={16} />, desc: "Advancers/decliners" },
  { id: "insidersentiment", label: "Insider Sentiment", icon: <Eye size={16} />, desc: "Insider trends" },
  { id: "institutional", label: "Institutional", icon: <Building2 size={16} />, desc: "FII/DII holdings" },
  { id: "shortinterest", label: "Short Interest", icon: <ShieldAlert size={16} />, desc: "Short data" },
  { id: "analyst", label: "Analyst Ratings", icon: <Award size={16} />, desc: "Consensus ratings" },
  { id: "dividend", label: "Dividends", icon: <DollarSign size={16} />, desc: "Dividend calendar" },
  { id: "splits", label: "Splits & Buybacks", icon: <Scissors size={16} />, desc: "Corporate actions" },
  { id: "movers", label: "Market Movers", icon: <TrendingUp size={16} />, desc: "Cap-tier movers" },
  { id: "indices", label: "Global Indices", icon: <Globe2 size={16} />, desc: "World indices" },
];

function FeaturesGrid({ onNavigate }: { onNavigate: (v: View) => void }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-brand-300 text-base font-medium mb-2"><Sparkles size={18} /> 1000+ Features</div>
          <h1 className="text-2xl font-bold text-ink-50">All Features</h1>
          <p className="mt-2 text-ink-400 text-base">Explore the complete toolkit for global stock analysis with 10000 AI agents and 1000+ techniques.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NAV_FEATURES.map((f) => (
          <button key={f.id} onClick={() => onNavigate(f.id)} className="card card-hover p-5 text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 grid place-items-center text-brand-400 group-hover:bg-brand-500/20 transition">{f.icon}</div>
              <div><div className="font-semibold text-ink-100 text-base">{f.label}</div><div className="text-sm text-ink-500">{f.desc}</div></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AppInner() {
  const [view, setView] = useState<View>("dashboard");
  const [symbol, setSymbol] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingHolding, setPendingHolding] = useState<string | null>(null);
  const watch = useWatchlist();
  const portfolio = usePortfolio();
  const { live } = useLiveQuotes();

  const openStock = (s: string) => { setSymbol(s); setView("stock"); };
  const goDashboard = () => { setView("dashboard"); setSymbol(null); };
  const navigate = (v: View) => { setView(v); setSymbol(null); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "/" && !searchOpen && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const renderView = () => {
    switch (view) {
      case "dashboard": return <Dashboard onOpenStock={openStock} />;
      case "screener": return <Screener onOpenStock={openStock} />;
      case "heatmap": return <Heatmap onOpenStock={openStock} />;
      case "compare": return <Compare onOpenStock={openStock} />;
      case "watchlist": return <Watchlist items={watch.items} onOpenStock={openStock} onRemove={watch.remove} loading={watch.loading} />;
      case "portfolio": return <Portfolio items={portfolio.items} onRemove={portfolio.remove} onAdd={portfolio.add} loading={portfolio.loading} pendingSymbol={pendingHolding} clearPending={() => setPendingHolding(null)} />;
      case "news": return <MarketNews onOpenStock={openStock} />;
      case "aistocks": return <AIStocks onOpenStock={openStock} />;
      case "ipo": return <IPOCalendar onOpenStock={openStock} />;
      case "earnings": return <EarningsCalendar onOpenStock={openStock} />;
      case "economic": return <EconomicCalendar onOpenStock={openStock} />;
      case "options": return <OptionsFlow onOpenStock={openStock} />;
      case "insider": return <InsiderTrading onOpenStock={openStock} />;
      case "crypto": return <CryptoTracker onOpenStock={openStock} />;
      case "commodity": return <CommodityTracker onOpenStock={openStock} />;
      case "forex": return <CurrencyTracker onOpenStock={openStock} />;
      case "bonds": return <BondYields onOpenStock={openStock} />;
      case "sectorheat": return <SectorHeatmap onOpenStock={openStock} />;
      case "breadth": return <MarketBreadth onOpenStock={openStock} />;
      case "insidersentiment": return <InsiderSentiment onOpenStock={openStock} />;
      case "institutional": return <InstitutionalHoldings onOpenStock={openStock} />;
      case "shortinterest": return <ShortInterest onOpenStock={openStock} />;
      case "analyst": return <AnalystRatings onOpenStock={openStock} />;
      case "dividend": return <DividendCalendar onOpenStock={openStock} />;
      case "splits": return <StockSplits onOpenStock={openStock} />;
      case "movers": return <MarketMovers onOpenStock={openStock} />;
      case "indices": return <GlobalIndices onOpenStock={openStock} />;
      case "features": return <FeaturesGrid onNavigate={navigate} />;
      case "stock": return symbol ? <StockDetail symbol={symbol} onBack={goDashboard} onOpenStock={openStock} watched={watch.has(symbol)} onToggleWatch={(s) => (watch.has(s) ? watch.remove(s) : watch.add(s))} onAddHolding={(s) => { setPendingHolding(s); setView("portfolio"); }} /> : null;
      default: return <Dashboard onOpenStock={openStock} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={goDashboard} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center"><TrendingUp size={18} className="text-ink-950" /></div>
            <span className="font-bold text-ink-50 hidden sm:block text-base">GlobalStock<span className="text-brand-400">Analyser</span></span>
            {live && (<span className="flex items-center gap-1.5 chip bg-bull/15 text-bull ml-1"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-60" /><span className="relative inline-flex rounded-full h-2 w-2 bg-bull" /></span><span className="text-xs font-bold tracking-wide">LIVE</span></span>)}
          </button>
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {NAV_MAIN.map((n) => (<button key={n.id} onClick={() => navigate(n.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === n.id ? "bg-white/10 text-ink-100" : "text-ink-400 hover:text-ink-200 hover:bg-white/5"}`}>{n.icon} {n.label}</button>))}
            <button onClick={() => navigate("features")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === "features" ? "bg-white/10 text-ink-100" : "text-ink-400 hover:text-ink-200 hover:bg-white/5"}`}><Zap size={18} /> More</button>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <CurrencySelector />
            <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-ink-400 hover:text-ink-200 hover:border-white/20 transition text-sm w-32 sm:w-48">
              <Search size={16} /><span className="text-ink-500 hidden sm:inline text-sm">Search...</span><kbd className="ml-auto text-xs text-ink-600 border border-white/10 rounded px-1.5 py-0.5 hidden sm:block">Cmd K</kbd>
            </button>
          </div>
        </div>
        <nav className="lg:hidden flex items-center gap-1 px-2 pb-2 overflow-x-auto no-scrollbar">
          {NAV_MAIN.map((n) => (<button key={n.id} onClick={() => navigate(n.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${view === n.id ? "bg-white/10 text-ink-100" : "text-ink-400"}`}>{n.icon} {n.label}</button>))}
          <button onClick={() => navigate("features")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${view === "features" ? "bg-white/10 text-ink-100" : "text-ink-400"}`}><Zap size={14} /> More</button>
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">{renderView()}</main>
      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-500">
          <div className="flex items-center gap-2"><Globe2 size={16} /> GlobalStock Analyser - 90 trillion+ stocks worldwide</div>
          <div className="flex items-center gap-4"><span>10000 AI Agents - 1000+ Techniques - 1050 AI Companies - INR Default</span></div>
        </div>
      </footer>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={openStock} />
    </div>
  );
}

export default function App() {
  return (<CurrencyProvider><AppInner /></CurrencyProvider>);
}
