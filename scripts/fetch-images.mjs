/**
 * Downloads real product photography from Openverse, crops it to the aspect ratios
 * the UI expects, and rewrites the image paths in products.json.
 *
 *   node scripts/fetch-images.mjs                   # only fetch what's missing
 *   node scripts/fetch-images.mjs --force           # refetch everything
 *   node scripts/fetch-images.mjs --only=<targets>  # refetch specific images, where a
 *       target is a product slug, `category:<slug>` or `editorial:<name>`
 *
 * Only curated photo libraries are queried (StockSnap, the WordPress Photo Directory
 * and Nappy). Openverse's larger sources — Flickr, Wikimedia, Rawpixel — are mostly
 * amateur snapshots, museum scans and transparent clip-art, none of which suit a
 * boutique storefront.
 *
 * Attribution for every downloaded file is written to public/images/CREDITS.md.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const force = process.argv.includes("--force");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const only = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",")) : null;
/** True when this target should be re-downloaded even though its file already exists. */
const targeted = (key) => (only ? only.has(key) : force);
const UA = "raj-kollections-dev/1.0 (storefront demo asset fetcher)";
const LICENSES = "cc0,pdm,by";
/** Curated photo libraries — best aesthetics, but only ~85k images between them. */
const CURATED = "stocksnap,wordpress,nappy";
/** Fallback with encyclopedic coverage of specific goods; plainer, but on-topic. */
const BROAD = "wikimedia";
const PAGES_PER_QUERY = 3;
const IMAGES_PER_PRODUCT = 3;

/** Commons holds plenty of non-photographic media that has no place in a catalogue. */
const NON_PHOTO = /engraving|drawing|illustration|painting|sketch|diagram|map |logo|icon|coat of arms|stamp|banknote|chart|poster|advertisement|patent|manuscript|\.svg|\.tif|\.pdf|screenshot/i;

/**
 * Search terms per product, most specific first. These stay deliberately on-topic —
 * broadening them pulls in pretty but wrong photos, so scarcity is handled by falling
 * back to a different source rather than a vaguer term.
 */
const productQueries = {
  "golden-basmati-rice": ["basmati rice", "white rice grains"],
  "jasmine-fragrant-rice": ["jasmine rice", "steamed rice bowl"],
  "perfumed-long-grain-rice": ["long grain rice", "rice sack"],
  "brown-long-grain-rice": ["brown rice", "wholegrain rice"],
  "pearl-couscous-grain-blend": ["couscous", "pearl couscous"],
  "cold-pressed-groundnut-oil": ["peanut oil", "groundnut oil bottle"],
  "extra-virgin-olive-oil": ["olive oil bottle", "extra virgin olive oil"],
  "pure-sunflower-oil": ["sunflower oil", "sunflower oil bottle"],
  "coconut-cooking-oil": ["coconut oil", "coconut oil jar"],
  "palm-kernel-oil": ["palm oil", "palm kernel oil"],
  "full-cream-milk-powder": ["milk powder", "powdered milk"],
  "evaporated-milk-six-pack": ["evaporated milk", "condensed milk can"],
  "salted-butter-block": ["butter block", "salted butter"],
  "greek-style-yoghurt": ["greek yogurt", "yoghurt bowl"],
  "mature-cheddar-wedge": ["cheddar cheese", "cheese wedge"],
  "amber-oud-eau-de-parfum": ["perfume bottle", "eau de parfum bottle"],
  "rose-nectar-eau-de-toilette": ["rose perfume", "perfume bottle rose"],
  "velvet-musk-body-mist": ["body mist spray", "perfume atomiser"],
  "saffron-cedar-attar-oil": ["attar perfume oil", "perfume oil vial"],
  "ivory-jasmine-eau-de-parfum": ["jasmine perfume", "white perfume bottle"],
  "ivory-linen-wrap-dress": ["white linen dress", "ivory dress"],
  "terracotta-midi-shirt-dress": ["shirt dress", "midi dress"],
  "ankara-print-a-line-dress": ["ankara dress", "african print dress"],
  "pleated-chiffon-maxi-dress": ["chiffon maxi dress", "pleated gown"],
  "cotton-poplin-day-dress": ["cotton day dress", "poplin dress"],
  "woven-storage-basket": ["woven storage basket", "wicker basket"],
  "lavender-laundry-soap-bar": ["lavender soap bar", "handmade soap bar"],
  "ceramic-serving-bowl-set": ["ceramic serving bowl", "stoneware bowls"],
  "bamboo-kitchen-utensil-set": ["wooden kitchen utensils", "bamboo utensils"],
  "linen-tea-towels": ["tea towel", "linen kitchen towel"],
  "structured-shoulder-bag": ["leather shoulder bag", "black handbag"],
  "canvas-court-sneakers": ["white sneakers", "canvas sneakers"],
  "pool-slides": ["pool slides", "black sandals"],
  "leather-loafer": ["leather loafers", "black loafers"],
};

/**
 * Broad per-category terms. Used for the category tiles and as a top-up pool when a
 * product's own terms run dry — several of these shelves have only a handful of
 * matching photos in the curated corpus.
 */
const categoryQueries = {
  "rice-grains": ["rice grains", "rice", "grain harvest", "cereal grains", "pilaf", "risotto"],
  oils: ["olive oil bottle", "oil bottle glass", "olives branch", "cooking oil", "glass bottle kitchen"],
  dairy: ["milk", "dairy products", "cheese", "butter", "yogurt", "milk bottle"],
  perfumes: [
    "perfume bottle",
    "perfume",
    "fragrance",
    "cosmetics bottle",
    "essential oil",
    "beauty products",
    "skincare bottle",
    "spa still life",
    "glass bottle",
    "makeup",
  ],
  dresses: ["clothing rack", "boutique clothes", "fashion clothing", "dress", "summer fashion"],
  household: ["woven basket", "home interior", "pottery", "kitchen utensils", "linen textile", "soap"],
};

/**
 * Lifestyle slots on the home and about pages. Dimensions match the aspect ratio each
 * slot renders at; generic-but-atmospheric photography is the right fit here.
 */
const editorial = [
  { name: "hero-main", queries: ["boutique interior", "shop interior", "flowers still life"], w: 900, h: 1125 },
  { name: "hero-pantry", queries: ["rice grains", "pantry jars"], w: 900, h: 900 },
  { name: "hero-dress", queries: ["linen dress", "woman dress"], w: 900, h: 1125 },
  { name: "story-basket", queries: ["woven basket", "wicker basket"], w: 900, h: 900 },
  { name: "story-oil", queries: ["olive oil bottle", "kitchen still life"], w: 900, h: 900 },
  { name: "about-counter", queries: ["grain market", "market stall food"], w: 900, h: 1125 },
  { name: "about-perfume", queries: ["perfume bottle glass", "glass bottles"], w: 900, h: 1125 },
  { name: "about-store", queries: ["baskets shop", "market stall textiles"], w: 1200, h: 900 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The manifest is the durable record: it survives partial re-runs, keeps CREDITS.md
 * in sync, and stops an incremental run from re-downloading a photo another product
 * already uses.
 */
const manifestPath = join(root, "public/images/photo-manifest.json");
const stored = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : [];
const manifest = new Map(
  (Array.isArray(stored) ? stored : []).map((entry) => [entry.file, entry]),
);
const usedIds = new Set([...manifest.values()].map((entry) => entry.id).filter(Boolean));

/**
 * Openverse ids alone can't prevent repeats — a manifest recovered from CREDITS.md has
 * none, and the same photo can be indexed twice. Comparing the bytes we actually wrote
 * is the reliable guard.
 */
const usedHashes = new Set();
const hash = (buffer) => createHash("md5").update(buffer).digest("hex");
for (const dir of ["products", "categories", "editorial"]) {
  const abs = join(root, "public/images", dir);
  if (!existsSync(abs)) continue;
  for (const file of readdirSync(abs).filter((name) => name.endsWith(".jpg"))) {
    usedHashes.add(hash(readFileSync(join(abs, file))));
  }
}

async function search(query, page, sources) {
  const url =
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
    // page_size is capped at 20 for anonymous API use.
    `&license=${LICENSES}&source=${sources}&page_size=20&page=${page}&mature=false`;
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (response.status === 404) return []; // past the last page
  if (!response.ok) throw new Error(`search "${query}" p${page} -> ${response.status}`);
  const body = await response.json();
  return (body.results ?? []).filter(
    (item) => !NON_PHOTO.test(`${item.title ?? ""} ${item.url ?? ""}`),
  );
}

async function download(candidate) {
  const response = await fetch(candidate.url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`http ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) throw new Error("undecodable");
  if (meta.width < 700 || meta.height < 700) throw new Error(`small ${meta.width}x${meta.height}`);
  // Transparent PNGs are cut-out clip-art, not photography.
  if (meta.hasAlpha && meta.channels === 4) throw new Error("has alpha");
  return buffer;
}

/** Deterministic, so the same source photo always yields byte-identical output. */
const render = (buffer, width, height) =>
  sharp(buffer)
    .rotate()
    // "attention" crops toward the most visually salient region — keeps the subject in frame.
    .resize(width, height, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();

/**
 * Walks queries then pages, rendering up to `count` usable images. Returns fewer than
 * asked for rather than throwing, so one thin shelf can't abort the whole run.
 */
async function collect(queries, count, width, height, sources = CURATED) {
  const picked = [];
  for (const query of queries) {
    for (let page = 1; page <= PAGES_PER_QUERY; page++) {
      if (picked.length >= count) return picked;
      let candidates;
      try {
        candidates = await search(query, page, sources);
      } catch (error) {
        console.log(`    ${error.message}`);
        break;
      }
      if (candidates.length === 0) break;

      for (const candidate of candidates) {
        if (picked.length >= count) return picked;
        if (!candidate.url || usedIds.has(candidate.id)) continue;
        try {
          const output = await render(await download(candidate), width, height);
          const digest = hash(output);
          if (usedHashes.has(digest)) continue;
          usedHashes.add(digest);
          usedIds.add(candidate.id);
          picked.push({ candidate, output });
        } catch {
          /* try the next candidate */
        }
      }
    }
  }
  return picked;
}

function save(buffer, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buffer);
}

const record = (file, candidate) =>
  manifest.set(file, {
    file,
    id: candidate.id,
    title: (candidate.title ?? "Untitled").replace(/\|/g, "-").slice(0, 70),
    creator: (candidate.creator ?? "Unknown").replace(/\|/g, "-").slice(0, 40),
    license: `${(candidate.license ?? "").toUpperCase()} ${candidate.license_version ?? ""}`.trim(),
    licenseUrl: candidate.license_url ?? "",
    source: candidate.source ?? "",
    page: candidate.foreign_landing_url ?? "",
  });

// ---------------------------------------------------------------- products

const productsPath = join(root, "src/data/products.json");
const products = JSON.parse(readFileSync(productsPath, "utf8"));

const shortfalls = [];

for (const product of products) {
  const queries = productQueries[product.slug];
  if (!queries) {
    console.log(`! no query for ${product.slug}`);
    continue;
  }

  const paths = Array.from(
    { length: IMAGES_PER_PRODUCT },
    (_, index) => `/images/products/${product.slug}-${index + 1}.jpg`,
  );

  const wanted = targeted(product.slug);
  if (!wanted && paths.every((path) => existsSync(join(root, "public", path)))) {
    product.imageUrls = paths;
    console.log(`= ${product.slug} (cached)`);
    continue;
  }

  // Refetching means the old files no longer occupy their hashes.
  if (wanted) {
    for (const path of paths) {
      const abs = join(root, "public", path);
      if (existsSync(abs)) usedHashes.delete(hash(readFileSync(abs)));
    }
  }

  // Relevance first: exhaust the product's own terms on both sources before
  // settling for a generic category photo.
  const picked = await collect(queries, IMAGES_PER_PRODUCT, 900, 1125);
  const short = () => IMAGES_PER_PRODUCT - picked.length;
  if (short() > 0) {
    picked.push(...(await collect(queries, short(), 900, 1125, BROAD)));
  }
  if (short() > 0) {
    const pool = categoryQueries[product.category] ?? [];
    picked.push(...(await collect(pool, short(), 900, 1125)));
  }

  if (picked.length === 0) {
    shortfalls.push(`${product.slug}: no images found`);
    continue;
  }

  for (const [index, { candidate, output }] of picked.entries()) {
    save(output, join(root, "public", paths[index]));
    record(paths[index], candidate);
  }
  // Only claim the paths we actually wrote.
  product.imageUrls = paths.slice(0, picked.length);
  if (picked.length < IMAGES_PER_PRODUCT) {
    shortfalls.push(`${product.slug}: ${picked.length}/${IMAGES_PER_PRODUCT} images`);
  }
  console.log(`↓ ${product.slug} — ${picked.map((p) => p.candidate.source).join(", ")}`);
  await sleep(200);
}

writeFileSync(productsPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");

// -------------------------------------------------------------- categories

for (const [slug, queries] of Object.entries(categoryQueries)) {
  const path = `/images/categories/${slug}.jpg`;
  const abs = join(root, "public", path);
  if (!targeted(`category:${slug}`) && existsSync(abs)) {
    console.log(`= category ${slug} (cached)`);
    continue;
  }
  if (existsSync(abs)) usedHashes.delete(hash(readFileSync(abs)));
  const found = await collect(queries, 1, 900, 900);
  if (found.length === 0) {
    shortfalls.push(`category ${slug}: no image found`);
    continue;
  }
  const [{ candidate, output }] = found;
  save(output, join(root, "public", path));
  record(path, candidate);
  console.log(`↓ category ${slug} — ${candidate.source}`);
  await sleep(200);
}

// --------------------------------------------------------------- editorial

for (const { name, queries, w, h } of editorial) {
  const path = `/images/editorial/${name}.jpg`;
  const abs = join(root, "public", path);
  if (!targeted(`editorial:${name}`) && existsSync(abs)) {
    console.log(`= editorial ${name} (cached)`);
    continue;
  }
  if (existsSync(abs)) usedHashes.delete(hash(readFileSync(abs)));
  const found = await collect(queries, 1, w, h);
  if (found.length === 0) {
    shortfalls.push(`editorial ${name}: no image found`);
    continue;
  }
  const [{ candidate, output }] = found;
  save(output, join(root, "public", path));
  record(path, candidate);
  console.log(`↓ editorial ${name} — ${candidate.source}`);
  await sleep(200);
}

// ----------------------------------------------------------------- credits

// Drop entries whose file has since been deleted, then persist both formats.
for (const [file] of manifest) {
  if (!existsSync(join(root, "public", file))) manifest.delete(file);
}

const entries = [...manifest.values()].sort((a, b) => a.file.localeCompare(b.file));
writeFileSync(manifestPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

writeFileSync(
  join(root, "public/images/CREDITS.md"),
  [
    "# Image credits",
    "",
    "Photography sourced via [Openverse](https://openverse.org) from StockSnap, the",
    "WordPress Photo Directory and Nappy, under Creative Commons / public domain terms.",
    "",
    "Replace these files with your own product shots before going live — keep the",
    "filenames and no code changes are needed. Regenerate with:",
    "",
    "```bash",
    "node scripts/fetch-images.mjs --force",
    "```",
    "",
    "| File | Title | Creator | License |",
    "| --- | --- | --- | --- |",
    ...entries.map(
      (entry) =>
        `| \`${entry.file}\` | ${entry.title} | ${entry.creator} | ` +
        `${entry.licenseUrl ? `[${entry.license}](${entry.licenseUrl})` : entry.license} |`,
    ),
    "",
  ].join("\n"),
  "utf8",
);

console.log(`\nDone. ${entries.length} images credited.`);
if (shortfalls.length) console.log(`\nShortfalls:\n${shortfalls.join("\n")}`);
