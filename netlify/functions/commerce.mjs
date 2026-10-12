import {
  randomUUID,
  randomBytes,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { database } from "../../server/db.mjs";
import { loadCatalog, hasMappings } from "../../server/catalog.mjs";
import { stripe, paypal, printful } from "../../server/providers.mjs";
import {
  PublicError,
  selectLines,
  validateAddress,
  verifyPayPalCapture,
} from "../../server/validation.mjs";
import { markPaid, fulfill } from "../../server/fulfillment.mjs";
import { limitQuotes } from "../../server/rate-limit.mjs";
const hash = (s) => createHash("sha256").update(String(s)).digest("hex");
const configured = () =>
  process.env.COMMERCE_ENABLED === "true" &&
  hasMappings() &&
  !!(process.env.DATABASE_URL || process.env.NETLIFY_DB_URL) &&
  !!process.env.PRINTFUL_API_TOKEN &&
  !!process.env.PRINTFUL_STORE_ID &&
  !!process.env.STRIPE_SECRET_KEY;
const json = (d, status = 200) =>
  new Response(JSON.stringify(d), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
const countries = () =>
  (process.env.ALLOWED_COUNTRIES || "US").split(",").map((x) => x.trim());
async function stored(id, token) {
  if (!/^[a-f0-9-]{36}$/.test(id || "") || typeof token !== "string")
    throw new PublicError("Order not found.", 404);
  const {
    rows: [o],
  } = await database().query("SELECT * FROM tinfoil_orders WHERE id=$1", [id]);
  if (
    !o ||
    !timingSafeEqual(Buffer.from(o.token_hash), Buffer.from(hash(token)))
  )
    throw new PublicError("Order not found.", 404);
  return o;
}
async function capturePayPal(o) {
  const result = await paypal(
    "/v2/checkout/orders/" + o.provider_id + "/capture",
    {},
    "cap-" + o.id.slice(0, 32),
  );
  const paymentId = verifyPayPalCapture(result, o);
  await markPaid(o.id, paymentId);
  return result;
}
async function webhookStripe(req) {
  const body = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(
      body,
      req.headers.get("stripe-signature"),
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    throw new PublicError("Invalid webhook signature.", 400);
  }
  if (
    [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ].includes(event.type)
  ) {
    const s = event.data.object;
    if (
      s.payment_status === "paid" &&
      s.metadata?.storefront === "tinfoil-hat"
    ) {
      const {
        rows: [o],
      } = await database().query("SELECT * FROM tinfoil_orders WHERE id=$1", [
        s.metadata.orderId,
      ]);
      if (
        !o ||
        o.provider !== "stripe" ||
        o.provider_id !== s.id ||
        s.currency !== "usd" ||
        s.amount_total !== o.payload.total
      )
        throw new PublicError("Payment does not match the order.", 409);
      await markPaid(o.id, s.payment_intent);
    }
  }
  await database().query(
    "INSERT INTO tinfoil_events(provider,event_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
    ["stripe", event.id],
  );
  return json({ received: true });
}
async function webhookPayPal(req) {
  const e = await req.json();
  const v = await paypal("/v1/notifications/verify-webhook-signature", {
    auth_algo: req.headers.get("paypal-auth-algo"),
    cert_url: req.headers.get("paypal-cert-url"),
    transmission_id: req.headers.get("paypal-transmission-id"),
    transmission_sig: req.headers.get("paypal-transmission-sig"),
    transmission_time: req.headers.get("paypal-transmission-time"),
    webhook_id: process.env.PAYPAL_WEBHOOK_ID,
    webhook_event: e,
  });
  if (v.verification_status !== "SUCCESS")
    throw new PublicError("Invalid webhook signature.", 400);
  const pid =
    e.event_type === "CHECKOUT.ORDER.APPROVED"
      ? e.resource.id
      : e.resource.supplementary_data?.related_ids?.order_id;
  if (pid) {
    const {
      rows: [o],
    } = await database().query(
      "SELECT * FROM tinfoil_orders WHERE provider=$1 AND provider_id=$2",
      ["paypal", pid],
    );
    if (o) {
      if (e.event_type === "CHECKOUT.ORDER.APPROVED" && !o.paid)
        await capturePayPal(o);
      if (e.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const actual = await paypal("/v2/checkout/orders/" + pid);
        const paymentId = verifyPayPalCapture(actual, o);
        await markPaid(o.id, paymentId);
      }
    }
  }
  await database().query(
    "INSERT INTO tinfoil_events(provider,event_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
    ["paypal", e.id],
  );
  return json({ received: true });
}
export default async function handler(req, context = {}) {
  try {
    const path = new URL(req.url).pathname.split("/").at(-1);
    if (req.method === "GET" && path === "config")
      return json({
        enabled: configured(),
        stripe: configured() && !!process.env.STRIPE_WEBHOOK_SECRET,
        paypal:
          configured() &&
          !!process.env.PAYPAL_CLIENT_ID &&
          !!process.env.PAYPAL_CLIENT_SECRET &&
          !!process.env.PAYPAL_WEBHOOK_ID,
        countries: countries(),
      });
    if (req.method === "GET" && path === "catalog") {
      if (!hasMappings() || !process.env.PRINTFUL_API_TOKEN)
        return json({ live: false, products: [] });
      const products = await loadCatalog();
      return json({
        live: true,
        products: products.map((p) => ({ id: p.id, variants: p.variants })),
      });
    }
    if (req.method !== "POST")
      throw new PublicError("Method not allowed.", 405);
    if (Number(req.headers.get("content-length") || 0) > 65536)
      throw new PublicError("Request too large.", 413);
    if (path === "stripe-webhook") return await webhookStripe(req);
    if (path === "paypal-webhook") return await webhookPayPal(req);
    const origin = new URL(
      process.env.SITE_URL || "https://tinfoilhat.netlify.app",
    ).origin;
    if (req.headers.get("origin") !== origin)
      throw new PublicError("Invalid request origin.", 403);
    if (!configured()) throw new PublicError("Checkout is not open yet.", 503);
    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > 65536)
      throw new PublicError("Request too large.", 413);
    let b;
    try {
      b = JSON.parse(rawBody);
    } catch {
      throw new PublicError("Invalid JSON request.");
    }
    if (!b || typeof b !== "object" || Array.isArray(b))
      throw new PublicError("Invalid JSON request.");
    if (path === "quote") {
      await limitQuotes(context.ip || "shared");
      const address = validateAddress(b.address, countries()),
        items = selectLines(b.cart, await loadCatalog());
      const subtotal = items.reduce((s, i) => s + i.unitCents * i.quantity, 0);
      if (subtotal > 500000)
        throw new PublicError("Order total exceeds the limit.");
      const rates = await printful("/shipping/rates", {
        recipient: address,
        items: items.map((i) => ({
          variant_id: i.catalogVariantId,
          quantity: i.quantity,
        })),
        currency: "USD",
      });
      const rate = rates
        .filter((r) => r.currency === "USD" && Number.isFinite(Number(r.rate)))
        .sort((a, b) => Number(a.rate) - Number(b.rate))[0];
      if (!rate)
        throw new PublicError(
          "No delivery route is available for this address.",
        );
      const shipping = Math.round(Number(rate.rate) * 100);
      const taxCalc = await stripe().tax.calculations.create({
        currency: "usd",
        customer_details: {
          address: {
            line1: address.address1,
            line2: address.address2,
            city: address.city,
            state: address.state_code,
            postal_code: address.zip,
            country: address.country_code,
          },
          address_source: "shipping",
        },
        line_items: items.map((i, n) => ({
          amount: i.unitCents * i.quantity,
          reference: String(n),
          tax_code: process.env.STRIPE_PRODUCT_TAX_CODE || "txcd_30011000",
          tax_behavior: "exclusive",
        })),
        shipping_cost: { amount: shipping, tax_behavior: "exclusive" },
      });
      const tax = taxCalc.tax_amount_exclusive,
        total = subtotal + shipping + tax;
      if (taxCalc.amount_total !== total) throw Error("Tax total mismatch");
      const id = randomUUID(),
        token = randomBytes(32).toString("hex");
      const payload = {
        address,
        items,
        subtotal,
        shipping,
        tax,
        total,
        shippingId: rate.id,
        taxCalculationId: taxCalc.id,
      };
      await database().query(
        "INSERT INTO tinfoil_orders(id,token_hash,payload,expires_at) VALUES($1,$2,$3,now()+interval '20 minutes')",
        [id, hash(token), payload],
      );
      return json({ id, token, subtotal, shipping, tax, total });
    }
    if (path === "order") {
      const o = await stored(b.id, b.token);
      return json({
        paid: o.paid,
        reference: o.id.slice(0, 8).toUpperCase(),
        fulfillment: o.fulfillment_state,
      });
    }
    if (path === "paypal-capture") {
      const o = await stored(b.id, b.token);
      if (o.provider !== "paypal" || o.provider_id !== b.paypalOrderId)
        throw new PublicError("Order not found.", 404);
      if (o.paid) {
        await fulfill(o.id);
        return json({ paid: true });
      }
      await capturePayPal(o);
      return json({ paid: true });
    }
    if (path === "checkout") {
      if (!["stripe", "paypal"].includes(b.provider))
        throw new PublicError("Unknown payment method.");
      const o = await stored(b.quoteId, b.token);
      if (o.paid || new Date(o.expires_at) < new Date())
        throw new PublicError(
          "Your dispatch quote has expired. Calculate it again.",
          409,
        );
      if (o.provider && o.provider !== b.provider)
        throw new PublicError(
          "A payment is already in progress. Recalculate your quote to switch providers.",
          409,
        );
      const fresh = selectLines(
        o.payload.items.map((i) => ({
          id: i.id,
          color: i.color,
          size: i.size,
          qty: i.quantity,
        })),
        await loadCatalog(),
      );
      if (
        fresh.some(
          (i, n) =>
            i.unitCents !== o.payload.items[n].unitCents ||
            i.syncVariantId !== o.payload.items[n].syncVariantId,
        )
      )
        throw new PublicError(
          "Catalog changed. Please calculate your quote again.",
          409,
        );
      const db = await database().connect();
      try {
        await db.query("BEGIN");
        const {
          rows: [locked],
        } = await db.query(
          "SELECT * FROM tinfoil_orders WHERE id=$1 FOR UPDATE",
          [o.id],
        );
        if (locked.provider && locked.provider !== b.provider)
          throw new PublicError("Payment method already selected.", 409);
        let url,
          pid = locked.provider_id;
        const p = o.payload;
        if (b.provider === "stripe") {
          if (!process.env.STRIPE_WEBHOOK_SECRET)
            throw new PublicError("Card checkout is not available.", 503);
          const session = pid
            ? await stripe().checkout.sessions.retrieve(pid)
            : await stripe().checkout.sessions.create(
                {
                  mode: "payment",
                  payment_method_types: ["card"],
                  customer_email: p.address.email,
                  metadata: { orderId: o.id, storefront: "tinfoil-hat" },
                  success_url:
                    origin + "/order?session_id={CHECKOUT_SESSION_ID}",
                  cancel_url: origin + "/checkout",
                  line_items: [
                    ...p.items.map((i) => ({
                      quantity: i.quantity,
                      price_data: {
                        currency: "usd",
                        unit_amount: i.unitCents,
                        product_data: {
                          name: i.name + " / " + i.color + " / " + i.size,
                        },
                      },
                    })),
                    ...[
                      [p.shipping, "Shipping"],
                      [p.tax, "Sales tax"],
                    ]
                      .filter(([amount]) => amount > 0)
                      .map(([amount, name]) => ({
                        quantity: 1,
                        price_data: {
                          currency: "usd",
                          unit_amount: amount,
                          product_data: { name },
                        },
                      })),
                  ],
                },
                { idempotencyKey: o.id },
              );
          url = session.url;
          pid = session.id;
        } else {
          if (!process.env.PAYPAL_WEBHOOK_ID)
            throw new PublicError("PayPal checkout is not available.", 503);
          const result = pid
            ? await paypal("/v2/checkout/orders/" + pid)
            : await paypal(
                "/v2/checkout/orders",
                {
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      reference_id: o.id,
                      custom_id: o.id,
                      description: "Tinfoil Hat apparel",
                      amount: {
                        currency_code: "USD",
                        value: (p.total / 100).toFixed(2),
                        breakdown: {
                          item_total: {
                            currency_code: "USD",
                            value: (p.subtotal / 100).toFixed(2),
                          },
                          shipping: {
                            currency_code: "USD",
                            value: (p.shipping / 100).toFixed(2),
                          },
                          tax_total: {
                            currency_code: "USD",
                            value: (p.tax / 100).toFixed(2),
                          },
                        },
                      },
                      items: p.items.map((i) => ({
                        name: i.name + " / " + i.color + " / " + i.size,
                        quantity: String(i.quantity),
                        unit_amount: {
                          currency_code: "USD",
                          value: (i.unitCents / 100).toFixed(2),
                        },
                      })),
                      shipping: {
                        name: { full_name: p.address.name },
                        address: {
                          address_line_1: p.address.address1,
                          address_line_2: p.address.address2,
                          admin_area_2: p.address.city,
                          admin_area_1: p.address.state_code,
                          postal_code: p.address.zip,
                          country_code: p.address.country_code,
                        },
                      },
                    },
                  ],
                  payment_source: {
                    paypal: {
                      experience_context: {
                        brand_name: "Tinfoil Hat",
                        shipping_preference: "SET_PROVIDED_ADDRESS",
                        user_action: "PAY_NOW",
                        return_url: origin + "/order",
                        cancel_url: origin + "/checkout",
                      },
                    },
                  },
                },
                o.id,
              );
          url = result.links.find((l) =>
            ["payer-action", "approve"].includes(l.rel),
          )?.href;
          pid = result.id;
        }
        if (!url) throw Error("Provider did not return a checkout URL");
        await db.query(
          "UPDATE tinfoil_orders SET provider=$2,provider_id=$3 WHERE id=$1",
          [o.id, b.provider, pid],
        );
        await db.query("COMMIT");
        return json({ url });
      } catch (e) {
        await db.query("ROLLBACK");
        throw e;
      } finally {
        db.release();
      }
    }
    throw new PublicError("Endpoint not found.", 404);
  } catch (e) {
    if (e instanceof PublicError) return json({ error: e.message }, e.status);
    console.error("Commerce request failed:", e.name);
    return json(
      {
        error:
          "Transmission interrupted. Your payment has not been confirmed here. Please try again.",
      },
      503,
    );
  }
}
export const config = { path: "/api/*" };
