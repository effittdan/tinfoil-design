// Confirm only a verified paid order's existing draft, never create another order.
export async function automaticFulfillment(order, paidTotal, request) {
  const accepted = new Set([
    "pending",
    "inprocess",
    "onhold",
    "partial",
    "fulfilled",
  ]);
  if (accepted.has(order.status)) return { state: order.status, error: null };
  if (order.status !== "draft")
    return { state: "review", error: "printful_status_review" };
  const cost = Number(order.costs?.total);
  if (
    order.costs?.currency !== "USD" ||
    !Number.isFinite(cost) ||
    cost <= 0 ||
    !Number.isSafeInteger(paidTotal) ||
    Math.round(cost * 100) > paidTotal
  ) {
    return { state: "review", error: "fulfillment_cost_review" };
  }
  try {
    const confirmed = await request(`/orders/${order.id}/confirm`, {});
    if (confirmed.id !== order.id || !accepted.has(confirmed.status))
      return { state: "review", error: "confirmation_status_review" };
    return { state: confirmed.status, error: null };
  } catch {
    // An ambiguous response may already have charged the merchant. Hold for review.
    // Never automatically issue another confirmation after a billing/network error.
    return { state: "review", error: "confirmation_review" };
  }
}
