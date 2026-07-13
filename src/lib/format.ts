import { useCurrency } from './currency';

export function fmtNum(n: number, digits = 2): string {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtCompact(n: number): string {
  if (!isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(0);
}

export function fmtPct(n: number, digits = 2): string {
  if (!isFinite(n)) return '—';
  return (n * 100).toFixed(digits) + '%';
}

export function fmtPctRaw(n: number, digits = 2): string {
  if (!isFinite(n)) return '—';
  return n.toFixed(digits) + '%';
}

// Legacy: format in native currency (used for non-converted displays)
export function fmtCurrency(n: number, currency = 'USD', digits = 2): string {
  if (!isFinite(n)) return '—';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
  } catch {
    return n.toFixed(digits);
  }
}

export function fmtPrice(n: number, currency = 'USD'): string {
  return fmtCurrency(n, currency, 2);
}

// Currency-aware price formatting via hook context
export function useFmtPrice() {
  const { formatPrice } = useCurrency();
  return (n: number, from = 'USD') => formatPrice(n, from);
}

export function useFmtCompact() {
  const { formatCompact } = useCurrency();
  return (n: number, from = 'USD') => formatCompact(n, from);
}

export function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

export function fmtTime(t: number): string {
  return new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
