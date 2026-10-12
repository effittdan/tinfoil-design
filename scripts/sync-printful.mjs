import { writeFile, readFile } from "node:fs/promises";
import catalog from "../data/catalog.json" with { type: "json" };
import { printful } from "../server/providers.mjs";
import { productEndpoint } from "../server/catalog.mjs";
// Discover identifiers only; merchant mappings require an explicit review.
const products = [];
for (let offset = 0; ; offset += 100) {
  const page = await printful(
    productEndpoint() + "?limit=100&offset=" + offset,
  );
  products.push(...page);
  if (page.length < 100) break;
}
const details = [];
for (const p of products) {
  const d = await printful(productEndpoint() + "/" + p.id);
  details.push({
    syncProductId: p.id,
    name: p.name,
    variants: d.sync_variants.map((v) => ({
      id: v.id,
      catalogVariantId: v.variant_id,
      color: v.color,
      size: v.size,
      price: v.retail_price,
      currency: v.currency,
      synced: v.synced,
    })),
  });
}
await writeFile(
  "data/printful-discovery.json",
  JSON.stringify(details, null, 2) + "\n",
);
console.log(
  `Discovered ${details.length} Printful products. Review before editing data/fulfillment.json; no products or orders changed.`,
);
