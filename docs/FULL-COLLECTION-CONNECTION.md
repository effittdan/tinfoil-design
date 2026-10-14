# Full collection and checkout launch — October 13, 2026

The live store is https://tinfoildesign.com. SiteGround successfully deployed `.netlify/tinfoil-branded-checkout.zip`; COMMERCE_ENABLED=true. Card checkout is enabled for US delivery. PayPal is not configured. Netlify preview is current at deploy `6ace9d478a32e5f09a9abba1`, with checkout still disabled there.

## Collection

All 25 designs use 44 reviewed Printful products, presented on 26 existing routes, with 2,730 unique variants in store 18898875. Every shirt is Comfort Colors 1717. Eighteen pages combine paired light/dark products (126 variants per page). Six single-version designs use eight light shirt colors (56 variants per page). Black File retains its dark and light routes. Prices match the Black File size/color matrix; live catalog checks found every variant active.

Printful is authoritative for prices, availability and mockups. Catalog requests are limited to four concurrent calls, cached for five minutes. Quote and checkout refresh only selected products. Original artwork is preserved.

## Private connections

- Supabase project: `icdmxnhigvvljqkdylgn`, Tinfoil Hat, organization effittdan, Canada Central Micro ($10/month additional, user created).
- Four tables: tinfoil_orders, tinfoil_events, tinfoil_rate_limits, tinfoil_submissions. RLS enabled, no anon/authenticated SELECT grants. Migration: `supabase/migrations/20261013204500_storefront_orders.sql`.
- DATABASE_URL uses the Supabase session pooler with no embedded password. PGPASSWORD is stored privately in SiteGround. The official Supabase CA in `server/certs/supabase-ca.crt` enables verify-full TLS. Certificate validation remains enabled.
- Restricted live Stripe key permits Checkout Sessions and Tax Calculations/Transactions. Credentials are hosted privately, never stored in this repository.
- Live Stripe destination `we_1UQCdMA47Dm5JQPvRwz2odOh` points to `https://tinfoildesign.com/api/stripe-webhook`; events checkout.session.completed and checkout.session.async_payment_succeeded; webhook API 2025-04-30.basil.
- Checkout creation uses API 2025-09-30.clover for session-specific Tinfoil Hat branding. Shared account-wide branding remains unchanged. Stripe's browser-tab title still inherits the shared account name, while the visible payment heading and back link correctly say Tinfoil Hat.

## Policies and email

User approved replacements/refunds for damaged or incorrect items, with no size/change-of-mind returns for made-to-order apparel. Published at /shipping, and displayed on Stripe Checkout. /privacy and /terms now describe actual providers and merchant effitt, LLC.

orders@tinfoildesign.com is for order support. info@tinfoildesign.com is for website inquiries. User created both forwarders. Live contact submissions POST to /api/submission, validate origin/input/honeypot, pass rate limiting, save privately in PostgreSQL, and relay to the existing Netlify Forms service. Netlify contact notification hook `6ace9bfb08871d77781d7aa9` sends to info@. The user confirmed receipt of the live contact-form test email. Newsletter signups use the same capture path; no marketing campaign automation is configured.

## Verification

- Production build and all 13 automated tests passed.
- Hosted deployment checks passed for Printful store identity, PostgreSQL connection/tables, and Stripe Checkout authentication.
- Browser: Numbers Station Violet / 4XL = $23.50. Actual Printful shipping quote = $4.95; Stripe Tax = $1.92; total = $30.37 for an Austin public-address fixture.
- Stripe live payment page opened successfully with matching item/totals and visible heading Pay Tinfoil Hat. No card entered, no charge made.
- Unsigned webhook rejected with HTTP 400.
- Contact form returned HTTP 204, database record verified, Netlify accepted it, and user confirmed email delivery.
- Existing catalog verification: `output/printful-collection/website-verification.json`.
- Checkout screenshot: `output/printful-collection/stripe-checkout-verified.png`.

## Order operations and remaining validation

Paid orders create Printful DRAFTS. The merchant must review and confirm each draft in Printful; the website does not spend fulfillment funds automatically. Failed draft creation is retried by webhook redelivery and a ten-minute server reconciliation job. Inspect fulfillment_state/error_code privately when investigating orders.

No real paid purchase, successful Stripe delivery event, refund, or Printful draft creation was exercised in this launch. Two unpaid checkout fixtures were created; the database check showed zero paid orders and zero Printful orders. A merchant purchase using their real delivery address is the remaining end-to-end payment/fulfillment validation. Do not pay the public-address verification fixture.

SiteGround uses manual uploads. Netlify is Git-connected, so a later Git deployment can replace the manual preview release. Preserve the dirty working tree and reconcile source changes before a future Git release.

## First real paid-order verification — October 13, 2026

User placed order 19983BEC. Database order `19983bec-75f3-4294-b02e-a19aeb33ded5` is paid via Stripe, payment `pi_3UQD09A47Dm5JQPv03xDRmhW`, with no error_code. Stripe event `evt_1UQD0BA47Dm5JQPve60FWJD6` was recorded at 21:12:54 UTC. Fulfillment successfully created Printful draft `180769015`.

Verified in Printful UI: Kappy Tee Dark, True Navy, XL, quantity 1, Comfort Colors 1717, front print and mockup attached. Recipient name, street, city and postal code match the website order. Customer total $28.24 ($21.50 shirt, $4.95 shipping, $1.79 tax). Printful draft cost $22.25 ($15.60 shirt, $4.95 shipping, $1.70 tax), with estimated delivery shown as November 12. No Printful confirmation or fulfillment charge submitted by the agent. User must confirm the draft to begin physical production.

This supersedes the earlier untested paid-order limitation: live payment, webhook receipt and draft creation have now passed. Production and shipping remain pending merchant confirmation.

## Shared Stripe receipt name — October 13, 2026

User authorized changing the public business name for every site using the shared Stripe account to `effitt LLC`. Saved the Public details > Business name (Doing Business As) field from Eat My Weiner to effitt LLC; legal entity remains effitt, LLC. Account statement descriptor and website/support fields were not changed. Receipt preview verification follows a fresh reload.

User reported Printful confirmation, but read-only inspection still showed Draft and the existing review/pay page awaiting Pay securely now for $22.25. Final fulfillment payment must be completed by the user; no payment action taken by the agent.
Fresh Stripe email-receipt preview verified: `Receipt from effitt LLC`. Evidence: `output/printful-collection/effitt-receipt-preview.png`. This changes future receipt branding across this shared Stripe account; already-delivered emails are not edited.

## Automatic fulfillment activated — October 13, 2026

User connected PayPal and explicitly requested activation. Printful billing UI verified PayPal assigned to Tinfoil Hat v2 (18898875); PayPal is now the account-wide default set during the user's connection. PayPal Credit funding behind that agreement was not independently visible in Printful. Order 19983BEC now shows Waiting for Fulfillment after the user's payment, replacing the earlier draft status.

Deployed `.netlify/tinfoil-auto-fulfillment.zip` to SiteGround, deployment `1791927226-iagsd2`, completed October 13 at 4:33 p.m. America/Chicago. `PRINTFUL_AUTO_CONFIRM=true` verified in the environment and hosted build log: `Printful automatic fulfillment: ENABLED. Confirmation requires a paid order.` Hosted Printful lookup, database and Stripe authentication checks passed; public health and checkout capabilities passed. All 18 local tests and the production build passed.

Future verified paid orders create and confirm their Printful draft automatically. Existing orders with a Printful ID are skipped. Invalid, missing or excessive costs and confirmation failures are held for review. Inspect review/error states privately and check Printful before retrying. To disable automatic confirmation, set PRINTFUL_AUTO_CONFIRM=false and redeploy/restart the runtime; checkout may stay enabled with manual draft confirmation.

No new paid order was placed after activation, so automatic confirmation and its fulfillment charge remain to be verified on the next merchant-approved purchase. No existing order was charged again. PayPal customer checkout and shipment tracking webhooks remain unconfigured. Evidence: `output/printful-collection/automatic-fulfillment-enabled.png`.
