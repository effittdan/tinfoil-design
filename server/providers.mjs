import Stripe from "stripe";
import { PublicError } from "./validation.mjs";
export const stripe = () =>
  new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
    timeout: 15000,
  });
export async function printful(path, body) {
  if (!process.env.PRINTFUL_API_TOKEN || !process.env.PRINTFUL_STORE_ID)
    throw new PublicError("The archive is not connected for orders yet.", 503);
  const r = await fetch("https://api.printful.com" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + process.env.PRINTFUL_API_TOKEN,
      "X-PF-Store-Id": process.env.PRINTFUL_STORE_ID,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) {
    const e = new Error("Printful request failed");
    e.httpStatus = r.status;
    throw e;
  }
  return (await r.json()).result;
}
let token,
  tokenUntil = 0;
export async function paypal(path, body, requestId) {
  const live = process.env.PAYPAL_ENVIRONMENT === "live";
  if (!["live", "sandbox"].includes(process.env.PAYPAL_ENVIRONMENT || ""))
    throw new PublicError("Payment configuration is incomplete.", 503);
  const base = live
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
  if (!token || Date.now() > tokenUntil) {
    const r = await fetch(base + "/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.PAYPAL_CLIENT_ID +
              ":" +
              process.env.PAYPAL_CLIENT_SECRET,
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw Error("PayPal authentication failed");
    const d = await r.json();
    token = d.access_token;
    tokenUntil = Date.now() + (d.expires_in - 60) * 1000;
  }
  const r = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw Error("PayPal request failed");
  return r.json();
}
