// Scripted compositing explicitly approved by the user.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = 'output/collection-grunge';
const inventory = JSON.parse(await readFile(`${root}/inventory.json`, 'utf8'));
const backgrounds = new Map();
await mkdir(`${root}/styled`, { recursive: true });
const reports = [];
for (const job of inventory.jobs) {
  const original = await readFile(job.reference);
  const hash = createHash('sha256').update(original).digest('hex');
  if (hash !== job.referenceSHA256) throw Error(`Reference changed: ${job.reference}`);
  const { data, info } = await sharp(original).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const key = `${job.background}:${w}:${h}`;
  if (!backgrounds.has(key)) backgrounds.set(key,
    await sharp(job.background).resize(w, h).removeAlpha().raw().toBuffer());
  const background = backgrounds.get(key);
  const exterior = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;
  const add = index => {
    if (exterior[index]) return;
    const p = index * 3;
    // Only nearly pure-white pixels connected to the image boundary qualify.
    // White printing and highlights enclosed by the shirt are preserved.
    if (data[p] < 254 || data[p + 1] < 254 || data[p + 2] < 254) return;
    exterior[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { add(y * w); add(y * w + w - 1); }
  while (head < tail) {
    const index = queue[head++], x = index % w, y = Math.floor(index / w);
    if (x) add(index - 1);
    if (x < w - 1) add(index + 1);
    if (y) add(index - w);
    if (y < h - 1) add(index + w);
  }
  const ratio = tail / (w * h);
  if (ratio < 0.15 || ratio > 0.6) throw Error(`Unexpected exterior area: ${job.reference} (${ratio})`);
  const output = Buffer.from(data);
  for (let i = 0; i < exterior.length; i++) if (exterior[i]) {
    for (let c = 0; c < 3; c++) output[i * 3 + c] = background[i * 3 + c];
  }
  // Recover the coverage of antialiased boundary pixels against the original
  // white matte. Never adjust the print or the interior garment pixels.
  const distance = new Uint8Array(w * h).fill(255);
  for (let i = 0; i < exterior.length; i++) if (exterior[i]) distance[i] = 0;
  head = 0;
  while (head < tail) {
    const i = queue[head++], x = i % w, y = Math.floor(i / w);
    const d = distance[i] + 1;
    if (d > 6) continue;
    const visit = n => { if (distance[n] > d) { distance[n] = d; queue[tail++] = n; } };
    if (x) visit(i - 1);
    if (x < w - 1) visit(i + 1);
    if (y) visit(i - w);
    if (y < h - 1) visit(i + w);
  }
  let adjustedEdgePixels = 0;
  for (let i = 0; i < exterior.length; i++) if (distance[i] > 0 && distance[i] <= 4) {
    const x = i % w, y = Math.floor(i / w);
    let nearest = -1, best = Infinity;
    for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
      const xx = x + dx, yy = y + dy, dd = dx * dx + dy * dy;
      if (xx < 0 || xx >= w || yy < 0 || yy >= h || dd >= best) continue;
      const n = yy * w + xx;
      if (distance[n] >= 6) { nearest = n; best = dd; }
    }
    if (nearest < 0) continue;
    let numerator = 0, denominator = 0;
    for (let c = 0; c < 3; c++) {
      const contrast = 255 - data[nearest * 3 + c];
      numerator += (255 - data[i * 3 + c]) * contrast;
      denominator += contrast * contrast;
    }
    const alpha = Math.max(0, Math.min(1, numerator / (denominator || 1)));
    if (alpha > 0.98) continue;
    for (let c = 0; c < 3; c++) output[i * 3 + c] = Math.max(0, Math.min(255,
      Math.round(data[i * 3 + c] - (1 - alpha) * 255 + (1 - alpha) * background[i * 3 + c])));
    adjustedEdgePixels++;
  }
  const filename = job.reference.split('/').at(-1);
  const destination = `${root}/styled/${filename}`;
  await sharp(output, { raw: { width: w, height: h, channels: 3 } }).png().toFile(destination);
  const decoded = await sharp(destination).removeAlpha().raw().toBuffer();
  let preservedPixels = 0, changedProtectedPixels = 0;
  for (let i = 0; i < exterior.length; i++) if (distance[i] > 4) {
    preservedPixels++;
    if ([0, 1, 2].some(c => decoded[i * 3 + c] !== data[i * 3 + c])) changedProtectedPixels++;
  }
  if (changedProtectedPixels) throw Error(`Protected pixels changed: ${filename}`);
  job.status = 'composited';
  job.output = destination;
  reports.push({ id: job.id, color: job.color, preservedPixels, changedProtectedPixels,
    exteriorPixels: Math.round(ratio * w * h), adjustedEdgePixels, referenceSHA256: hash, output: destination });
}
await writeFile(`${root}/composite-validation.json`, JSON.stringify(reports, null, 2));
await writeFile(`${root}/inventory.json`, JSON.stringify(inventory, null, 2));
console.log(`${reports.length} composites saved; all protected source pixels preserved.`);
