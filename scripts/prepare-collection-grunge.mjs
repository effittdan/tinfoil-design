import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = 'output/collection-grunge';
const catalog = JSON.parse(await readFile('data/catalog.json', 'utf8'));
const snapshot = JSON.parse(await readFile('.netlify/full-collection-live.json', 'utf8'));
const slug = value => value.toLowerCase().replaceAll(' ', '-');
await mkdir(`${root}/references`, { recursive: true });
const jobs = [];
for (const product of catalog.filter(p => !p.id.startsWith('black-file'))) {
  const source = snapshot.products.find(p => p.id === product.id);
  for (const color of product.colors) {
    const variant = source?.variants.find(v => v.color === color);
    if (!variant?.image) throw new Error(`Missing garment reference: ${product.id} / ${color}`);
    jobs.push({ id: product.id, collection: product.collection, color,
      lead: color === product.defaultColor,
      source: variant.image,
      reference: `${root}/references/${product.id}-${slug(color)}.png`,
      background: `${root}/backgrounds/${slug(product.collection)}.png`,
      status: 'pending'
    });
  }
}
// Keep the full color inventory available; retrieve lead references for initial review.
for (const job of jobs.filter(j => j.lead)) {
  let bytes;
  try { bytes = await readFile(job.reference); }
  catch {
    const response = await fetch(job.source);
    if (!response.ok) throw new Error(`${response.status}: ${job.source}`);
    bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(job.reference, bytes, { flag: 'wx' });
  }
  job.referenceSHA256 = createHash('sha256').update(bytes).digest('hex');
}
await writeFile(`${root}/inventory.json`, JSON.stringify({
  source: '.netlify/full-collection-live.json (saved launch snapshot)',
  products: new Set(jobs.map(j => j.id)).size,
  colorImages: jobs.length,
  jobs
}, null, 2));
console.log(`${jobs.length} color combinations; ${jobs.filter(j => j.lead).length} lead references ready.`);
