import { useEffect, useState, useCallback } from 'react';
import { supabase, hasSupabase } from './supabase';

export interface WatchItem { id: string; symbol: string; added_at: string; }

export function useWatchlist() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!hasSupabase) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('watchlists')
      .select('id, symbol, added_at')
      .order('added_at', { ascending: false });
    if (!error && data) setItems(data as WatchItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (symbol: string) => {
    if (!hasSupabase) return;
    const { data } = await supabase.from('watchlists').insert({ symbol }).select('id, symbol, added_at').maybeSingle();
    if (data) setItems((prev) => [data as WatchItem, ...prev.filter((i) => i.symbol !== symbol)]);
  }, []);

  const remove = useCallback(async (symbol: string) => {
    if (!hasSupabase) return;
    await supabase.from('watchlists').delete().eq('symbol', symbol);
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
  }, []);

  const has = useCallback((symbol: string) => items.some((i) => i.symbol === symbol), [items]);

  return { items, loading, add, remove, has };
}

export interface Holding {
  id: string; symbol: string; quantity: number; avg_price: number;
  bought_at: string | null; notes: string | null; created_at: string;
}

export function usePortfolio() {
  const [items, setItems] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!hasSupabase) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('portfolio')
      .select('id, symbol, quantity, avg_price, bought_at, notes, created_at')
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data as Holding[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (h: Omit<Holding, 'id' | 'created_at'>) => {
    if (!hasSupabase) return;
    const { data } = await supabase.from('portfolio')
      .insert({ symbol: h.symbol, quantity: h.quantity, avg_price: h.avg_price, bought_at: h.bought_at, notes: h.notes })
      .select('id, symbol, quantity, avg_price, bought_at, notes, created_at').maybeSingle();
    if (data) setItems((prev) => [data as Holding, ...prev]);
  }, []);

  const update = useCallback(async (id: string, patch: Partial<Holding>) => {
    if (!hasSupabase) return;
    const { data } = await supabase.from('portfolio').update(patch).eq('id', id)
      .select('id, symbol, quantity, avg_price, bought_at, notes, created_at').maybeSingle();
    if (data) setItems((prev) => prev.map((i) => (i.id === id ? (data as Holding) : i)));
  }, []);

  const remove = useCallback(async (id: string) => {
    if (!hasSupabase) return;
    await supabase.from('portfolio').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, loading, add, update, remove };
}
