import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { STOCK_UNIVERSE, REGIONS, SECTORS, getMetaByIndex } from "../lib/universe";
import { getLiveQuote } from "../lib/dataService";
import { useLiveQuotes } from "../lib/hooks";
import { useCurrency } from "../lib/currency";
import { fmtPctRaw, fmtCompact } from "../lib/format";
import type { Quote, Region, Sector } from "../lib/types";

interface ScreenerProps {
  onOpenStock: (s: string) => void;
}

type SortKey = "marketCap" | "changePct" | "pe" | "volume" | "dividendYield";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "marketCap", label: "Market Cap" },
  { key: "changePct", label: "Change %" },
  { key: "pe", label: "P/E" },
  { key: "volume", label: "Volume" },
  { key: "dividendYield", label: "Div Yield" },
];

export function Screener({ onOpenStock }: ScreenerProps) {
  useLiveQuotes();
  const { formatPrice, formatCompact } = useCurrency();

  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<Region | "All">("All");
  const [sector, setSector] = useState<Sector | "All">("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [minDivYield, setMinDivYield] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  // Build candidate list from the real stock universe (first 2000 for performance)
  const candidates = useMemo(() => {
    const limit = Math.min(STOCK_UNIVERSE.length, 2000);
    const out: { symbol: string; name: string; region: Region; sector: Sector; currency: string; quote: Quote }[] = [];
    for (let i = 0; i < limit; i++) {
      const meta = STOCK_UNIVERSE[i];
      if (!meta) break;
      const q = getLiveQuote(meta.symbol);
      if (!q) continue;
      out.push({
        symbol: meta.symbol,
        name: meta.name,
        region: meta.region,
        sector: meta.sector,
        currency: meta.currency,
        quote: q,
      });
    }
    return out;
  }, []);

  // Apply filters
  const filtered = useMemo(() => {
    const minP = minPrice ? parseFloat(minPrice) : 0;
    const maxPERatio = maxPe ? parseFloat(maxPe) : Infinity;
    const minDY = minDivYield ? parseFloat(minDivYield) : 0;
    const lowerSearch = search.trim().toLowerCase();

    return candidates.filter((c) => {
      if (region !== "All" && c.region !== region) return false;
      if (sector !== "All" && c.sector !== sector) return false;
      if (lowerSearch && !c.symbol.toLowerCase().includes(lowerSearch) && !c.name.toLowerCase().includes(lowerSearch)) return false;
      if (c.quote.price < minP) return false;
      if (c.quote.pe > maxPERatio) return false;
      if (c.quote.dividendYield < minDY) return false;
      return true;
    });
  }, [candidates, region, sector, search, minPrice, maxPe, minDivYield]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a.quote[sortKey];
      const bv = b.quote[sortKey];
      const diff = av - bv;
      return sortDir === "asc" ? diff : -diff;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  function SortHeader({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`flex items-center gap-1 hover:text-ink-100 transition ${active ? "text-brand-400" : "text-ink-400"}`}
      >
        {label}
        <ArrowUpDown size={12} className={active ? "opacity-100" : "opacity-40"} />
      </button>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search size={18} className="text-brand-400" />
        <h2 className="text-lg font-semibold text-ink-100">Stock Screener</h2>
        <span className="chip bg-ink-800 text-ink-400">{sorted.length} results</span>
      </div>

      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              placeholder="Search symbol or name"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="input pl-9"
            />
          </div>

          {/* Region */}
          <select
            value={region}
            onChange={(e) => { setRegion(e.target.value as Region | "All"); setPage(0); }}
            className="input"
          >
            <option value="All">All Regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Sector */}
          <select
            value={sector}
            onChange={(e) => { setSector(e.target.value as Sector | "All"); setPage(0); }}
            className="input"
          >
            <option value="All">All Sectors</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Min Price */}
          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(0); }}
            className="input"
          />

          {/* Max P/E */}
          <input
            type="number"
            placeholder="Max P/E"
            value={maxPe}
            onChange={(e) => { setMaxPe(e.target.value); setPage(0); }}
            className="input"
          />

          {/* Min Div Yield */}
          <input
            type="number"
            placeholder="Min Div Yield %"
            value={minDivYield}
            onChange={(e) => { setMinDivYield(e.target.value); setPage(0); }}
            className="input"
          />
        </div>

        {/* Sort chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-500">Sort by:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => toggleSort(opt.key)}
              className={`chip transition ${sortKey === opt.key ? "tab-active bg-ink-800 text-brand-400 border-brand-400" : "bg-ink-800 text-ink-400 hover:text-ink-200"}`}
            >
              {opt.label}
              {sortKey === opt.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-ink-900/50">
                <th className="text-left py-3 px-4 font-medium text-ink-400">Symbol</th>
                <th className="text-left py-3 px-4 font-medium text-ink-400 hidden md:table-cell">Name</th>
                <th className="text-right py-3 px-4 font-medium"><SortHeader k="marketCap" label="Price" /></th>
                <th className="text-right py-3 px-4 font-medium"><SortHeader k="changePct" label="Chg %" /></th>
                <th className="text-right py-3 px-4 font-medium"><SortHeader k="marketCap" label="Mkt Cap" /></th>
                <th className="text-right py-3 px-4 font-medium hidden lg:table-cell"><SortHeader k="pe" label="P/E" /></th>
                <th className="text-right py-3 px-4 font-medium hidden lg:table-cell"><SortHeader k="dividendYield" label="Div %" /></th>
                <th className="text-right py-3 px-4 font-medium hidden xl:table-cell"><SortHeader k="volume" label="Volume" /></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => {
                const positive = c.quote.changePct >= 0;
                return (
                  <tr
                    key={c.symbol}
                    onClick={() => onOpenStock(c.symbol)}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-semibold text-ink-100">{c.symbol}</td>
                    <td className="py-3 px-4 text-ink-400 hidden md:table-cell truncate max-w-[200px]">{c.name}</td>
                    <td className="py-3 px-4 text-right font-mono text-ink-200">{formatPrice(c.quote.price, c.currency)}</td>
                    <td className={`py-3 px-4 text-right font-mono ${positive ? "text-bull" : "text-bear"}`}>
                      {positive ? "+" : ""}{fmtPctRaw(c.quote.changePct)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-300">{formatCompact(c.quote.marketCap, c.currency)}</td>
                    <td className="py-3 px-4 text-right font-mono text-ink-300 hidden lg:table-cell">
                      {c.quote.pe > 0 ? c.quote.pe.toFixed(1) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-300 hidden lg:table-cell">
                      {c.quote.dividendYield > 0 ? c.quote.dividendYield.toFixed(2) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink-400 hidden xl:table-cell">{fmtCompact(c.quote.volume)}</td>
                  </tr>
                );
              })}
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink-500">
                    No stocks match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <div className="text-sm text-ink-500">
            Page {currentPage + 1} of {totalPages} ({sorted.length} stocks)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Screener;
