import pg from "pg";
import { fileURLToPath } from "node:url";
let pool;
export function database() {
  if (!pool) {
    const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
    if (!url) throw Error("Order database not configured");
    const connection = new URL(url);
    if (
      connection.hostname.endsWith(".supabase.com") ||
      connection.hostname.endsWith(".supabase.co")
    ) {
      connection.searchParams.set("sslmode", "verify-full");
      connection.searchParams.set(
        "sslrootcert",
        fileURLToPath(new URL("./certs/supabase-ca.crt", import.meta.url)),
      );
    }
    pool = new pg.Pool({
      connectionString: connection.toString(),
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
    });
  }
  return pool;
}
export const schema = `CREATE TABLE IF NOT EXISTS tinfoil_orders (id uuid PRIMARY KEY, token_hash text NOT NULL, payload jsonb NOT NULL, provider text, provider_id text UNIQUE, paid boolean NOT NULL DEFAULT false, payment_id text UNIQUE, printful_id bigint, fulfillment_state text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, error_code text); CREATE TABLE IF NOT EXISTS tinfoil_events (provider text NOT NULL, event_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(provider,event_id));`;
export const rateSchema = `CREATE TABLE IF NOT EXISTS tinfoil_rate_limits(key text PRIMARY KEY,hits integer NOT NULL,created_at timestamptz NOT NULL DEFAULT now());`;
export const formsSchema = `CREATE TABLE IF NOT EXISTS tinfoil_submissions(id uuid PRIMARY KEY,form text NOT NULL,email text NOT NULL,name text,message text,created_at timestamptz NOT NULL DEFAULT now());`;
