import { useState, useEffect, useCallback } from "react";
import { getLiveQuote, startLiveUpdates } from "./dataService";
import type { Quote } from "./types";

export function useLiveQuote(symbol: string | null) {
  const [quote, setQuote] = useState<Quote | null>(null);
  useEffect(() => {
    if (!symbol) { setQuote(null); return; }
    startLiveUpdates();
    const update = () => setQuote({ ...getLiveQuote(symbol) });
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, [symbol]);
  return quote;
}

export function useLiveQuotes(symbols: string[] = []) {
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const key = symbols.join(",");
  useEffect(() => {
    startLiveUpdates();
    if (symbols.length === 0) return;
    const update = () => {
      const m = new Map<string, Quote>();
      for (const s of symbols) m.set(s, { ...getLiveQuote(s) });
      setQuotes(m);
    };
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, [key]);
  return { quotes, live: true };
}

const WATCH_KEY = "gsa_watchlist";
const PORTFOLIO_KEY = "gsa_portfolio";

export function useWatchlist() {
  const [items, setItems] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(WATCH_KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem(WATCH_KEY, JSON.stringify(items)); }, [items]);
  const add = useCallback((s: string) => setItems((p) => p.includes(s) ? p : [...p, s]), []);
  const remove = useCallback((s: string) => setItems((p) => p.filter((x) => x !== s)), []);
  const has = useCallback((s: string) => items.includes(s), [items]);
  return { items, add, remove, has, loading: false };
}

export interface Holding { symbol: string; qty: number; avgPrice: number }

export function usePortfolio() {
  const [items, setItems] = useState<Holding[]>(() => {
    try { return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(items)); }, [items]);
  const add = useCallback((h: Holding) => setItems((p) => {
    const existing = p.find((x) => x.symbol === h.symbol);
    if (existing) {
      const totalQty = existing.qty + h.qty;
      const totalCost = existing.qty * existing.avgPrice + h.qty * h.avgPrice;
      return p.map((x) => x.symbol === h.symbol ? { ...x, qty: totalQty, avgPrice: totalCost / totalQty } : x);
    }
    return [...p, h];
  }), []);
  const remove = useCallback((s: string) => setItems((p) => p.filter((x) => x.symbol !== s)), []);
  return { items, add, remove, loading: false };
}
