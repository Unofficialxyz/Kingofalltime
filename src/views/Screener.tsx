import { useMemo, useState } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { STOCK_UNIVERSE } from '../lib/universe';
import { getFundamentals, getCandles } from '../lib/dataService';
import { getLiveQuote, useLiveQuotes } from '../lib/liveFeed';
import { REGIONS, SECTORS } from '../lib/universe';
import { analyzeTechnicals } from '../lib/indicators';
import { scoreFundamentals } from '../lib/fundamentalScore';
import { forecast, recommend } from '../lib/forecast';
import { fmtCompact, fmtPctRaw, fmtNum } from '../lib/format';
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
}

export function Screener({ onOpenStock }: Props) {
  useLiveQuotes();
  const [filters, setFilters] = useState<Filters>({
    region: 'all', sector: 'all', minPrice: 0, maxPE: 100, minDiv: 0,
    sortBy: 'marketCap', sortDir: 'desc',
  });
  const [showFilters, setShowFilters] = useState(true);

  const rows = useMemo(() => {
    const out = STOCK_UNIVERSE.map((s) => {
      const q = getLiveQuote(s.symbol)!;
      const f = getFundamentals(s.symbol)!;
      const candles = getCandles(s.symbol, '1Y');
      const tech = analyzeTechnicals(candles);
      const fundScore = scoreFundamentals(f);
      const fc = forecast(candles, f, tech);
      const rec = recommend(tech, fundScore.score, fc, f);
      return { meta: s, q, f, rec };
    }).filter((r) => {
      if (filters.region !== 'all' && r.meta.region !== filters.region) return false;
      if (filters.sector !== 'all' && r.meta.sector !== filters.sector) return false;
      if (r.q.price < filters.minPrice) return false;
      if (r.q.pe > filters.maxPE) return false;
      if (r.q.dividendYield * 100 < filters.minDiv) return false;
      return true;
    });
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Screener</h1>
          <p className="text-ink-400 text-sm">Filter the global universe by region, sector, valuation and yield.</p>
        </div>
        <button onClick={() => setShowFilters((v) => !v)} className="btn-outline">
          <SlidersHorizontal size={15} /> {showFilters ? 'Hide' : 'Show'} filters
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
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
          <Field label="Min price">
            <input type="number" className="input" value={filters.minPrice} onChange={(e) => setFilters((f) => ({ ...f, minPrice: +e.target.value }))} />
          </Field>
          <Field label="Max P/E">
            <input type="number" className="input" value={filters.maxPE} onChange={(e) => setFilters((f) => ({ ...f, maxPE: +e.target.value }))} />
          </Field>
          <Field label="Min div yield %">
            <input type="number" className="input" value={filters.minDiv} onChange={(e) => setFilters((f) => ({ ...f, minDiv: +e.target.value }))} />
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
          <div className="flex items-end gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, sortDir: f.sortDir === 'asc' ? 'desc' : 'asc' }))}
              className="btn-outline"
            >{filters.sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 text-sm text-ink-400">
          <Filter size={14} /> {rows.length} matches
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
              {rows.map((r) => (
                <tr
                  key={r.meta.symbol}
                  onClick={() => onOpenStock(r.meta.symbol)}
                  className="border-t border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition"
                >
                  <td className="px-4 py-2.5 font-semibold text-ink-100">{r.meta.symbol}</td>
                  <td className="px-4 py-2.5 text-ink-400 truncate max-w-[200px] hidden sm:table-cell">{r.meta.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-100">{fmtNum(r.q.price)}</td>
                  <td className={`px-4 py-2.5 text-right font-mono ${r.q.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>{r.q.changePct >= 0 ? '+' : ''}{fmtPctRaw(r.q.changePct)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-300 hidden md:table-cell">${fmtCompact(r.q.marketCap)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-300 hidden md:table-cell">{fmtNum(r.q.pe)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-300 hidden lg:table-cell">{fmtPctRaw(r.q.dividendYield * 100)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-400 hidden lg:table-cell">{fmtCompact(r.q.volume)}</td>
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
