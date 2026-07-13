import { useEffect, useState } from 'react';
import { LineChart, Star, Briefcase, GitCompare, Filter, Search, Globe2, TrendingUp, Grid3x3, Newspaper, DollarSign } from 'lucide-react';
import { SearchPalette } from './components/SearchPalette';
import { Dashboard } from './views/Dashboard';
import { StockDetail } from './views/StockDetail';
import { Screener } from './views/Screener';
import { Compare } from './views/Compare';
import { Watchlist } from './views/Watchlist';
import { Portfolio } from './views/Portfolio';
import { Heatmap } from './views/Heatmap';
import { MarketNews } from './views/MarketNews';
import { useWatchlist, usePortfolio, useLiveQuotes } from './lib/hooks';
import { CurrencyProvider, useCurrency, CURRENCIES } from './lib/currency';

type View = 'dashboard' | 'screener' | 'compare' | 'watchlist' | 'portfolio' | 'stock' | 'heatmap' | 'news';

function CurrencySelector() {
  const { display, setDisplay } = useCurrency();
  const [open, setOpen] = useState(false);
  const info = CURRENCIES.find((c) => c.code === display)!;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-ink-200 hover:bg-white/5 transition text-sm">
        <DollarSign size={14} />
        <span className="font-mono text-xs">{info.symbol}</span>
        <span className="text-xs text-ink-400 hidden sm:inline">{display}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 card max-h-72 overflow-y-auto z-50">
            {CURRENCIES.map((c) => (
              <button key={c.code} onClick={() => { setDisplay(c.code); setOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 text-sm ${c.code === display ? 'text-brand-300' : 'text-ink-200'}`}>
                <span className="text-base">{c.flag}</span>
                <span className="font-mono text-xs">{c.symbol}</span>
                <span className="text-xs text-ink-400">{c.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AppInner() {
  const [view, setView] = useState<View>('dashboard');
  const [symbol, setSymbol] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingHolding, setPendingHolding] = useState<string | null>(null);
  const watch = useWatchlist();
  const portfolio = usePortfolio();
  const { live } = useLiveQuotes();

  const openStock = (s: string) => { setSymbol(s); setView('stock'); };
  const goDashboard = () => { setView('dashboard'); setSymbol(null); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === '/' && !searchOpen && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const nav: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LineChart size={18} /> },
    { id: 'screener', label: 'Screener', icon: <Filter size={18} /> },
    { id: 'heatmap', label: 'Heat Map', icon: <Grid3x3 size={18} /> },
    { id: 'compare', label: 'Compare', icon: <GitCompare size={18} /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Star size={18} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Briefcase size={18} /> },
    { id: 'news', label: 'News', icon: <Newspaper size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={goDashboard} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center">
              <TrendingUp size={18} className="text-ink-950" />
            </div>
            <span className="font-bold text-ink-50 hidden sm:block">GlobalStock<span className="text-brand-400">Analyser</span></span>
            {live && (
              <span className="flex items-center gap-1.5 chip bg-bull/15 text-bull ml-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-bull" />
                </span>
                <span className="text-[10px] font-bold tracking-wide">LIVE</span>
              </span>
            )}
          </button>
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {nav.map((n) => (
              <button key={n.id} onClick={() => { setView(n.id); setSymbol(null); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === n.id ? 'bg-white/10 text-ink-100' : 'text-ink-400 hover:text-ink-200 hover:bg-white/5'}`}>{n.icon} {n.label}</button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <CurrencySelector />
            <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-ink-400 hover:text-ink-200 hover:border-white/20 transition text-sm w-32 sm:w-48">
              <Search size={15} />
              <span className="text-ink-500 hidden sm:inline">Search…</span>
              <kbd className="ml-auto text-[10px] text-ink-600 border border-white/10 rounded px-1.5 py-0.5 hidden sm:block">⌘K</kbd>
            </button>
          </div>
        </div>
        <nav className="lg:hidden flex items-center gap-1 px-2 pb-2 overflow-x-auto no-scrollbar">
          {nav.map((n) => (
            <button key={n.id} onClick={() => { setView(n.id); setSymbol(null); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${view === n.id ? 'bg-white/10 text-ink-100' : 'text-ink-400'}`}>{n.icon} {n.label}</button>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {view === 'dashboard' && <Dashboard onOpenStock={openStock} />}
        {view === 'screener' && <Screener onOpenStock={openStock} />}
        {view === 'heatmap' && <Heatmap onOpenStock={openStock} />}
        {view === 'compare' && <Compare onOpenStock={openStock} />}
        {view === 'watchlist' && <Watchlist items={watch.items} onOpenStock={openStock} onRemove={watch.remove} loading={watch.loading} />}
        {view === 'portfolio' && <Portfolio items={portfolio.items} onRemove={portfolio.remove} onAdd={portfolio.add} loading={portfolio.loading} pendingSymbol={pendingHolding} clearPending={() => setPendingHolding(null)} />}
        {view === 'news' && <MarketNews onOpenStock={openStock} />}
        {view === 'stock' && symbol && (
          <StockDetail symbol={symbol} onBack={goDashboard} onOpenStock={openStock} watched={watch.has(symbol)} onToggleWatch={(s) => (watch.has(s) ? watch.remove(s) : watch.add(s))} onAddHolding={(s) => { setPendingHolding(s); setView('portfolio'); }} />
        )}
      </main>
      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500">
          <div className="flex items-center gap-2"><Globe2 size={14} /> GlobalStock Analyser — 30,000+ stocks worldwide</div>
          <div className="flex items-center gap-4"><span>AI-powered analysis · Live prices · INR default currency</span></div>
        </div>
      </footer>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={openStock} />
    </div>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <AppInner />
    </CurrencyProvider>
  );
}
