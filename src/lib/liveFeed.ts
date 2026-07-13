import { useEffect, useState } from 'react';
import { getQuote } from './dataService';
import { STOCK_UNIVERSE } from './universe';
import type { Quote } from './types';

// In-memory live price overlay. Starts from the deterministic base quote and
// applies a small random walk each tick so prices move every second without
// needing a refresh. Components subscribe via useLiveQuotes / useLiveQuote.

interface LiveState {
  price: number;
  prevClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  lastTick: number;
}

const liveMap = new Map<string, LiveState>();
const listeners = new Set<() => void>();
let intervalId: number | null = null;
let tickCount = 0;

function initSymbol(symbol: string): LiveState {
  const q = getQuote(symbol);
  if (!q) return { price: 0, prevClose: 0, open: 0, dayHigh: 0, dayLow: 0, volume: 0, lastTick: 0 };
  return {
    price: q.price,
    prevClose: q.prevClose,
    open: q.open,
    dayHigh: q.dayHigh,
    dayLow: q.dayLow,
    volume: q.volume,
    lastTick: Date.now(),
  };
}

function ensureInit() {
  if (liveMap.size > 0) return;
  for (const s of STOCK_UNIVERSE) {
    liveMap.set(s.symbol, initSymbol(s.symbol));
  }
}

function tick() {
  ensureInit();
  tickCount++;
  for (const [, st] of liveMap) {
    if (!st.price) continue;
    // Small random walk: ±0.05% to ±0.25% per tick, with slight mean reversion
    // toward the session open so prices don't drift to zero or infinity.
    const vol = 0.0005 + Math.random() * 0.002;
    const reversion = (st.open - st.price) / st.open * 0.02;
    const ret = reversion + (Math.random() - 0.5) * 2 * vol;
    const newPrice = Math.max(0.01, +(st.price * (1 + ret)).toFixed(2));
    st.price = newPrice;
    st.dayHigh = Math.max(st.dayHigh, newPrice);
    st.dayLow = st.dayLow ? Math.min(st.dayLow, newPrice) : newPrice;
    st.volume += Math.floor(Math.random() * 5000);
    st.lastTick = Date.now();
  }
  for (const fn of listeners) fn();
}

export function startLiveFeed() {
  if (intervalId !== null) return;
  ensureInit();
  intervalId = window.setInterval(tick, 1000);
}

export function stopLiveFeed() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function getLiveQuote(symbol: string): Quote | null {
  ensureInit();
  const base = getQuote(symbol);
  if (!base) return null;
  const st = liveMap.get(symbol);
  if (!st || !st.price) return base;
  const change = +(st.price - st.prevClose).toFixed(2);
  const changePct = +((change / st.prevClose) * 100).toFixed(2);
  return {
    ...base,
    price: st.price,
    change,
    changePct,
    open: st.open,
    dayHigh: st.dayHigh,
    dayLow: st.dayLow,
    volume: st.volume,
    asOf: new Date(st.lastTick).toISOString(),
  };
}

export function isLive() {
  return intervalId !== null;
}

export function getTickCount() {
  return tickCount;
}

// --- React hooks ---

// Force a re-render every tick. Lightweight: components that read live quotes
// call this and then read getLiveQuote directly.
export function useLiveTick() {
  const [, setN] = useState(0);
  useEffect(() => {
    const fn = () => setN((n) => n + 1);
    listeners.add(fn);
    startLiveFeed();
    return () => { listeners.delete(fn); };
  }, []);
  return { live: isLive(), ticks: getTickCount() };
}

// Subscribe to a single symbol's live quote.
export function useLiveQuote(symbol: string | null): Quote | null {
  const [, setN] = useState(0);
  useEffect(() => {
    const fn = () => setN((n) => n + 1);
    listeners.add(fn);
    startLiveFeed();
    return () => { listeners.delete(fn); };
  }, []);
  return symbol ? getLiveQuote(symbol) : null;
}

// Subscribe to all live quotes (for dashboard / screener).
export function useLiveQuotes(): { live: boolean; ticks: number } {
  const [, setN] = useState(0);
  useEffect(() => {
    const fn = () => setN((n) => n + 1);
    listeners.add(fn);
    startLiveFeed();
    return () => { listeners.delete(fn); };
  }, []);
  return { live: isLive(), ticks: getTickCount() };
}
