# Black File product release — October 13, 2026

Store: Tinfoil Hat v2, Printful store 18898875.

- Dark: sync product 481162099; storefront /product/black-file; 70 variants, 10 colors.
- Light: sync product 481157488; storefront /product/black-file-light; 56 variants, 8 colors.
- Blank: Unisex Garment-Dyed Heavyweight T-Shirt, Comfort Colors 1717.
- Descriptions, colors, fit notes and image mappings: data/catalog.json.
- Current prices remain owned by Printful. Light non-Ivory variants are all $23.50; this was verified, not normalized. Other observed ranges: $21.50–$29.50.
- Checkout remains disabled.

Printful garment references were retrieved from the storefront's read-only catalog endpoint after the products were mapped. All 18 colors have local WebP images, with originals in output/black-file/references. Original print artwork remains separate and unchanged.

Four AI-styled mockups were created with the built-in imagegen tool, for Black, Pepper, Ivory and Violet. The user's requested distressed revision uses torn paper, scratched ink and cracked charcoal surfaces. Final PNGs: output/black-file/custom/*-distressed.png. WebP versions: public/assets/products/black-file/*-distressed.webp. The earlier concrete versions are preserved locally.

The gallery labels these as styled mockups. They are secondary to the authoritative Printful garment views because generated images can alter tiny artwork details.

## Final editing prompt

Use case: precise-object-edit. Edit only the background of this Tinfoil Hat product mockup. Keep the entire shirt exactly unchanged: pixels of print artwork, lettering, shirt color, silhouette, cotton texture, collar, seams, size, placement and crop. Replace the clean concrete around the shirt with a heavily distressed, grungy editorial backdrop matching a black-ink photocopied punk zine: layers of torn off-white paper over charcoal-black scuffed concrete, visible ripped fibers, scratched ink, dirty photocopy grain, subtle creases and cracked plaster. Background should feel handmade and weathered, tactile and gritty, with bold irregular black/off-white contrast concentrated near the outer margins. Preserve enough separation around the garment silhouette. Keep shirt fully visible, readable, clean and naturally lit; no distress or texture overlays across garment or print. No added text, letters, logos, symbols, props, hands or people. Square product photograph, overhead flat lay. Maintain original garment shadows naturally against new background.

## Validation

Production catalog API returned 70 Dark and 56 Light synced variants. Build and 11 existing tests passed after updating the route-title expectation and covering the new Light route. Gallery color switching and fallback from styled to garment were checked in the browser. Mobile, tablet and desktop DOM checks found no horizontal overflow.

Deployment uses a scoped source ZIP on SiteGround; Netlify remains a preview. No orders, payments or Printful product changes were submitted. Unrelated working files were preserved.

Homepage and category update: styled mockups now lead the homepage hero, featured cards, shop/category listings and related-product cards. Dark uses Black; Light uses Ivory. Product detail galleries retain the separate Garment, Artwork and Styled mockup views.

All-color completion: all 18 selected Printful colors now have distressed styled images (10 Dark, 8 Light). Built-in imagegen used each exact Printful color reference plus the approved distressed Black or Ivory composition. Full prompt and generated source paths are recorded in output/black-file/generated-color-sources.json. Final PNGs are in output/black-file/custom; optimized WebPs and complete styledImages mappings are included in the storefront. Asset coverage check verified every listed color has a file; production build passed.
