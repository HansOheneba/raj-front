/**
 * Dev-only: crawls the running site and asserts every <img> the pages reference
 * actually resolves, so a bad image path can't slip through unnoticed.
 *
 *   BASE=http://127.0.0.1:3210 node scripts/check-images.mjs
 */
const BASE = process.env.BASE ?? "http://127.0.0.1:3210";

/**
 * Cart and checkout build their contents from localStorage on the client, and contact
 * carries no photography, so none of them are expected to ship images in the HTML.
 */
const routes = [
  ["/", true],
  ["/shop", true],
  ["/shop/pantry", true],
  ["/shop/beauty", true],
  ["/shop/fashion", true],
  ["/shop/footwear", true],
  ["/shop/fragrance", true],
  ["/shop/household", true],
  ["/product/golden-basmati-rice", true],
  ["/product/canvas-court-sneakers", true],
  ["/product/ankara-print-a-line-dress", true],
  ["/about", true],
  ["/contact", false],
  ["/cart", false],
  ["/checkout", false],
];

let checked = 0;
const failures = [];
const seen = new Set();

for (const [route, expectsImages] of routes) {
  const response = await fetch(`${BASE}${route}`);
  if (!response.ok) {
    failures.push(`${route} -> HTTP ${response.status}`);
    continue;
  }
  const html = await response.text();

  // Next renders srcset entries pointing at /_next/image?url=...; decode back to the source path.
  const sources = new Set(
    [...html.matchAll(/\/_next\/image\?url=([^&"\\]+)/g)].map(([, encoded]) =>
      decodeURIComponent(decodeURIComponent(encoded)),
    ),
  );
  for (const match of html.matchAll(/src="(\/images\/[^"]+)"/g)) sources.add(match[1]);

  if (expectsImages && sources.size === 0) {
    failures.push(`${route} -> no images found in markup`);
  }

  for (const source of sources) {
    if (seen.has(source)) continue;
    seen.add(source);
    const asset = await fetch(`${BASE}${source}`);
    checked++;
    if (!asset.ok) failures.push(`${route} -> ${source} = HTTP ${asset.status}`);
    else if (!(asset.headers.get("content-type") ?? "").startsWith("image/")) {
      failures.push(`${route} -> ${source} = ${asset.headers.get("content-type")}`);
    }
  }
  console.log(`${route.padEnd(38)} ${sources.size} images`);
}

console.log(`\n${checked} unique assets checked across ${routes.length} routes.`);
if (failures.length) {
  console.log(`\nFAILURES (${failures.length}):\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("All images resolve.");
}
