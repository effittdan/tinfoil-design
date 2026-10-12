# SiteGround deployment

The same repository can run directly on a Node.js host. `npm start` launches the built storefront and API in one process; it does not proxy to Netlify. Netlify deploys continue using their existing functions.

## Cutover status / October 12, 2026

- SiteGround Node project hosts `tinfoildesign.com` and `www.tinfoildesign.com`; HTTPS, homepage, a product deep link, `/healthz` and `/api/capabilities` responded successfully after assignment. Checkout remains disabled.
- WordPress hosting is preserved under `legacy.tinfoildesign.com`, not deleted. Its server remains `35.209.159.21`; the storefront host is `34.174.108.13`. A free Let's Encrypt certificate is active, HTTPS returns 200, the authenticated admin opens, and both WordPress home/site URL settings use the legacy hostname.
- A separate 335 MB WordPress file archive was created outside `public_html`. A complete SQL export of all 90 tables and the original 22 DNS records were saved privately outside Git. The file archive's local download was not confirmed; its on-server creation was confirmed. The SQL export was verified for complete length, schema tables and final COMMIT.
- User explicitly approved the rename's loss of access to SiteGround's prior backup history. No premium backup purchase was made.
- Authoritative DNS confirms root/www and legacy addresses. Root SPF, Google verification, DKIM and DMARC are present. Missing custom A records for `shop` and `www.shop` were restored to `35.209.159.21`, and `localhost` to `127.0.0.1`; authoritative DNS confirms them. This restores records, not the former shop virtual host: its files now appear under `shop.legacy.tinfoildesign.com`. SiteGround-generated mail/FTP/SSH/autoconfig/autodiscover records point at the new host, and its current three MX targets are `mx*.antispam.mailspamprotection.com`; the saved pre-cutover UI listed `mx*.mailspamprotection.com`. These platform-generated records were left intact. No working mailbox or end-to-end mail delivery is claimed.
- Hosting uses a manual ZIP from runtime commit `eca0e1c`. The GitHub app is installed read-only for this repository, but SiteGround's repository picker remained empty, so automatic Git deployment is not enabled.
- The Node project's `SITE_URL` is now `https://tinfoildesign.com`. The source ZIP was reuploaded and deployed successfully; the public sitemap contains the final hostname. Health, capabilities, product and checkout routes return 200; capabilities report all payment providers disabled. Chrome verification found no visible broken images or desktop horizontal overflow. The 335 MB preservation archive was reconfirmed outside `public_html` after rename.
- A scoped SiteGround Search & Replace was submitted for full `https://tinfoildesign.com` references in legacy WordPress. Its canonical URL is correct, but a hardcoded homepage Shop Now link still points to the main domain after reload/cache-refresh attempt. Treat remaining Elementor content references and old Printful/WooCommerce callbacks as unresolved; no database-wide bare-host replacement was performed.
- Remaining: configure private database/payment/fulfillment connections, correct the hosted form route, and resolve automatic Git deployment. SiteGround's nginx returned 405 for a test form POST to `/`, before the standalone handler could return its expected unconfigured-storage 503. Do not open signups or contact submissions until an API-routed form endpoint and private storage are verified on this host.

## Build and runtime

- Node.js 22 or newer; npm package manager.
- Install: `npm ci` (include dev dependencies for Vite during the build).
- Build: `npm run build`.
- Start: `npm start`.
- SiteGround must route requests to the process's `PORT`; the listener binds `0.0.0.0`.
- Health endpoint: `/healthz`.
- Public checkout status endpoint: `/api/capabilities`. SiteGround rejected `/api/config` before the request reached Node; no host protection was disabled.
- Static output: `dist`; do not expose the repository root, `.env`, server files or credentials.
- Set `SITE_URL` to the actual HTTPS host before building and starting, initially the assigned temporary hostname and later `https://tinfoildesign.com`.
- Set `COMMERCE_ENABLED=false` during migration. Configure credentials privately in the Node project's environment, not in files or Git.

## Private storage and forms

Use a dedicated PostgreSQL database, configure `DATABASE_URL`, and run `npm run db:setup` against that database only. The schema includes orders, webhook events, rate limits and private contact/frequency submissions. The standalone handler supports forms POSTed to `/` and persists locally in PostgreSQL; without storage it returns 503. However, the current SiteGround front proxy rejects POST `/` with 405, so this deployment needs an API-routed form endpoint before enabling submissions. Netlify-hosted forms retain Netlify Forms handling. A frequency signup stores consent; it does not create an outbound email campaign or mailing-list-provider sync.

The standalone process retries one paid order's missing Printful draft every ten minutes. No fulfillment confirmation/spending is enabled. Start only one process unless reconciliation and shared rate-limiting behavior have been verified with the hosting configuration.

## Safe cutover

1. Deploy and verify on a SiteGround temporary domain first.
2. Preserve the current WordPress files, database, uploads, orders and email accounts. A Git archive of the old static design is not a WordPress backup.
3. Check whether the existing domain can be reassigned without deleting its WordPress site. Stop for a preservation plan if SiteGround requires deletion.
4. Preserve MX/TXT records and email service during the change.
5. Update `SITE_URL`, rebuild, then assign the domain. No forwarding to Netlify is needed.
6. Verify HTTPS, homepage, product deep links, assets, closed checkout and form persistence independently on the live domain. Payment webhooks must eventually target the final SiteGround host with separately verified provider settings.

Merchant product mappings, policies, database setup and sandbox payment testing remain prerequisites for opening checkout.
