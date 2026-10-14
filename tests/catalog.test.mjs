import test from "node:test";
import assert from "node:assert/strict";
import mappings from "../data/fulfillment.json" with { type: "json" };
import catalog from "../data/catalog.json" with { type: "json" };
import { loadCatalog } from "../server/catalog.mjs";
import { selectLines } from "../server/validation.mjs";

test("every design is connected to the reviewed collection without duplicate Printful products", () => {
  assert.equal(catalog.length, 26);
  assert.deepEqual(
    Object.keys(mappings).sort(),
    catalog.map((p) => p.id).sort(),
  );
  const ids = Object.values(mappings).flat();
  assert.equal(ids.length, 44);
  assert.equal(new Set(ids).size, 44);
  for (const p of catalog) {
    assert.equal(p.type, "Tee");
    assert.match(p.garment, /Comfort Colors 1717/);
    assert.equal(p.sizes.length, 7);
    assert.equal(
      p.colors.length,
      Array.isArray(mappings[p.id]) ? 18 : p.id === "black-file" ? 10 : 8,
    );
  }
});

test("paired products resolve to the correct fulfillment variant and refresh prices before checkout", async (t) => {
  const previous = { ...process.env };
  process.env.PRINTFUL_API_TOKEN = "test-token";
  process.env.PRINTFUL_STORE_ID = "18898875";
  t.after(() => {
    for (const key of ["PRINTFUL_API_TOKEN", "PRINTFUL_STORE_ID"])
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
  });
  let calls = 0,
    updated = false;
  t.mock.method(globalThis, "fetch", async (url) => {
    calls++;
    const id = Number(url.split("/").at(-1));
    const dark = id === mappings["numbers-station"][0];
    return Response.json({
      result: {
        sync_product: { thumbnail_url: "https://example.com/shirt.png" },
        sync_variants: [
          {
            id,
            variant_id: dark ? 101 : 102,
            synced: true,
            color: dark ? "Black" : "Ivory",
            size: "2XL",
            retail_price: updated ? "25.00" : "24.00",
            currency: "USD",
            availability_status: "active",
            files: [{ type: "front", status: "ok" }],
          },
          {
            id: 999,
            synced: true,
            retail_price: "1.00",
            currency: "USD",
            files: [{ type: "front", status: "failed" }],
          },
        ],
      },
    });
  });
  const result = await loadCatalog({ ids: ["numbers-station"] });
  assert.equal(result[0].variants.length, 2);
  for (const [color, index] of [
    ["Black", 0],
    ["Ivory", 1],
  ]) {
    const [line] = selectLines(
      [{ id: "numbers-station", color, size: "XXL", qty: 1 }],
      result,
    );
    assert.equal(line.syncVariantId, mappings["numbers-station"][index]);
    assert.equal(line.unitCents, 2400);
  }
  await loadCatalog({ ids: ["numbers-station"] });
  assert.equal(calls, 2);
  updated = true;
  const refreshed = await loadCatalog({
    ids: ["numbers-station"],
    fresh: true,
  });
  assert.equal(calls, 4);
  assert.equal(refreshed[0].variants[0].price, 25);
});
