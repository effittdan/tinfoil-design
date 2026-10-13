import { printful } from "../server/providers.mjs";

const storeId = process.env.PRINTFUL_STORE_ID;
const expectedStoreId = process.argv[2];
const endpoint = process.env.PRINTFUL_PRODUCT_ENDPOINT || "/store/products";

if (
  process.argv.includes("--if-configured") &&
  !process.env.PRINTFUL_API_TOKEN &&
  !storeId
) {
  console.log("Printful API verification skipped: credentials not configured.");
  process.exit(0);
}

try {
  if (!process.env.PRINTFUL_API_TOKEN || !/^\d+$/.test(storeId || ""))
    throw new Error("missing_configuration");
  if (expectedStoreId && expectedStoreId !== storeId)
    throw new Error("unexpected_store");
  if (!["/store/products", "/sync/products"].includes(endpoint))
    throw new Error("unsupported_endpoint");

  const products = await printful(endpoint + "?limit=1&offset=0");
  if (!Array.isArray(products)) throw new Error("invalid_response");
  console.log(
    `Printful API verified for configured store ${storeId}; product lookup succeeded; ${products.length ? "products present" : "store has no products"}. No orders created.`,
  );
} catch (error) {
  // Provider response bodies and credentials must never enter build logs.
  const known = new Set([
    "missing_configuration",
    "unexpected_store",
    "unsupported_endpoint",
    "invalid_response",
  ]);
  const reason = known.has(error.message)
    ? error.message
    : Number.isInteger(error.httpStatus)
      ? `HTTP ${error.httpStatus}`
      : "request_failed";
  console.error(`Printful API verification failed: ${reason}.`);
  process.exitCode = 1;
}
