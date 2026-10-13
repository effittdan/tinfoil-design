# Tinfoil commerce setup

Site: https://tinfoildesign.com (SiteGround); preview: https://tinfoilhat.netlify.app
GitHub: https://github.com/effittdan/tinfoil-design
Observed merchant accounts: Printful Tinfoil Hat v2 (manual/API, store ID 18898875); preserved Tinfoil Hat Design (WooCommerce, store ID 4711201); PayPal effitt account per user; Stripe effitt, LLC.

## Connection status / October 13, 2026

- Stripe: dedicated restricted test key created with Checkout Sessions and Tax Calculations/Transactions access; active test webhook `Tinfoil storefront - test` subscribes to the two successful Checkout events below. Credentials are stored as secret production-context Functions variables in Netlify, never in the repository. A read-only Checkout Sessions API authentication test passed. End-to-end payment flow testing is still required.
- Printful: Tinfoil Hat v2 is connected using a dedicated single-store token, created October 13, 2026 and expiring October 13, 2027. `PRINTFUL_API_TOKEN` and `PRINTFUL_STORE_ID=18898875` are saved privately in the SiteGround Node project. Scopes: Sync products/read, Orders/read, Orders. The merchant explicitly approved the Orders permission, which technically permits confirmation; application behavior remains draft-only. No product/file/webhook write permission was granted. SiteGround's completed deployment log verifies a successful authenticated GET to `/store/products`; the new store is empty. No test order or fulfillment charge was created. Old WooCommerce products remain untouched.
- PayPal: developer dashboard requires a fresh merchant login before app creation.
- Private database: awaiting a dedicated database choice. No paid database or plan upgrade was purchased.
- Netlify Forms are enabled on the preview only. SiteGround form routing/storage remains incomplete (see deployment notes). Storefront checkout is disabled.

## 1. Printful

The preserved WooCommerce store has 17 older synced products, including products unrelated to the new design collection. Do not map Black File to an old graphic just because the garment matches. The new manual/API store is Tinfoil Hat v2, ID `18898875`, and had no published products at the verified connection check.

Use Tinfoil Hat v2 for the new catalog, retaining the WooCommerce store as history. Token access is limited to v2. Printful combines draft creation and confirmation under its Orders permission; the application never requests order confirmation. Product creation, reviewed variant mappings, shipping/tax/payment tests and a successful draft-order test are still outstanding.

`npm run printful:verify -- 18898875` performs a read-only product lookup using private environment variables. The standard build's `postbuild` hook runs this check when Printful credentials are configured and fails on a missing paired setting, wrong configured store, invalid response or failed authentication. Builds without either Printful variable skip the check, so local builds and the unconnected Netlify preview remain available. Logs contain the store ID and whether products exist, never credentials or customer records.

Set `PRINTFUL_API_TOKEN` and `PRINTFUL_STORE_ID` privately. Run `npm run catalog:sync`; it saves non-secret product/variant identifiers to `data/printful-discovery.json`. Assign reviewed sync product IDs to corresponding slugs in `data/fulfillment.json`, e.g. `{ "black-file": 123456789 }` (example ID, never use it). Verify each color, size, artwork placement, print file status, SKU, currency, retail price and availability. The importer and API use `/store/products` for manual/API stores; set `PRINTFUL_PRODUCT_ENDPOINT=/sync/products` if using a WooCommerce store's Ecommerce Platform Sync API.

Source: https://developers.printful.com/docs/

## 2. Stripe

Use the effitt, LLC account the user has opened. Start with test-mode secret keys. Configure Stripe Tax business location/registrations and review the product tax code (default Clothing and Footwear `txcd_30011000`). The Tax API is called to quote tax for card and PayPal orders; it must be ready before either payment flow opens.

Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Netlify Functions environment settings. Register a webhook for `checkout.session.completed` and `checkout.session.async_payment_succeeded` at:

`https://tinfoilhat.netlify.app/api/stripe-webhook`

Test and live webhook secrets differ. Hosted Stripe Checkout takes card details on Stripe, not on this site. This implementation charges the stored quote, including shipping and tax. Successful payment creates a recorded Stripe Tax transaction from the quote calculation, then a Printful draft.

Sources: https://docs.stripe.com/checkout/fulfillment and https://docs.stripe.com/tax/custom

## 3. PayPal

Create a Tinfoil-specific REST developer app under the user's effitt PayPal business account. A payment-button/NCP page is not the REST API connection. Begin in sandbox mode.

Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, and `PAYPAL_ENVIRONMENT=sandbox`. Register `CHECKOUT.ORDER.APPROVED` and `PAYMENT.CAPTURE.COMPLETED` at:

`https://tinfoilhat.netlify.app/api/paypal-webhook`

Buyer approval redirects to `/order`. The server captures/verifies the payment against the stored quote. Verified webhooks also recover orders if the buyer never returns. The server verifies provider signatures, amounts, reference IDs and completed status before fulfillment.

Sources: https://developer.paypal.com/api/orders/v2 and https://developer.paypal.com/api/rest/webhooks

## 4. Private order storage

Use a dedicated PostgreSQL database for this store, with `DATABASE_URL` privately configured. `NETLIFY_DB_URL` is also accepted when using current Netlify Database. On an external PostgreSQL database, `npm run db:setup` creates order, webhook-event and rate-limit tables; on Netlify Database, apply the same schema through its documented deployment migration flow. Do not run ad hoc DDL against Netlify Database.

The database stores delivery addresses and payment/fulfillment identifiers; it is never shipped to the browser. Public order lookup requires a random receipt token and returns status only. Configure retention/backups and business privacy policy before launch.

Source: https://docs.netlify.com/build/data-and-storage/netlify-database/api/

## 5. Release gate

- Merchant approves actual garment specifications, sizes, colors and retail prices.
- Actual new-design Printful products are published and mapped; obsolete/discontinued variants cannot be purchased.
- Shipping/returns, privacy, merchant identity, contact route and terms are finalized.
- Payment credentials and signed webhooks are configured in the correct environment.
- Both sandbox payment flows and interrupted/duplicate/replayed webhook recovery are tested.
- A real approved sample demonstrates that the actual print matches the site.
- `SITE_URL` matches the destination; checkout POST requests are restricted to that origin.
- `ALLOWED_COUNTRIES` lists approved delivery countries (initial scaffold: US).
- Set `COMMERCE_ENABLED=true` only after the checks above. Keep production disabled until live credentials and launch approval exist.

Only completed payments submit a draft Printful order. A merchant still reviews and confirms the draft in Printful; confirmation charges fulfillment funds. Automatic draft confirmation and tracking webhooks are a later operational step and are not enabled in this release.
