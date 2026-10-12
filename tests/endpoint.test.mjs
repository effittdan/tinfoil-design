import test from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/commerce.mjs";
test("unconfigured checkout reports closed and never exposes credentials", async () => {
  const r = await handler(
    new Request("https://tinfoilhat.netlify.app/api/config"),
  );
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.enabled, false);
  assert.equal("STRIPE_SECRET_KEY" in d, false);
});
test("checkout rejects cross-site origin before reading order data", async () => {
  const r = await handler(
    new Request("https://tinfoilhat.netlify.app/api/checkout", {
      method: "POST",
      headers: {
        Origin: "https://wrong.example",
        "Content-Type": "application/json",
      },
      body: "{}",
    }),
  );
  assert.equal(r.status, 403);
});
test("checkout fails closed without accounts", async () => {
  const r = await handler(
    new Request("https://tinfoilhat.netlify.app/api/checkout", {
      method: "POST",
      headers: {
        Origin: "https://tinfoilhat.netlify.app",
        "Content-Type": "application/json",
      },
      body: "{}",
    }),
  );
  assert.equal(r.status, 503);
});
