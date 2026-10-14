# Collection grunge inventory

Scope: 24 remaining designs, all 372 garment-color combinations. The 18 existing Black File styled mockups remain unchanged.

| Collection | Images | Background |
| --- | ---: | --- |
| Conspiracy Inspired | 72 | Torn photocopies over charcoal concrete |
| Fringe Ideas | 72 | Weathered limestone and cracked plaster |
| UFO Culture | 54 | Scratched industrial gunmetal |
| They Knew | 134 | Distressed newsprint and pasted paper |
| Alt Thinking | 40 | Warped copier toner and halftone grain |

## Sources and method

The five background masters were generated with the built-in imagegen tool. Prompt direction: square, overhead, flat grunge surfaces in charcoal and warm off-white; quiet centers with distressed outer margins; no garments, words, logos, or added objects. Collection-specific materials are listed above. Conspiracy Inspired used the existing Black File backdrop as the visual reference.

The user explicitly approved scripted compositing for every color. Original 800 × 800 Printful mockups were downloaded from the saved October 13 launch catalog (`.netlify/full-collection-live.json`). Their URLs and SHA-256 hashes are in `output/collection-grunge/inventory.json`.

Boundary-connected white background pixels are replaced with the collection texture. Up to four pixels at the silhouette boundary receive white-matte cleanup using nearby garment color; this is restricted to the edge. All deeper garment pixels, including the complete printed artwork, are compared against the original after the lossless PNG is decoded. All 372 outputs passed with zero changed protected pixels. Source hashes are rechecked while packaging.

The AI-edited Numbers Station sample under `samples/` was excluded because it altered garment details. The final batch uses original garment pixels, not regenerated shirts.

## Deliverables

- `output/collection-grunge/review.html`: complete review, linked to five collection galleries and original references.
- `output/collection-grunge/styled/`: 372 lossless PNG masters, 800 × 800.
- `output/collection-grunge/review/*-colors.png`: every design's complete color sheet.
- `public/assets/products/collection-grunge/`: 372 quality-92 WebP website copies. Lossless PNG masters remain in the output folder.
- `output/collection-grunge/composite-validation.json`: per-image pixel checks.
- `data/catalog.json`: every remaining color mapped to a styled image; `styledImageMethod: composite` distinguishes these from the original AI mockups.
- `src/main.js`: gallery note identifies the original garment with a styled collection background.

The user authorized GitHub and SiteGround publication after reviewing the local catalog. No Printful, price, or fulfillment-setting changes were part of this release.

Validation: 372 mappings and asset files verified; Black File entries and all unrelated catalog fields match the pre-update backup. All 18 automated tests and the production build passed. Live provider checks were skipped because credentials are not configured locally.

## Rebuild

Run `node scripts/download-grunge-references.mjs`, then `node scripts/composite-collection-grunge.mjs`, then `node scripts/package-collection-grunge.mjs`. Existing original reference files are reused and hash-checked. The compositing step rewrites only derived assets. The packaging step backs up the catalog before its first mapping update and preserves unrelated catalog fields.

SiteGround upload preparation: the 128 MB upload cap required optimizing the display assets from 259 MiB lossless WebP to 69.3 MiB quality-92 WebP. Six print-area comparisons averaged 40.28 dB PSNR, and visual review found the small lettering intact. The lossless PNG masters and originals were preserved.

## Published release

GitHub `main`: source/asset commit `c7cb538`, followed by display optimization `a141a39`. SiteGround accepted `.netlify/tinfoil-collection-grunge-web.zip` (123,843,146 bytes), and the wizard reported **Deployed!**. The runtime package preserves the previous automatic-fulfillment release, changing only `src/main.js`, `data/catalog.json`, and the new display assets.

Live verification on `https://tinfoildesign.com`:

- All 372 new asset URLs returned HTTP 200, `image/webp`, and SHA-256 matching the local optimized asset.
- Shop DOM showed 24 new grunge product-card images and no visible broken images.
- Numbers Station styled gallery switched to the exact Ivory asset and displayed the composited-background note.
- Desktop (2309 px) and mobile (390 px) DOM measurements found no horizontal overflow. Mobile screenshot capture timed out; DOM checks completed.
- Catalog returned `live: true`, 26 products and 2,730 variants. Capabilities retained card checkout enabled, PayPal disabled, US delivery.
- Evidence: `output/collection-grunge/live-verification.json`, `siteground-deployed.png`, and `live-product-ivory.png`.
