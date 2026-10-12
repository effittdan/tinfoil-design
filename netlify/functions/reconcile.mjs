import { database } from "../../server/db.mjs";
import { fulfill } from "../../server/fulfillment.mjs";
export default async function reconcile() {
  if (process.env.COMMERCE_ENABLED !== "true")
    return new Response("Checkout closed.");
  const { rows } = await database().query(
    "SELECT id FROM tinfoil_orders WHERE paid=true AND printful_id IS NULL ORDER BY created_at LIMIT 1",
  );
  for (const order of rows) {
    try {
      await fulfill(order.id);
    } catch {
      console.error("Order draft retry failed.");
    }
  }
  await database().query(
    "DELETE FROM tinfoil_rate_limits WHERE created_at<now()-interval '2 days'",
  );
  return new Response("Reconciliation completed.");
}
export const config = { schedule: "*/10 * * * *" };
