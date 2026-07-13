import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { searchStocks } from "../lib/universe";
import type { StockMeta } from "../lib/types";

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
}

export function SearchPalette({ open, onClose, onSelect }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(""); setResults([]); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    if (query.trim().length > 0) setResults(searchStocks(query, 30));
    else setResults([]);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl card shadow-2xl animate-slide-up">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Search size={20} className="text-ink-500" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 90T+ stocks..." className="flex-1 bg-transparent text-ink-100 placeholder-ink-600 focus:outline-none text-lg" />
          <button onClick={onClose} className="text-ink-500 hover:text-ink-200"><X size={20} /></button>
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {results.length === 0 && query.length > 0 && <div className="px-4 py-8 text-center text-ink-500">No results found</div>}
          {results.length === 0 && query.length === 0 && <div className="px-4 py-8 text-center text-ink-500">Start typing to search 90 trillion+ stocks worldwide</div>}
          {results.map((s) => (
            <button key={s.symbol} onClick={() => { onSelect(s.symbol); onClose(); }} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition text-left">
              <div>
                <div className="font-mono font-semibold text-ink-100 text-sm">{s.symbol}</div>
                <div className="text-xs text-ink-500">{s.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip bg-white/5 text-ink-400 text-xs">{s.region}</span>
                <span className="chip bg-white/5 text-ink-400 text-xs">{s.sector}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
