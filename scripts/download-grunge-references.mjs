import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const file = 'output/collection-grunge/inventory.json';
const inventory = JSON.parse(await readFile(file, 'utf8'));
let cursor = 0;
let complete = 0;
const errors = [];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < inventory.jobs.length) {
    const job = inventory.jobs[cursor++];
    try {
      let bytes;
      try { bytes = await readFile(job.reference); }
      catch {
        const response = await fetch(job.source);
        if (!response.ok) throw Error(`HTTP ${response.status}`);
        bytes = Buffer.from(await response.arrayBuffer());
        await writeFile(job.reference, bytes, { flag: 'wx' });
      }
      const hash = createHash('sha256').update(bytes).digest('hex');
      if (job.referenceSHA256 && hash !== job.referenceSHA256) throw Error('Source hash changed');
      job.referenceSHA256 = hash;
      const metadata = await sharp(bytes).metadata();
      job.referenceDimensions = [metadata.width, metadata.height];
      complete++;
      if (complete % 50 === 0) console.log(`${complete}/${inventory.jobs.length} references checked`);
    } catch (error) { errors.push({ id: job.id, color: job.color, error: error.message }); }
  }
}));
await writeFile(file, JSON.stringify(inventory, null, 2));
console.log(JSON.stringify({ complete, errors }));
if (errors.length) process.exitCode = 1;
