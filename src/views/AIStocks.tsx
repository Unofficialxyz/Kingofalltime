import { useMemo, useState } from "react";
import { Bot, Search, ChevronLeft, ChevronRight, Cpu } from "lucide-react";
import { STOCK_UNIVERSE, REGIONS, SECTORS } from "../lib/universe";
import { getLiveQuote } from "../lib/dataService";
import { useLiveQuotes } from "../lib/hooks";
import { useCurrency } from "../lib/currency";
import { fmtNum, fmtPctRaw } from "../lib/format";

interface AIStocksProps {
  onOpenStock: (s: string) => void;
}

const PAGE_SIZE = 24;

export function AIStocks({ onOpenStock }: AIStocksProps) {
  useLiveQuotes();
  const { formatPrice } = useCurrency();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  const aiStocks = useMemo(() => {
    return STOCK_UNIVERSE.filter((s) => s.symbol.startsWith("AI"));
  }, []);

  const filtered = useMemo(() => {
    let out = aiStocks;
    if (regionFilter !== "all") out = out.filter((s) => s.region === regionFilter);
    if (sectorFilter !== "all") out = out.filter((s) => s.sector === sectorFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    return out;
  }, [aiStocks, regionFilter, sectorFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageStocks = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const rows = useMemo(() => {
    return pageStocks.map((meta) => {
      const quote = getLiveQuote(meta.symbol);
      return { meta, quote };
    });
  }, [pageStocks]);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Bot size={18} className="text-accent-400" />
        <h2 className="text-lg font-semibold text-ink-100">AI Stocks</h2>
        <span className="chip bg-ink-800 text-ink-400">{aiStocks.length} companies</span>
        <span className="chip bg-brand-500/20 text-brand-300">{filtered.length} matching</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search AI stocks..."
            className="input pl-9"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => { setRegionFilter(e.target.value); setPage(0); }}
          className="input"
        >
          <option value="all">All Regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={sectorFilter}
          onChange={(e) => { setSectorFilter(e.target.value); setPage(0); }}
          className="input"
        >
          <option value="all">All Sectors</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-ink-900/50">
                <th className="text-left py-3 px-4 font-medium text-ink-400">Symbol</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden md:table-cell">Name</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden lg:table-cell">Industry</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden sm:table-cell">Sector</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden lg:table-cell">Region</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Price</th>
                <th className="text-right py-3 px-4 font-medium text-ink-400">Change %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const positive = r.quote ? r.quote.changePct >= 0 : true;
                return (
                  <tr
                    key={r.meta.symbol}
                    onClick={() => onOpenStock(r.meta.symbol)}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-accent-400 shrink-0" />
                        <span className="font-semibold text-ink-100">{r.meta.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ink-400 hidden md:table-cell truncate max-w-[180px]">{r.meta.name}</td>
                    <td className="py-3 px-4 text-ink-500 hidden lg:table-cell truncate max-w-[140px]">{r.meta.industry}</td>
                    <td className="py-3 px-4 text-ink-400 hidden sm:table-cell">{r.meta.sector}</td>
                    <td className="py-3 px-4 text-ink-400 hidden lg:table-cell">{r.meta.region}</td>
                    <td className="py-3 px-4 text-right font-mono text-ink-200">
                      {r.quote ? formatPrice(r.quote.price, r.meta.currency) : "—"}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono ${positive ? "text-bull" : "text-bear"}`}>
                      {r.quote ? (positive ? "+" : "") + fmtPctRaw(r.quote.changePct) + "%" : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-ink-500">
          Page {safePage + 1} of {totalPages} - Showing {pageStocks.length} of {filtered.length} stocks
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="btn-outline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
            disabled={safePage >= totalPages - 1}
            className="btn-outline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIStocks;
