import { useMemo, useState } from "react";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { REAL_STOCKS, ALL_REGIONS, ALL_SECTORS } from "../lib/universe";
import { getQuote } from "../lib/dataService";
import { useCurrency } from "../lib/currency";
import { fmtPct, fmtCompact } from "../lib/format";
import type { Region, Sector, Quote, StockMeta } from "../lib/types";

type SortKey = "symbol" | "name" | "price" | "changePct" | "volume" | "marketCap" | "pe";
type SortDir = "asc" | "desc";

interface Filters {
  query: string;
  region: Region | "All";
  sector: Sector | "All";
  minPrice: string;
  maxPrice: string;
  minPe: string;
  maxPe: string;
  minDivYield: string;
}

const DEFAULT_FILTERS: Filters = {
  query: "",
  region: "All",
  sector: "All",
  minPrice: "",
  maxPrice: "",
  minPe: "",
  maxPe: "",
  minDivYield: "",
};

const PAGE_SIZE = 50;

export function Screener({ onOpenStock }: { onOpenStock: (s: string) => void }) {
  const { formatPrice, formatCompact } = useCurrency();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : -Infinity;
    const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
    const minPe = filters.minPe ? parseFloat(filters.minPe) : -Infinity;
    const maxPe = filters.maxPe ? parseFloat(filters.maxPe) : Infinity;
    const minDiv = filters.minDivYield ? parseFloat(filters.minDivYield) : -Infinity;
    const q = filters.query.toUpperCase();

    const out: { meta: StockMeta; q: Quote }[] = [];
    for (const meta of REAL_STOCKS) {
      if (q && !meta.symbol.includes(q) && !meta.name.toUpperCase().includes(q)) continue;
      if (filters.region !== "All" && meta.region !== filters.region) continue;
      if (filters.sector !== "All" && meta.sector !== filters.sector) continue;
      const quote = getQuote(meta.symbol);
      if (quote.price < minPrice || quote.price > maxPrice) continue;
      if (quote.pe < minPe || quote.pe > maxPe) continue;
      if (quote.divYield < minDiv) continue;
      out.push({ meta, q: quote });
    }

    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "symbol") { av = a.meta.symbol; bv = b.meta.symbol; }
      else if (sortKey === "name") { av = a.meta.name; bv = b.meta.name; }
      else if (sortKey === "price") { av = a.q.price; bv = b.q.price; }
      else if (sortKey === "changePct") { av = a.q.changePct; bv = b.q.changePct; }
      else if (sortKey === "volume") { av = a.q.volume; bv = b.q.volume; }
      else if (sortKey === "marketCap") { av = a.q.marketCap; bv = b.q.marketCap; }
      else { av = a.q.pe; bv = b.q.pe; }
      if (typeof av === "string" && typeof bv === "string") {
        return av < bv ? -dir : av > bv ? dir : 0;
      }
      return ((av as number) - (bv as number)) * dir;
    });
    return out;
  }, [filters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  }

  function SortHeader({ label, k, align = "right" }: { label: string; k: SortKey; align?: "left" | "right" }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`flex items-center gap-1 ${align === "left" ? "justify-start" : "justify-end"} w-full text-left ${active ? "text-brand-300" : "text-ink-400"} hover:text-ink-100 transition`}
      >
        {label}
        <ArrowUpDown className={`w-3.5 h-3.5 ${active ? "opacity-100" : "opacity-40"}`} />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <Filter className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold gradient-text">Stock Screener</h1>
      </div>

      {/* Filters */}
      <div className="card p-4 animate-fade-in">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-ink-500 shrink-0" />
            <input
              type="text"
              placeholder="Search by symbol or name..."
              value={filters.query}
              onChange={(e) => { setFilters((f) => ({ ...f, query: e.target.value })); setPage(0); }}
              className="input flex-1 text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-ink-500">Region</label>
              <select
                value={filters.region}
                onChange={(e) => { setFilters((f) => ({ ...f, region: e.target.value as Region | "All" })); setPage(0); }}
                className="input text-base"
              >
                <option value="All">All Regions</option>
                {ALL_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-ink-500">Sector</label>
              <select
                value={filters.sector}
                onChange={(e) => { setFilters((f) => ({ ...f, sector: e.target.value as Sector | "All" })); setPage(0); }}
                className="input text-base"
              >
                <option value="All">All Sectors</option>
                {ALL_SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-ink-500">Min Price</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => { setFilters((f) => ({ ...f, minPrice: e.target.value })); setPage(0); }}
                className="input text-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-ink-500">Max Price</label>
              <input
                type="number"
                placeholder="99999"
                value={filters.maxPrice}
                onChange={(e) => { setFilters((f) => ({ ...f, maxPrice: e.target.value })); setPage(0); }}
                className="input text-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-ink-500">Min P/E</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPe}
                onChange={(e) => { setFilters((f) => ({ ...f, minPe: e.target.value })); setPage(0); }}
                className="input text-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-ink-500">Max P/E</label>
              <input
                type="number"
                placeholder="100"
                value={filters.maxPe}
                onChange={(e) => { setFilters((f) => ({ ...f, maxPe: e.target.value })); setPage(0); }}
                className="input text-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-ink-500">Min Div Yield (%)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minDivYield}
                onChange={(e) => { setFilters((f) => ({ ...f, minDivYield: e.target.value })); setPage(0); }}
                className="input text-base"
              />
            </div>
            <div className="flex items-end">
              <button onClick={resetFilters} className="btn-outline w-full text-base">
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-base text-ink-400">
          Showing <span className="text-ink-100 font-semibold">{rows.length}</span> stocks
        </span>
        <span className="text-sm text-ink-500">
          Page {safePage + 1} of {totalPages}
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-fade-in">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-ink-900/80">
                <th className="px-4 py-3"><SortHeader label="Symbol" k="symbol" align="left" /></th>
                <th className="px-4 py-3"><SortHeader label="Name" k="name" align="left" /></th>
                <th className="px-4 py-3"><SortHeader label="Price" k="price" /></th>
                <th className="px-4 py-3"><SortHeader label="Change %" k="changePct" /></th>
                <th className="px-4 py-3"><SortHeader label="Volume" k="volume" /></th>
                <th className="px-4 py-3"><SortHeader label="Market Cap" k="marketCap" /></th>
                <th className="px-4 py-3"><SortHeader label="P/E" k="pe" /></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ meta, q }) => {
                const up = q.changePct >= 0;
                return (
                  <tr
                    key={meta.symbol}
                    onClick={() => onOpenStock(meta.symbol)}
                    className="border-b border-white/5 cursor-pointer hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">
                      <span className="text-base font-semibold text-ink-100">{meta.symbol}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-base text-ink-300 truncate block max-w-[200px]">{meta.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-base text-ink-100">{formatPrice(q.price)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-base font-medium ${up ? "text-bull" : "text-bear"}`}>
                        {fmtPct(q.changePct)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-base text-ink-300">{fmtCompact(q.volume)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-base text-ink-300">{formatCompact(q.marketCap)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-base text-ink-300">{q.pe.toFixed(2)}</span>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-base text-ink-500">
                    No stocks match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="btn-outline text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <span className="text-base text-ink-300 px-3">
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="btn-outline text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
