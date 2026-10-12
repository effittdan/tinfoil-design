import sharp from "sharp";
for (const id of [
  "black-file",
  "numbers-station",
  "ancient-tech",
  "abduction-protocol",
])
  await sharp(`artwork-source/${id}.png`)
    .resize(1200, 1200, { fit: "contain", background: "#ecebe5" })
    .webp({ quality: 88 })
    .toFile(`public/assets/products/${id}.webp`);
await sharp("artwork-source/alley.png")
  .resize({ width: 1900, withoutEnlargement: true })
  .webp({ quality: 85 })
  .toFile("public/assets/alley.webp");
