import { useState, useEffect, useCallback } from 'react';
import { getLiveQuote } from './dataService';
import { STOCK_UNIVERSE } from './universe';
import type { Quote } from './types';

export function useLiveQuotes() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);
  return { live: true };
}

export function useLiveQuote(symbol: string) {
  const [quote, setQuote] = useState<Quote | null>(() => getLiveQuote(symbol));
  useEffect(() => {
    const id = setInterval(() => setQuote(getLiveQuote(symbol)), 5000);
    return () => clearInterval(id);
  }, [symbol]);
  return quote;
}

export function useWatchlist() {
  const [items, setItems] = useState<string[]>([]);
  const [loading] = useState(false);
  const add = useCallback((s: string) => setItems((prev) => prev.includes(s) ? prev : [...prev, s]), []);
  const remove = useCallback((s: string) => setItems((prev) => prev.filter((x) => x !== s)), []);
  const has = useCallback((s: string) => items.includes(s), [items]);
  return { items, add, remove, has, loading };
}

export interface Holding { symbol: string; qty: number; avgPrice: number; }

export function usePortfolio() {
  const [items, setItems] = useState<Holding[]>([]);
  const [loading] = useState(false);
  const add = useCallback((h: Holding) => setItems((prev) => {
    const ex = prev.find((p) => p.symbol === h.symbol);
    if (ex) return prev.map((p) => p.symbol === h.symbol ? { ...p, qty: p.qty + h.qty, avgPrice: (p.avgPrice * p.qty + h.avgPrice * h.qty) / (p.qty + h.qty) } : p);
    return [...prev, h];
  }), []);
  const remove = useCallback((s: string) => setItems((prev) => prev.filter((p) => p.symbol !== s)), []);
  return { items, add, remove, loading };
}
