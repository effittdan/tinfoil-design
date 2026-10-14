import catalog from "../data/catalog.json" with { type: "json" };
import mappings from "../data/fulfillment.json" with { type: "json" };
import { printful } from "./providers.mjs";
export const productEndpoint = () =>
  process.env.PRINTFUL_PRODUCT_ENDPOINT || "/store/products";
const cache = new Map();
let active = 0;
const queue = [];
async function productDetails(id, fresh) {
  const existing = cache.get(id);
  if (existing && (existing.pending || (!fresh && existing.until > Date.now())))
    return existing.promise;
  const entry = { pending: true, until: 0 };
  entry.promise = (async () => {
    if (active >= 4) await new Promise((resolve) => queue.push(resolve));
    else active++;
    try {
      const result = await printful(productEndpoint() + "/" + id);
      entry.until = Date.now() + 300000;
      return result;
    } catch (error) {
      cache.delete(id);
      throw error;
    } finally {
      entry.pending = false;
      const next = queue.shift();
      if (next) next();
      else active--;
    }
  })();
  cache.set(id, entry);
  return entry.promise;
}
export async function loadCatalog({ ids, fresh = false } = {}) {
  const products = await Promise.all(
    catalog
      .filter((p) => !ids || ids.includes(p.id))
      .map(async (p) => {
        const mapping = mappings[p.id];
        if (!mapping) return { ...p, variants: [] };
        const details = await Promise.all(
          [mapping].flat().map((id) => productDetails(id, fresh)),
        );
        return {
          ...p,
          variants: details.flatMap((d) =>
            d.sync_variants
              .filter(
                (v) =>
                  v.synced &&
                  v.retail_price &&
                  v.currency === "USD" &&
                  v.files?.some(
                    (f) =>
                      ["default", "front"].includes(f.type) &&
                      f.status === "ok",
                  ),
              )
              .map((v) => ({
                syncVariantId: v.id,
                catalogVariantId: v.variant_id,
                color: v.color,
                size: v.size === "2XL" ? "XXL" : v.size,
                price: Number(v.retail_price),
                currency: v.currency,
                available: v.availability_status === "active",
                image:
                  v.files.find((f) => f.type === "preview")?.preview_url ||
                  d.sync_product.thumbnail_url,
              })),
          ),
        };
      }),
  );
  return products;
}
export const hasMappings = () => Object.keys(mappings).length > 0;
