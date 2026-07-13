import { useState, useEffect, useCallback } from "react";
import { getLiveQuote, getMeta } from "./dataService";
import { STOCK_UNIVERSE } from "./universe";
import type { Quote } from "./types";

const REFRESH_MS = 5000;

// ─── useLiveQuotes ─────────────────────────────────────────────────────────────
// Returns { live: true } and ticks every 5s so consumers can re-render live data.
export function useLiveQuotes(): { live: true; tick: number } {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);
  return { live: true, tick };
}

// ─── useLiveQuote ───────────────────────────────────────────────────────────────
// Returns a single live Quote that refreshes every 5s, or null if symbol invalid.
export function useLiveQuote(symbol: string): Quote | null {
  const [quote, setQuote] = useState<Quote | null>(() => {
    if (!getMeta(symbol)) return null;
    return getLiveQuote(symbol);
  });
  useEffect(() => {
    if (!getMeta(symbol)) {
      setQuote(null);
      return;
    }
    setQuote(getLiveQuote(symbol));
    const id = setInterval(() => {
      setQuote(getLiveQuote(symbol));
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [symbol]);
  return quote;
}

// ─── Holding ────────────────────────────────────────────────────────────────────
export interface Holding {
  symbol: string;
  qty: number;
  avgPrice: number;
}

// ─── useWatchlist ───────────────────────────────────────────────────────────────
// In-memory watchlist (not persisted).
export function useWatchlist(): {
  items: string[];
  add: (symbol: string) => void;
  remove: (symbol: string) => void;
  has: (symbol: string) => boolean;
  loading: boolean;
} {
  const [items, setItems] = useState<string[]>([]);
  const [loading] = useState(false);

  const add = useCallback((symbol: string) => {
    setItems((prev) => {
      if (prev.includes(symbol)) return prev;
      if (!STOCK_UNIVERSE.find((s) => s.symbol === symbol)) return prev;
      return [...prev, symbol];
    });
  }, []);

  const remove = useCallback((symbol: string) => {
    setItems((prev) => prev.filter((s) => s !== symbol));
  }, []);

  const has = useCallback(
    (symbol: string) => items.includes(symbol),
    [items]
  );

  return { items, add, remove, has, loading };
}

// ─── usePortfolio ───────────────────────────────────────────────────────────────
// In-memory portfolio (not persisted).
export function usePortfolio(): {
  items: Holding[];
  add: (holding: Holding) => void;
  remove: (symbol: string) => void;
  loading: boolean;
} {
  const [items, setItems] = useState<Holding[]>([]);
  const [loading] = useState(false);

  const add = useCallback((holding: Holding) => {
    setItems((prev) => {
      const existing = prev.find((h) => h.symbol === holding.symbol);
      if (existing) {
        // Weighted average price
        const totalQty = existing.qty + holding.qty;
        const avgPrice =
          totalQty === 0
            ? 0
            : (existing.qty * existing.avgPrice + holding.qty * holding.avgPrice) / totalQty;
        return prev.map((h) =>
          h.symbol === holding.symbol
            ? { symbol: holding.symbol, qty: totalQty, avgPrice: Math.round(avgPrice * 100) / 100 }
            : h
        );
      }
      return [...prev, { ...holding, avgPrice: Math.round(holding.avgPrice * 100) / 100 }];
    });
  }, []);

  const remove = useCallback((symbol: string) => {
    setItems((prev) => prev.filter((h) => h.symbol !== symbol));
  }, []);

  return { items, add, remove, loading };
}
