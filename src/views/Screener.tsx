import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { STOCK_UNIVERSE, REGIONS, SECTORS, getMeta } from '../lib/universe';
import { getLiveQuote, getCandles, getFundamentals } from '../lib/dataService';
import { useLiveQuotes } from '../lib/hooks';
import { useCurrency } from '../lib/currency';
import { fmtPctRaw, fmtCompact } from '../lib/format';
import { analyzeTechnicals, scoreFundamentals } from '../lib/indicators';
import { forecast, recommend } from '../lib/forecast';
import type { Quote, Region, Sector, StockMeta } from '../lib/types';

interface Props {
  onOpenStock: (s: string) => void;
}

type SortKey = 'marketCap' | 'changePct' | 'pe' | 'volume' | 'dividendYield' | 'recommendation';
type SortDir = 'asc' | 'desc';

interface ScreenerRow {
  meta: StockMeta;
  quote: Quote;
  recommendation: string | null;
  recScore: number | null;
}

const PAGE_SIZE = 50;
const RECOMMEND_LIMIT = 500;

const RECOMMEND_COLORS: Record<string, string> = {
  'Strong Buy': 'text-bull bg-bull/10',
  'Buy': 'text-bull bg-bull/5',
  'Hold': 'text-ink-500 bg-ink-100',
  'Sell': 'text-bear bg-bear/5',
  'Strong Sell': 'text-bear bg-bear/10',
};

export function Screener({ onOpenStock }: Props) {
  useLiveQuotes();
  const { formatPrice, formatCompact } = useCurrency();

  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<Region | 'All'>('All');
  const [sector, setSector] = useState<Sector | 'All'>('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPE, setMaxPE] = useState('');
  const [minDivYield, setMinDivYield] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [recMap, setRecMap] = useState<Map<string, { action: string; score: number }>>(new Map());
  const [recLoading, setRecLoading] = useState(false);

  // Filter the universe
  const filtered = useMemo(() => {
    const minP = parseFloat(minPrice);
    const maxP = parseFloat(maxPE);
    const minD = parseFloat(minDivYield);
    const term = search.trim().toLowerCase();

    const rows: { meta: StockMeta; quote: Quote }[] = [];
    for (const s of STOCK_UNIVERSE) {
      if (region !== 'All' && s.region !== region) continue;
      if (sector !== 'All' && s.sector !== sector) continue;
      if (term && !s.symbol.toLowerCase().includes(term) && !s.name.toLowerCase().includes(term)) continue;
      const q = getLiveQuote(s.symbol);
      if (!q) continue;
      if (!isNaN(minP) && q.price < minP) continue;
      if (!isNaN(maxP) && q.pe > maxP) continue;
      if (!isNaN(minD) && q.dividendYield * 100 < minD) continue;
      rows.push({ meta: s, quote: q });
    }
    return rows;
  }, [search, region, sector, minPrice, maxPE, minDivYield]);

  // Sort all filtered rows
  const sorted = useMemo(() => {
    const withRec = filtered.map((r) => {
      const rec = recMap.get(r.meta.symbol);
      return {
        meta: r.meta,
        quote: r.quote,
        recommendation: rec?.action ?? null,
        recScore: rec?.score ?? null,
      } as ScreenerRow;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    withRec.sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case 'marketCap': av = a.quote.marketCap; bv = b.quote.marketCap; break;
        case 'changePct': av = a.quote.changePct; bv = b.quote.changePct; break;
        case 'pe': av = a.quote.pe; bv = b.quote.pe; break;
        case 'volume': av = a.quote.volume; bv = b.quote.volume; break;
        case 'dividendYield': av = a.quote.dividendYield; bv = b.quote.dividendYield; break;
        case 'recommendation':
          av = a.recScore ?? -1;
          bv = b.recScore ?? -1;
          break;
        default: av = 0; bv = 0;
      }
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
    return withRec;
  }, [filtered, sortKey, sortDir, recMap]);

  // Compute recommendations for top 500 filtered results
  const computeRecommendations = useCallback(() => {
    const top = sorted.slice(0, RECOMMEND_LIMIT);
    setRecLoading(true);
    // Defer to next tick to avoid blocking
    setTimeout(() => {
      const map = new Map<string, { action: string; score: number }>();
      for (const row of top) {
        const candles = getCandles(row.meta.symbol, '1Y');
        const tech = analyzeTechnicals(candles);
        const fund = getFundamentals(row.meta.symbol);
        const fundScore = scoreFundamentals(fund);
        const fc = forecast(candles, fund, tech);
        const rec = recommend(tech, fundScore.score, fc, fund);
        if (rec) {
          map.set(row.meta.symbol, { action: rec.action, score: rec.score });
        }
      }
      setRecMap(map);
      setRecLoading(false);
    }, 0);
  }, [sorted]);

  // Recompute recommendations when filters change (debounced via effect)
  useEffect(() => {
    computeRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, region, sector, minPrice, maxPE, minDivYield]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, region, sector, minPrice, maxPE, minDivYield, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setRegion('All');
    setSector('All');
    setMinPrice('');
    setMaxPE('');
    setMinDivYield('');
  };

  const activeFilterCount = [
    search, region !== 'All' ? region : '', sector !== 'All' ? sector : '',
    minPrice, maxPE, minDivYield,
  ].filter(Boolean).length;

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 opacity-20 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline text-brand-500" />
      : <ChevronDown className="w-3 h-3 inline text-brand-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink-900">Stock Screener</h2>
          <p className="text-sm text-ink-500">
            Screening {sorted.length.toLocaleString()} of {STOCK_UNIVERSE.length.toLocaleString()} stocks
            {recLoading && <span className="ml-2 text-brand-500">• Analyzing recommendations...</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost flex items-center gap-1.5 text-sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="chip text-xs px-1.5 py-0">{activeFilterCount}</span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button className="btn-ghost text-sm flex items-center gap-1" onClick={resetFilters}>
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-ink-400" />
            <input
              className="input flex-1"
              placeholder="Search by symbol or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Region</label>
              <select className="input text-sm" value={region} onChange={(e) => setRegion(e.target.value as Region | 'All')}>
                <option value="All">All Regions</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Sector</label>
              <select className="input text-sm" value={sector} onChange={(e) => setSector(e.target.value as Sector | 'All')}>
                <option value="All">All Sectors</option>
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Min Price</label>
              <input
                className="input text-sm"
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Max P/E</label>
              <input
                className="input text-sm"
                type="number"
                placeholder="100"
                value={maxPE}
                onChange={(e) => setMaxPE(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Min Div Yield %</label>
              <input
                className="input text-sm"
                type="number"
                placeholder="0"
                value={minDivYield}
                onChange={(e) => setMinDivYield(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button className="btn-outline text-sm w-full" onClick={resetFilters}>Reset All</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                <th className="text-left px-3 py-2.5 font-medium">Symbol</th>
                <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Name</th>
                <th className="text-right px-3 py-2.5 font-medium">Price</th>
                <th className="text-right px-3 py-2.5 font-medium cursor-pointer select-none hover:text-ink-900" onClick={() => toggleSort('changePct')}>
                  Chg% <SortIcon col="changePct" />
                </th>
                <th className="text-right px-3 py-2.5 font-medium cursor-pointer select-none hover:text-ink-900" onClick={() => toggleSort('marketCap')}>
                  Mkt Cap <SortIcon col="marketCap" />
                </th>
                <th className="text-right px-3 py-2.5 font-medium cursor-pointer select-none hover:text-ink-900 hidden lg:table-cell" onClick={() => toggleSort('pe')}>
                  P/E <SortIcon col="pe" />
                </th>
                <th className="text-right px-3 py-2.5 font-medium cursor-pointer select-none hover:text-ink-900 hidden lg:table-cell" onClick={() => toggleSort('dividendYield')}>
                  Div% <SortIcon col="dividendYield" />
                </th>
                <th className="text-right px-3 py-2.5 font-medium cursor-pointer select-none hover:text-ink-900 hidden xl:table-cell" onClick={() => toggleSort('volume')}>
                  Volume <SortIcon col="volume" />
                </th>
                <th className="text-center px-3 py-2.5 font-medium cursor-pointer select-none hover:text-ink-900" onClick={() => toggleSort('recommendation')}>
                  Rec <SortIcon col="recommendation" />
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-ink-400">
                    No stocks match your filters. Try adjusting your criteria.
                  </td>
                </tr>
              )}
              {pageRows.map((row) => {
                const up = row.quote.changePct >= 0;
                const recColor = row.recommendation ? (RECOMMEND_COLORS[row.recommendation] || 'text-ink-500 bg-ink-100') : '';
                return (
                  <tr
                    key={row.meta.symbol}
                    className="border-b border-ink-100 hover:bg-ink-50 cursor-pointer transition-colors"
                    onClick={() => onOpenStock(row.meta.symbol)}
                  >
                    <td className="px-3 py-2.5 font-semibold text-ink-900">{row.meta.symbol}</td>
                    <td className="px-3 py-2.5 text-ink-600 hidden md:table-cell max-w-[200px] truncate">{row.meta.name}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-900">
                      {formatPrice(row.quote.price, row.meta.currency)}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${up ? 'text-bull' : 'text-bear'}`}>
                      {up ? '+' : ''}{fmtPctRaw(row.quote.changePct)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-600">
                      {formatCompact(row.quote.marketCap, row.meta.currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-600 hidden lg:table-cell">
                      {row.quote.pe > 0 ? row.quote.pe.toFixed(1) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-600 hidden lg:table-cell">
                      {row.quote.dividendYield > 0 ? (row.quote.dividendYield * 100).toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-500 hidden xl:table-cell">
                      {fmtCompact(row.quote.volume)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.recommendation ? (
                        <span className={`chip text-xs font-medium ${recColor}`}>{row.recommendation}</span>
                      ) : (
                        <span className="text-xs text-ink-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-ink-500">
            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, sorted.length)} of {sorted.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="btn-outline text-sm flex items-center gap-1 disabled:opacity-40"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-sm text-ink-600 px-2">
              Page {currentPage + 1} of {totalPages.toLocaleString()}
            </span>
            <button
              className="btn-outline text-sm flex items-center gap-1 disabled:opacity-40"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
