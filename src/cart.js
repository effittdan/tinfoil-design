export function readCart(storage = localStorage) {
  try {
    const c = JSON.parse(storage.getItem("tinfoil-cart-v2") || "[]");
    return Array.isArray(c)
      ? c
          .filter(
            (x) =>
              typeof x.id === "string" &&
              typeof x.color === "string" &&
              typeof x.size === "string" &&
              Number.isInteger(x.qty) &&
              x.qty > 0 &&
              x.qty <= 10,
          )
          .slice(0, 30)
      : [];
  } catch {
    return [];
  }
}
export function addLine(cart, line) {
  const copy = cart.map((x) => ({ ...x }));
  const existing = copy.find(
    (x) => x.id === line.id && x.color === line.color && x.size === line.size,
  );
  if (existing) existing.qty = Math.min(10, existing.qty + line.qty);
  else copy.push({ ...line, qty: Math.max(1, Math.min(10, line.qty)) });
  return copy;
}
