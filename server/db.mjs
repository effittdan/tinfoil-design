import pg from "pg";
let pool;
export function database() {
  if (!pool) {
    const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
    if (!url) throw Error("Order database not configured");
    pool = new pg.Pool({
      connectionString: url,
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
    });
  }
  return pool;
}
export const schema = `CREATE TABLE IF NOT EXISTS tinfoil_orders (id uuid PRIMARY KEY, token_hash text NOT NULL, payload jsonb NOT NULL, provider text, provider_id text UNIQUE, paid boolean NOT NULL DEFAULT false, payment_id text UNIQUE, printful_id bigint, fulfillment_state text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, error_code text); CREATE TABLE IF NOT EXISTS tinfoil_events (provider text NOT NULL, event_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(provider,event_id));`;
export const rateSchema = `CREATE TABLE IF NOT EXISTS tinfoil_rate_limits(key text PRIMARY KEY,hits integer NOT NULL,created_at timestamptz NOT NULL DEFAULT now());`;
