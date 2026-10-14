import sharp from "sharp";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
const root = "output/black-file";
const destination = "public/assets/products/black-file";
await mkdir(destination, { recursive: true });
await mkdir(`${root}/custom`, { recursive: true });
const catalog = JSON.parse(await readFile("data/catalog.json", "utf8"));
for (const product of catalog.filter((p) => p.id.startsWith("black-file"))) {
  product.colorImages = {};
  product.styledImages = {};
  for (const color of product.colors) {
    const name = `${product.id}-${color.toLowerCase().replaceAll(" ", "-")}`;
    await sharp(`${root}/references/${name}.png`)
      .webp({ quality: 92 })
      .toFile(`${destination}/${name}.webp`);
    product.colorImages[color] = `/assets/products/black-file/${name}.webp`;
    if (
      await access(`${root}/custom/${name}-distressed.png`).then(
        () => true,
        () => false,
      )
    ) {
      await sharp(`${root}/custom/${name}-distressed.png`)
        .resize(1200, 1200)
        .webp({ quality: 90 })
        .toFile(`${destination}/${name}-distressed.webp`);
      product.styledImages[color] =
        `/assets/products/black-file/${name}-distressed.webp`;
    }
  }
}
await writeFile("data/catalog.json", JSON.stringify(catalog, null, 2) + "\n");
console.log(
  "Saved garment and available styled images for every catalog color.",
);
