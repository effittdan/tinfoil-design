import test from "node:test";
import assert from "node:assert/strict";
import {
  selectLines,
  cents,
  validateAddress,
  verifyPayPalCapture,
} from "../server/validation.mjs";
import { addLine, readCart } from "../src/cart.js";
const catalog = [
  {
    id: "black-file",
    name: "Black File Tee",
    variants: [
      {
        color: "Black",
        size: "M",
        available: true,
        currency: "USD",
        price: 38,
        syncVariantId: 123,
        catalogVariantId: 456,
      },
    ],
  },
];
const line = {
  id: "black-file",
  color: "Black",
  size: "M",
  qty: 2,
  price: 0.01,
};
test("server prices come from catalog, never from browser", () =>
  assert.equal(selectLines([line], catalog)[0].unitCents, 3800));
test("unknown, unavailable, fractional and duplicate selections fail", () => {
  for (const input of [
    [{ ...line, id: "missing" }],
    [{ ...line, size: "XS" }],
    [{ ...line, qty: 1.5 }],
    [{ ...line, qty: 0 }],
    [line, line],
  ])
    assert.throws(() => selectLines(input, catalog));
  assert.throws(() =>
    selectLines(
      [line],
      [
        {
          ...catalog[0],
          variants: [{ ...catalog[0].variants[0], available: false }],
        },
      ],
    ),
  );
});
test("invalid prices cannot silently become free products", () => {
  for (const p of [0, -1, NaN, Infinity, "invalid", 38.123])
    assert.throws(() => cents(p));
});
test("shipping addresses must have supported country and valid email", () => {
  const a = {
    name: "Test Person",
    email: "test@example.com",
    address1: "123 Example",
    city: "Austin",
    state_code: "tx",
    zip: "78701",
    country_code: "US",
  };
  assert.equal(validateAddress(a).state_code, "TX");
  assert.throws(() => validateAddress({ ...a, email: "invalid" }));
  assert.throws(() => validateAddress({ ...a, country_code: "ZZ" }));
  assert.throws(() => validateAddress({ ...a, address1: "" }));
});
test("PayPal amount, order, currency and capture status are verified", () => {
  const o = { id: "local", provider_id: "paypal", payload: { total: 8100 } };
  const r = {
    id: "paypal",
    status: "COMPLETED",
    purchase_units: [
      {
        reference_id: "local",
        payments: {
          captures: [
            {
              id: "capture",
              status: "COMPLETED",
              amount: { value: "81.00", currency_code: "USD" },
            },
          ],
        },
      },
    ],
  };
  assert.equal(verifyPayPalCapture(r, o), "capture");
  assert.throws(() => verifyPayPalCapture({ ...r, id: "other" }, o));
  assert.throws(() => verifyPayPalCapture(r, { ...o, payload: { total: 1 } }));
});
test("cart merges identical variants but keeps sizes separate", () => {
  const a = addLine([], line);
  const b = addLine(a, line);
  assert.equal(b[0].qty, 4);
  assert.equal(a[0].qty, 2);
  assert.equal(addLine(b, { ...line, size: "L" }).length, 2);
});
test("corrupt stored cart is rejected", () =>
  assert.deepEqual(readCart({ getItem: () => "{broken" }), []));
