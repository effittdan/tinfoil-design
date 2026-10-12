import { readFile, writeFile, mkdir } from "node:fs/promises";
import catalog from "../data/catalog.json" with { type: "json" };
const html = await readFile("dist/index.html", "utf8");
const routes = [
  "shop",
  "collections",
  "about",
  "journal",
  "cart",
  "checkout",
  "order",
  "shipping",
  "privacy",
  "terms",
  "contact",
  "404",
  ...catalog.map((p) => "product/" + p.id),
  ...["signal", "hat", "eye", "founding"].map((s) => "journal/" + s),
];
for (const route of routes) {
  await mkdir("dist/" + route, { recursive: true });
  const p = catalog.find((p) => route === "product/" + p.id);
  const title = p
    ? `${p.name} | Tinfoil Hat`
    : `${route.split("/").at(-1).replaceAll("-", " ")} | Tinfoil Hat`;
  await writeFile(
    "dist/" + route + "/index.html",
    html.replace(
      "<title>Tinfoil Hat | Protect the Signal</title>",
      `<title>${title}</title>`,
    ),
  );
}
await writeFile("dist/404.html", html);
const origin = (
  process.env.SITE_URL || "https://tinfoilhat.netlify.app"
).replace(/\/$/, "");
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["", ...routes.filter((r) => !["cart", "checkout", "order", "404"].includes(r))].map((r) => `<url><loc>${origin}/${r}</loc></url>`).join("")}</urlset>`,
);
await writeFile(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nDisallow: /checkout\nDisallow: /cart\nDisallow: /order\nSitemap: ${origin}/sitemap.xml\n`,
);
