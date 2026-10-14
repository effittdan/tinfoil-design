import { database } from "../server/db.mjs";
import { stripe } from "../server/providers.mjs";
import { automaticFulfillment } from "../server/automatic-fulfillment.mjs";

if (typeof automaticFulfillment !== "function") throw Error("Fulfillment module missing");
console.log(`Printful automatic fulfillment: ${process.env.PRINTFUL_AUTO_CONFIRM === "true" ? "ENABLED" : "disabled"}. Confirmation requires a paid order.`);

// Read-only deployment checks. Never log credentials, connection URLs or records.
if (process.env.DATABASE_URL || process.env.NETLIFY_DB_URL) {
  try {
    await database().query("SELECT id FROM tinfoil_orders LIMIT 0");
    await database().query("SELECT event_id FROM tinfoil_events LIMIT 0");
    await database().query("SELECT key FROM tinfoil_rate_limits LIMIT 0");
    console.log(
      "Commerce database verified: connection and required tables ready.",
    );
  } catch (e) {
    const code = /^[A-Z0-9_]+$/.test(e.code || "")
      ? e.code
      : "connection_failed";
    console.error(`Commerce database verification failed: ${code}.`);
    process.exitCode = 1;
  } finally {
    await database().end();
  }
} else console.log("Commerce database verification skipped: not configured.");

if (process.env.STRIPE_SECRET_KEY) {
  try {
    await stripe().checkout.sessions.list({ limit: 1 });
    console.log(
      "Stripe verified: Checkout Sessions authentication succeeded. No payment created.",
    );
    if (!process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) {
      console.error("Stripe webhook signing secret is missing or invalid.");
      process.exitCode = 1;
    }
  } catch (e) {
    const status = Number.isInteger(e.statusCode)
      ? e.statusCode
      : "request_failed";
    console.error(`Stripe verification failed: ${status}.`);
    process.exitCode = 1;
  }
} else console.log("Stripe verification skipped: not configured.");
