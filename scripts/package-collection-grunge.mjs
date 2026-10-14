import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const root = 'output/collection-grunge';
const inventory = JSON.parse(await readFile(`${root}/inventory.json`, 'utf8'));
const catalog = JSON.parse(await readFile('data/catalog.json', 'utf8'));
const reports = JSON.parse(await readFile(`${root}/composite-validation.json`, 'utf8'));
if (reports.length !== 372 || reports.some(r => r.changedProtectedPixels)) throw Error('Incomplete pixel validation');
const slug = s => s.toLowerCase().replaceAll(' ', '-');
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
await mkdir('public/assets/products/collection-grunge', { recursive: true });
await mkdir(`${root}/review`, { recursive: true });
try { await access(`${root}/catalog-before-styled.json`); }
catch { await copyFile('data/catalog.json', `${root}/catalog-before-styled.json`); }
let totalBytes = 0;
for (const job of inventory.jobs) {
  const original = await readFile(job.reference);
  if (createHash('sha256').update(original).digest('hex') !== job.referenceSHA256) throw Error('Reference modified');
  const filename = `${job.id}-${slug(job.color)}.webp`;
  const destination = `public/assets/products/collection-grunge/${filename}`;
  // Quality-92 display copies fit the SiteGround upload limit; PNG masters stay lossless.
  await sharp(job.output).webp({ quality: 92, effort: 5 }).toFile(destination);
  totalBytes += (await readFile(destination)).length;
  const product = catalog.find(p => p.id === job.id);
  product.styledImages ??= {};
  product.styledImages[job.color] = `/assets/products/collection-grunge/${filename}`;
  product.styledImageMethod = 'composite';
}
await writeFile('data/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
const collections = [...new Set(inventory.jobs.map(j => j.collection))];
const style = `body{margin:0;background:#101010;color:#f0efe8;font:15px/1.5 system-ui;padding:clamp(16px,3vw,48px)}h1{font-size:clamp(28px,4vw,52px)}h2{margin-top:50px}a{color:inherit}nav{display:flex;gap:18px;flex-wrap:wrap}p{max-width:850px;color:#bcbdb6}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:18px}figure{margin:0}img{width:100%;height:auto;display:block}figcaption{padding:10px 0 20px}small{color:#e8f146}button,select{font:inherit;padding:8px}header{border-bottom:1px solid #444;padding-bottom:24px}`;
const cards = jobs => jobs.map(j => `<figure><a href="../styled/${j.output.split('/').at(-1)}"><img loading="lazy" width="800" height="800" src="../styled/${j.output.split('/').at(-1)}" alt="${escape(j.id)} in ${escape(j.color)}"></a><figcaption>${escape(j.id)} / ${escape(j.color)} · <a href="../references/${j.reference.split('/').at(-1)}">Original</a></figcaption></figure>`).join('');
for (const collection of collections) {
  const jobs = inventory.jobs.filter(j => j.collection === collection);
  await writeFile(`${root}/review/${slug(collection)}.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(collection)} — Grunge review</title><style>${style}</style><header><a href="../review.html">All collections</a><h1>${escape(collection)}</h1><p>${jobs.length} styled images. Select any image for its full-size PNG; Original opens its unchanged Printful reference.</p></header><div class="grid">${cards(jobs)}</div></html>`);
}
await writeFile(`${root}/review.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tinfoil Hat — 372 styled images</title><style>${style}</style><header><small>TINFOIL HAT / COMPLETE GRUNGE INVENTORY</small><h1>372 images. Five collections.</h1><p>All 24 remaining designs, every available shirt color. Lossless 800 × 800 PNG masters and optimized quality-92 WebP website copies. Garment interiors and printed artwork remain pixel-identical to the source; only the background and a four-pixel antialiased silhouette edge are composited. Originals are preserved. Local catalog mappings are prepared; not deployed.</p><nav>${collections.map(c => `<a href="review/${slug(c)}.html">${c} (${inventory.jobs.filter(j => j.collection === c).length})</a>`).join('')}</nav></header><h2>Design overview</h2><div class="grid">${cards(inventory.jobs.filter(j => j.lead)).replaceAll('../styled/','styled/').replaceAll('../references/','references/')}</div></html>`);
// Review sheets cover each design's complete color range.
for (const id of [...new Set(inventory.jobs.map(j => j.id))]) {
  const jobs = inventory.jobs.filter(j => j.id === id);
  const tiles = [];
  for (let i = 0; i < jobs.length; i++) {
    tiles.push({ input: await sharp(jobs[i].output).resize(240,240).toBuffer(), left: i % 6 * 240, top: Math.floor(i / 6) * 240 });
  }
  await sharp({ create:{width:1440,height:Math.ceil(jobs.length / 6)*240,channels:3,background:'#101010'} }).composite(tiles).png().toFile(`${root}/review/${id}-colors.png`);
}
await writeFile(`${root}/package-summary.json`, JSON.stringify({images:372,designs:24,collections:5,webpBytes:totalBytes,sourceHashesVerified:372,protectedPixelFailures:0,deployed:false},null,2));
console.log(`Packaged 372 optimized WebPs (${Math.round(totalBytes/1024/1024)} MiB), full review galleries, and local catalog mappings.`);
