/** Dev-only: builds /tmp/sheet-<n>.png grids so downloaded photos can be eyeballed. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const which = Number(process.argv[2] ?? 1); // 1-based image index per product
const products = JSON.parse(readFileSync(join(root, "src/data/products.json"), "utf8"));

const CELL_W = 180;
const CELL_H = 225;
const COLS = 6;
const LABEL_H = 22;

const tiles = [];
for (const product of products) {
  const file = product.images[which - 1];
  if (!file) continue;
  tiles.push({ label: product.slug, file: join(root, "public", file) });
}

const rows = Math.ceil(tiles.length / COLS);
const width = CELL_W * COLS;
const height = (CELL_H + LABEL_H) * rows;

const composites = [];
for (const [index, tile] of tiles.entries()) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  composites.push({
    input: await sharp(tile.file).resize(CELL_W, CELL_H, { fit: "cover" }).png().toBuffer(),
    left: col * CELL_W,
    top: row * (CELL_H + LABEL_H),
  });
  const label = Buffer.from(
    `<svg width="${CELL_W}" height="${LABEL_H}"><rect width="100%" height="100%" fill="#fff"/>` +
      `<text x="4" y="15" font-family="monospace" font-size="11" fill="#111">${tile.label.slice(0, 30)}</text></svg>`,
  );
  composites.push({
    input: await sharp(label).png().toBuffer(),
    left: col * CELL_W,
    top: row * (CELL_H + LABEL_H) + CELL_H,
  });
}

await sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
  .composite(composites)
  .png()
  .toFile(`/tmp/sheet-${which}.png`);

console.log(`/tmp/sheet-${which}.png (${tiles.length} tiles)`);
