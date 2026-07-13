import { useEffect, useRef, useState } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { searchStocks } from '../lib/dataService';
import type { StockMeta } from '../lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
}

export function SearchPalette({ open, onClose, onSelect }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<StockMeta[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setResults(searchStocks(''));
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setResults(searchStocks(q));
    setActive(0);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === 'Enter' && results[active]) { onSelect(results[active].symbol); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, active, onClose, onSelect]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-2xl card overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Search size={18} className="text-ink-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any stock worldwide — symbol, name, exchange, region…"
            className="flex-1 bg-transparent text-ink-100 placeholder:text-ink-500 focus:outline-none text-base"
          />
          <button onClick={onClose} className="text-ink-500 hover:text-ink-200"><X size={18} /></button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-ink-500 text-sm">No matches for "{q}"</div>
          )}
          {results.map((s, i) => (
            <button
              key={s.symbol}
              onMouseEnter={() => setActive(i)}
              onClick={() => { onSelect(s.symbol); onClose(); }}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === active ? 'bg-white/5' : 'hover:bg-white/[0.03]'}`}
            >
              <div className="w-10 h-10 rounded-lg bg-ink-800 grid place-items-center text-xs font-bold text-brand-300 shrink-0">
                {s.symbol.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-100 truncate">{s.symbol}</span>
                  <span className="chip bg-white/5 text-ink-400">{s.exchange}</span>
                </div>
                <div className="text-xs text-ink-400 truncate">{s.name}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-ink-400">{s.region}</div>
                <div className="text-[11px] text-ink-500">{s.sector}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-4 text-[11px] text-ink-500">
          <span className="flex items-center gap-1"><TrendingUp size={12} /> {results.length} results</span>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
