import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { searchStocks } from "../lib/universe";
import { getLiveQuote } from "../lib/dataService";

interface Props { open: boolean; onClose: () => void; onSelect: (symbol: string) => void; }

export function SearchPalette({ open, onClose, onSelect }: Props) {
  const [q, setQ] = useState("");
  const results = useMemo(() => { if (!q) return searchStocks("", 10); return searchStocks(q, 20); }, [q]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3">
          <Search size={18} className="text-ink-500" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stocks..." className="flex-1 bg-transparent text-ink-100 text-sm focus:outline-none" />
          <button onClick={onClose} className="text-ink-500 hover:text-ink-200"><X size={16} /></button>
        </div>
        <div className="max-h-80 overflow-y-auto space-y-0.5">
          {results.map((s) => {
            const q2 = getLiveQuote(s.symbol);
            return (
              <button key={s.symbol} onClick={() => { onSelect(s.symbol); onClose(); setQ(""); }} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 text-left transition">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink-100 text-sm">{s.symbol}</div>
                  <div className="text-xs text-ink-500 truncate">{s.name}</div>
                </div>
                <div className="text-xs text-ink-600">{s.region}</div>
                {q2 && <div className={`text-xs font-mono ${q2.changePct >= 0 ? "text-bull" : "text-bear"}`}>{q2.changePct >= 0 ? "+" : ""}{q2.changePct.toFixed(1)}%</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
