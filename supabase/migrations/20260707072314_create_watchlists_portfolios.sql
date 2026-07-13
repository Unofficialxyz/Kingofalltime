/*
# Create watchlists and portfolios (single-tenant, no auth)

1. Purpose
   Persist user watchlists and a simple holdings portfolio for the
   GlobalStock Analyser app. No sign-in screen, so data is intentionally
   shared/public across the anon-key client.

2. New Tables
   - watchlists: id, symbol, added_at  (one row per tracked stock)
   - portfolio:  id, symbol, quantity, avg_price, bought_at, notes
3. Security
   - RLS enabled on both tables.
   - anon + authenticated CRUD allowed (intentionally public, no auth).
*/

CREATE TABLE IF NOT EXISTS watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE (symbol)
);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_watchlists" ON watchlists;
CREATE POLICY "anon_select_watchlists" ON watchlists FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_watchlists" ON watchlists;
CREATE POLICY "anon_insert_watchlists" ON watchlists FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_watchlists" ON watchlists;
CREATE POLICY "anon_update_watchlists" ON watchlists FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_watchlists" ON watchlists;
CREATE POLICY "anon_delete_watchlists" ON watchlists FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  bought_at date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_portfolio" ON portfolio;
CREATE POLICY "anon_select_portfolio" ON portfolio FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_portfolio" ON portfolio;
CREATE POLICY "anon_insert_portfolio" ON portfolio FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_portfolio" ON portfolio;
CREATE POLICY "anon_update_portfolio" ON portfolio FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_portfolio" ON portfolio;
CREATE POLICY "anon_delete_portfolio" ON portfolio FOR DELETE
  TO anon, authenticated USING (true);
