import catalog from "../data/catalog.json" with { type: "json" };
import mappings from "../data/fulfillment.json" with { type: "json" };
import { printful } from "./providers.mjs";
export const productEndpoint = () =>
  process.env.PRINTFUL_PRODUCT_ENDPOINT || "/store/products";
export async function loadCatalog() {
  const products = await Promise.all(
    catalog.map(async (p) => {
      const syncProductId = mappings[p.id];
      if (!syncProductId) return { ...p, variants: [] };
      const d = await printful(productEndpoint() + "/" + syncProductId);
      return {
        ...p,
        variants: d.sync_variants
          .filter(
            (v) =>
              v.synced &&
              v.retail_price &&
              v.currency === "USD" &&
              v.files?.some(
                (f) =>
                  ["default", "front"].includes(f.type) && f.status === "ok",
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
      };
    }),
  );
  return products;
}
export const hasMappings = () => Object.keys(mappings).length > 0;
