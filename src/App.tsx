import { useEffect, useState } from 'react';
import { LineChart, Star, Briefcase, GitCompare, Filter, Search, Globe2, TrendingUp } from 'lucide-react';
import { SearchPalette } from './components/SearchPalette';
import { Dashboard } from './views/Dashboard';
import { StockDetail } from './views/StockDetail';
import { Screener } from './views/Screener';
import { Compare } from './views/Compare';
import { Watchlist } from './views/Watchlist';
import { Portfolio } from './views/Portfolio';
import { useWatchlist, usePortfolio } from './lib/hooks';
import { useLiveQuotes } from './lib/liveFeed';

type View = 'dashboard' | 'screener' | 'compare' | 'watchlist' | 'portfolio' | 'stock';

export default function App() {
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
    { id: 'compare', label: 'Compare', icon: <GitCompare size={18} /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Star size={18} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Briefcase size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
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

          <nav className="hidden md:flex items-center gap-1 ml-4">
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => { setView(n.id); setSymbol(null); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === n.id ? 'bg-white/10 text-ink-100' : 'text-ink-400 hover:text-ink-200 hover:bg-white/5'}`}
              >
                {n.icon} {n.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-ink-400 hover:text-ink-200 hover:border-white/20 transition text-sm w-40 sm:w-64"
          >
            <Search size={15} />
            <span className="text-ink-500">Search stocks…</span>
            <kbd className="ml-auto text-[10px] text-ink-600 border border-white/10 rounded px-1.5 py-0.5 hidden sm:block">⌘K</kbd>
          </button>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 px-2 pb-2 overflow-x-auto no-scrollbar">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => { setView(n.id); setSymbol(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${view === n.id ? 'bg-white/10 text-ink-100' : 'text-ink-400'}`}
            >
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {view === 'dashboard' && <Dashboard onOpenStock={openStock} />}
        {view === 'screener' && <Screener onOpenStock={openStock} />}
        {view === 'compare' && <Compare onOpenStock={openStock} />}
        {view === 'watchlist' && (
          <Watchlist items={watch.items} onOpenStock={openStock} onRemove={watch.remove} loading={watch.loading} />
        )}
        {view === 'portfolio' && (
          <Portfolio
            items={portfolio.items}
            onRemove={portfolio.remove}
            onAdd={portfolio.add}
            loading={portfolio.loading}
            pendingSymbol={pendingHolding}
            clearPending={() => setPendingHolding(null)}
          />
        )}
        {view === 'stock' && symbol && (
          <StockDetail
            symbol={symbol}
            onBack={goDashboard}
            onOpenStock={openStock}
            watched={watch.has(symbol)}
            onToggleWatch={(s) => (watch.has(s) ? watch.remove(s) : watch.add(s))}
            onAddHolding={(s) => { setPendingHolding(s); setView('portfolio'); }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500">
          <div className="flex items-center gap-2">
            <Globe2 size={14} /> GlobalStock Analyser — free world-wide stock analysis
          </div>
          <div className="flex items-center gap-4">
            <span>Data is simulated for demonstration. Wire a live feed in <code className="text-ink-400">dataService.ts</code>.</span>
          </div>
        </div>
      </footer>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={openStock} />
    </div>
  );
}
