export class PublicError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export function cents(value) {
  const n = Number(value);
  if (
    !Number.isFinite(n) ||
    n <= 0 ||
    Math.abs(n * 100 - Math.round(n * 100)) > 1e-6
  )
    throw new PublicError("Invalid catalog price.");
  return Math.round(n * 100);
}
export function selectLines(cart, catalog) {
  if (!Array.isArray(cart) || !cart.length || cart.length > 30)
    throw new PublicError("Your evidence bag is empty or too large.");
  const seen = new Set();
  let count = 0;
  return cart.map((l) => {
    if (
      typeof l.id !== "string" ||
      typeof l.color !== "string" ||
      typeof l.size !== "string" ||
      !Number.isInteger(l.qty) ||
      l.qty < 1 ||
      l.qty > 10
    )
      throw new PublicError("Invalid product selection.");
    const key = l.id + "|" + l.color + "|" + l.size;
    if (seen.has(key)) throw new PublicError("Duplicate product selection.");
    seen.add(key);
    count += l.qty;
    if (count > 50) throw new PublicError("This order exceeds the item limit.");
    const p = catalog.find((p) => p.id === l.id),
      v = p?.variants.find((v) => v.color === l.color && v.size === l.size);
    if (
      !v?.available ||
      v.currency !== "USD" ||
      !Number.isSafeInteger(v.syncVariantId) ||
      !Number.isSafeInteger(v.catalogVariantId)
    )
      throw new PublicError("A selected size or color is not available.");
    return {
      id: p.id,
      name: p.name,
      color: v.color,
      size: v.size,
      quantity: l.qty,
      unitCents: cents(v.price),
      syncVariantId: v.syncVariantId,
      catalogVariantId: v.catalogVariantId,
    };
  });
}
export function validateAddress(a, countries = ["US"]) {
  if (!a || typeof a !== "object")
    throw new PublicError("Delivery address required.");
  const out = {};
  for (const key of [
    "name",
    "email",
    "address1",
    "address2",
    "city",
    "state_code",
    "zip",
    "country_code",
  ]) {
    const v = a[key] ?? "";
    if (typeof v !== "string" || v.length > 200)
      throw new PublicError("Invalid delivery address.");
    out[key] = v.trim();
  }
  if (
    !out.name ||
    !out.address1 ||
    !out.city ||
    !out.zip ||
    !out.state_code ||
    !countries.includes(out.country_code) ||
    !/^\S+@\S+\.\S+$/.test(out.email)
  )
    throw new PublicError("Check your delivery address and email.");
  if (
    out.country_code === "US" &&
    !/^[A-Z]{2}$/.test(out.state_code.toUpperCase())
  )
    throw new PublicError("Use a two-letter state code.");
  out.state_code = out.state_code.toUpperCase();
  return out;
}
export function verifyPayPalCapture(result, order) {
  const unit = result.purchase_units?.[0],
    capture = unit?.payments?.captures?.[0];
  if (
    result.id !== order.provider_id ||
    result.status !== "COMPLETED" ||
    result.purchase_units?.length !== 1 ||
    unit.reference_id !== order.id ||
    unit.payments?.captures?.length !== 1 ||
    capture?.status !== "COMPLETED" ||
    capture.amount.currency_code !== "USD" ||
    capture.amount.value !== (order.payload.total / 100).toFixed(2)
  )
    throw new PublicError("Payment verification failed.", 409);
  return capture.id;
}
