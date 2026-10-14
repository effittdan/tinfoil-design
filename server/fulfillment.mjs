import { database } from "./db.mjs";
import { printful, stripe } from "./providers.mjs";
import { automaticFulfillment } from "./automatic-fulfillment.mjs";
// Hold a row lock so concurrent webhook retries cannot create competing drafts.
export async function fulfill(id) {
  const db = await database().connect();
  try {
    await db.query("BEGIN");
    const {
      rows: [order],
    } = await db.query("SELECT * FROM tinfoil_orders WHERE id=$1 FOR UPDATE", [
      id,
    ]);
    if (!order?.paid || order.printful_id) {
      await db.query("COMMIT");
      return;
    }
    const p = order.payload;
    if (p.taxCalculationId)
      await stripe().tax.transactions.createFromCalculation(
        { calculation: p.taxCalculationId, reference: id },
        { idempotencyKey: "tax-" + id },
      );
    const externalId = id.replaceAll("-", "");
    let existing;
    try {
      existing = await printful("/orders/@" + externalId);
    } catch (e) {
      if (e.httpStatus !== 404) throw e;
    }
    const result =
      existing ||
      (await printful("/orders", {
        external_id: externalId,
        recipient: p.address,
        shipping: p.shippingId,
        items: p.items.map((i) => ({
          sync_variant_id: i.syncVariantId,
          quantity: i.quantity,
          retail_price: (i.unitCents / 100).toFixed(2),
        })),
        retail_costs: {
          currency: "USD",
          subtotal: (p.subtotal / 100).toFixed(2),
          shipping: (p.shipping / 100).toFixed(2),
          tax: (p.tax / 100).toFixed(2),
          total: (p.total / 100).toFixed(2),
        },
      }));
    const outcome =
      process.env.PRINTFUL_AUTO_CONFIRM === "true"
        ? await automaticFulfillment(result, p.total, printful)
        : { state: result.status || "draft", error: null };
    await db.query(
      "UPDATE tinfoil_orders SET printful_id=$2,fulfillment_state=$3,error_code=$4 WHERE id=$1",
      [id, result.id, outcome.state, outcome.error],
    );
    await db.query("COMMIT");
    // Automatic confirmation is opt-in after the merchant's billing method is verified.
  } catch (e) {
    await db.query("ROLLBACK");
    await database().query(
      "UPDATE tinfoil_orders SET error_code='fulfillment_retry' WHERE id=$1",
      [id],
    );
    throw e;
  } finally {
    db.release();
  }
}
export async function markPaid(id, paymentId) {
  const { rows } = await database().query(
    "UPDATE tinfoil_orders SET paid=true,payment_id=COALESCE(payment_id,$2) WHERE id=$1 AND (payment_id IS NULL OR payment_id=$2) RETURNING id",
    [id, paymentId],
  );
  if (!rows.length) throw Error("Payment does not match an order");
  await fulfill(id);
}
