import sharp from "sharp";
import { readFile, mkdir, readdir, access } from "node:fs/promises";
import path from "node:path";
const catalog = JSON.parse(await readFile("data/catalog.json", "utf8"));
const root =
  process.env.ARTWORK_ROOT || "S:/Tinfoil/2026 Refresh/Finished Artwork";
await mkdir("public/assets/artwork", { recursive: true });
for (const p of catalog) {
  const category =
    p.collection === "Conspiracy Inspired"
      ? "Conspiracy"
      : p.collection === "UFO Culture"
        ? "UFO"
        : p.collection === "They Knew"
          ? "They Knew"
          : "Fringe";
  for (const [mode, folder] of [
    ["dark", "Dark Shirts"],
    ["light", "Light Shirts"],
  ]) {
    const input = p.prepped
      ? path.join(
          root,
          "..",
          "Designs",
          p.collection === "Alt Thinking" ? "Alt Think" : "They Knew",
          `${p.design}-Transparent-Prepped.png`,
        )
      : path.join(
          root,
          folder,
          category,
          `${p.design}-${mode === "dark" ? "Dark" : "Light"}-Shirts-v1.png`,
        );
    await sharp(input)
      .trim()
      .resize({
        width: 1200,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 90 })
      .toFile(`public/assets/artwork/${p.id}-${mode}.webp`);
  }
}
for (const [input, out] of [
  ["Reference/New Logos/TF Word Mark.png", "wordmark"],
  ["Reference/New Logos/TF Brand Mark.png", "brand-mark"],
])
  await sharp(input)
    .resize({ width: 700, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(`public/assets/${out}.webp`);
console.log(`Prepared ${catalog.length} artwork pairs and brand assets.`);
