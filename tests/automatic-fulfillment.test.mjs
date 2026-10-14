import test from "node:test";
import assert from "node:assert/strict";
import { automaticFulfillment } from "../server/automatic-fulfillment.mjs";

const draft = {
  id: 123,
  status: "draft",
  costs: { currency: "USD", total: "22.25" },
};
test("confirms the existing draft once when fulfillment cost is covered", async () => {
  const calls = [];
  const result = await automaticFulfillment(draft, 2824, async (...args) => {
    calls.push(args);
    return { id: 123, status: "pending" };
  });
  assert.deepEqual(calls, [["/orders/123/confirm", {}]]);
  assert.deepEqual(result, { state: "pending", error: null });
});
test("recovered confirmed orders never incur a second confirmation", async () => {
  for (const status of [
    "pending",
    "inprocess",
    "onhold",
    "partial",
    "fulfilled",
  ]) {
    const result = await automaticFulfillment({ ...draft, status }, 2824, () =>
      assert.fail("repeat charge"),
    );
    assert.equal(result.state, status);
  }
});
test("invalid or excessive fulfillment costs and non-draft failures are held", async () => {
  for (const order of [
    { ...draft, costs: { currency: "USD", total: "28.25" } },
    { ...draft, costs: { currency: "EUR", total: "22.25" } },
    { ...draft, costs: null },
    { ...draft, status: "failed" },
    { ...draft, status: "canceled" },
  ]) {
    const result = await automaticFulfillment(order, 2824, () =>
      assert.fail("unexpected charge"),
    );
    assert.equal(result.state, "review");
  }
});
test("network and payment failures do not trigger automatic confirmation retries", async () => {
  let calls = 0;
  const result = await automaticFulfillment(draft, 2824, async () => {
    calls++;
    throw Error("ambiguous provider response");
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { state: "review", error: "confirmation_review" });
});
test("unexpected confirmation responses are held for review", async () => {
  const result = await automaticFulfillment(draft, 2824, async () => ({
    id: 123,
    status: "failed",
  }));
  assert.equal(result.state, "review");
});
