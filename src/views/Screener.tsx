import { useMemo, useState } from 'react';
import { Filter, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { STOCK_UNIVERSE, REGIONS, SECTORS } from '../lib/universe';
import { getLiveQuote, useLiveQuotes } from '../lib/liveFeed';
import { analyzeTechnicals } from '../lib/indicators';
import { scoreFundamentals } from '../lib/fundamentalScore';
import { forecast, recommend } from '../lib/forecast';
import { getFundamentals, getCandles } from '../lib/dataService';
import { useCurrency } from '../lib/currency';
import { fmtPctRaw, fmtNum } from '../lib/format';
import type { Region, Sector } from '../lib/types';

interface Props { onOpenStock: (s: string) => void; }

interface Filters {
  region: 'all' | Region;
  sector: 'all' | Sector;
  minPrice: number;
  maxPE: number;
  minDiv: number;
  sortBy: 'changePct' | 'marketCap' | 'pe' | 'volume' | 'dividendYield' | 'recommend';
  sortDir: 'asc' | 'desc';
  search: string;
}

const PAGE_SIZE = 50;

export function Screener({ onOpenStock }: Props) {
  useLiveQuotes();
  const { formatPrice, formatCompact } = useCurrency();
  const [filters, setFilters] = useState<Filters>({
    region: 'all', sector: 'all', minPrice: 0, maxPE: 9999, minDiv: 0,
    sortBy: 'marketCap', sortDir: 'desc', search: '',
  });
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const filtered = STOCK_UNIVERSE.filter((s) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!s.symbol.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) return false;
      }
      if (filters.region !== 'all' && s.region !== filters.region) return false;
      if (filters.sector !== 'all' && s.sector !== filters.sector) return false;
      return true;
    });

    // Only compute heavy metrics for first 500 filtered results
    const subset = filtered.slice(0, 500);
    const out = subset.map((s) => {
      const q = getLiveQuote(s.symbol);
      if (!q) return null;
      if (q.price < filters.minPrice) return null;
      if (q.pe > filters.maxPE) return null;
      if (q.dividendYield * 100 < filters.minDiv) return null;
      const f = getFundamentals(s.symbol);
      let rec: ReturnType<typeof recommend> = null;
      if (f) {
        const candles = getCandles(s.symbol, '1Y');
        const tech = analyzeTechnicals(candles);
        const fundScore = scoreFundamentals(f);
        const fc = forecast(candles, f, tech);
        rec = recommend(tech, fundScore.score, fc, f);
      }
      return { meta: s, q, rec };
    }).filter(Boolean) as { meta: typeof STOCK_UNIVERSE[0]; q: NonNullable<ReturnType<typeof getLiveQuote>>; rec: ReturnType<typeof recommend> }[];

    out.sort((a, b) => {
      const dir = filters.sortDir === 'asc' ? 1 : -1;
      if (filters.sortBy === 'recommend') return ((a.rec?.score ?? 50) - (b.rec?.score ?? 50)) * dir;
      const key = filters.sortBy;
      const av = key === 'dividendYield' ? a.q.dividendYield : key === 'marketCap' ? a.q.marketCap : key === 'volume' ? a.q.volume : a.q[key as 'pe' | 'changePct'];
      const bv = key === 'dividendYield' ? b.q.dividendYield : key === 'marketCap' ? b.q.marketCap : key === 'volume' ? b.q.volume : b.q[key as 'pe' | 'changePct'];
      return (av - bv) * dir;
    });
    return out;
  }, [filters]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Screener</h1>
          <p className="text-ink-400 text-sm">Filter {STOCK_UNIVERSE.length.toLocaleString()}+ stocks by region, sector, valuation and signals.</p>
        </div>
        <button onClick={() => setShowFilters((v) => !v)} className="btn-outline">
          <SlidersHorizontal size={15} /> {showFilters ? 'Hide' : 'Show'} filters
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Search">
            <input type="text" className="input" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Symbol or name…" />
          </Field>
          <Field label="Region">
            <select className="input" value={filters.region} onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value as Filters['region'] }))}>
              <option value="all">All regions</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Sector">
            <select className="input" value={filters.sector} onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value as Filters['sector'] }))}>
              <option value="all">All sectors</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Sort by">
            <select className="input" value={filters.sortBy} onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as Filters['sortBy'] }))}>
              <option value="marketCap">Market cap</option>
              <option value="changePct">Day change %</option>
              <option value="pe">P/E</option>
              <option value="volume">Volume</option>
              <option value="dividendYield">Dividend yield</option>
              <option value="recommend">Recommendation score</option>
            </select>
          </Field>
          <Field label="Min price">
            <input type="number" className="input" value={filters.minPrice} onChange={(e) => setFilters((f) => ({ ...f, minPrice: +e.target.value }))} />
          </Field>
          <Field label="Max P/E">
            <input type="number" className="input" value={filters.maxPE} onChange={(e) => setFilters((f) => ({ ...f, maxPE: +e.target.value }))} />
          </Field>
          <Field label="Min div yield %">
            <input type="number" className="input" value={filters.minDiv} onChange={(e) => setFilters((f) => ({ ...f, minDiv: +e.target.value }))} />
          </Field>
          <div className="flex items-end gap-2">
            <button onClick={() => setFilters((f) => ({ ...f, sortDir: f.sortDir === 'asc' ? 'desc' : 'asc' }))} className="btn-outline">
              {filters.sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
            <button onClick={() => setFilters({ region: 'all', sector: 'all', minPrice: 0, maxPE: 9999, minDiv: 0, sortBy: 'marketCap', sortDir: 'desc', search: '' })} className="btn-ghost text-xs">Reset</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 text-sm text-ink-400">
          <Filter size={14} /> {rows.length} matches (showing {pageRows.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-500 text-xs">
                <th className="text-left px-4 py-2 font-medium">Symbol</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Name</th>
                <th className="text-right px-4 py-2 font-medium">Price</th>
                <th className="text-right px-4 py-2 font-medium">Chg %</th>
                <th className="text-right px-4 py-2 font-medium hidden md:table-cell">Mkt cap</th>
                <th className="text-right px-4 py-2 font-medium hidden md:table-cell">P/E</th>
                <th className="text-right px-4 py-2 font-medium hidden lg:table-cell">Div %</th>
                <th className="text-right px-4 py-2 font-medium hidden lg:table-cell">Vol</th>
                <th className="text-right px-4 py-2 font-medium">Rec</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr
                  key={r.meta.symbol}
                  onClick={() => onOpenStock(r.meta.symbol)}
                  className="border-t border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition"
                >
                  <td className="px-4 py-2.5 font-semibold text-ink-100">{r.meta.symbol}</td>
                  <td className="px-4 py-2.5 text-ink-400 truncate max-w-[200px] hidden sm:table-cell">{r.meta.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-100">{formatPrice(r.q.price, r.meta.currency)}</td>
                  <td className={`px-4 py-2.5 text-right font-mono ${r.q.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>{r.q.changePct >= 0 ? '+' : ''}{fmtPctRaw(r.q.changePct)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-300 hidden md:table-cell">{formatCompact(r.q.marketCap, r.meta.currency)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-300 hidden md:table-cell">{fmtNum(r.q.pe)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-300 hidden lg:table-cell">{fmtPctRaw(r.q.dividendYield * 100)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-400 hidden lg:table-cell">{r.q.volume.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">
                    {r.rec && (
                      <span className={`chip ${r.rec.action.includes('Buy') ? 'bg-bull/15 text-bull' : r.rec.action.includes('Sell') ? 'bg-bear/15 text-bear' : 'bg-accent-400/15 text-accent-400'}`}>
                        {r.rec.action}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-outline text-xs disabled:opacity-30"
            ><ChevronLeft size={14} /> Prev</button>
            <span className="text-xs text-ink-500">Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-outline text-xs disabled:opacity-30"
            >Next <ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-ink-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
