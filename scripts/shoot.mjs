/** Dev-only visual check: node scripts/shoot.mjs [desktop|mobile] */
import { chromium } from "playwright";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Playwright mis-detects the host arch inside our sandbox, so resolve the binary ourselves. */
function findExecutable() {
  const root = join(process.cwd(), ".playwright");
  if (!existsSync(root)) return undefined;
  for (const pkg of readdirSync(root)) {
    if (!pkg.startsWith("chromium_headless_shell")) continue;
    for (const platform of readdirSync(join(root, pkg))) {
      const candidate = join(root, pkg, platform, "chrome-headless-shell");
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

const BASE = process.env.BASE ?? "http://localhost:3100";
const mode = process.argv[2] ?? "desktop";
const viewport = mode === "mobile" ? { width: 390, height: 844 } : { width: 1360, height: 950 };

const pages = [
  ["home", "/"],
  ["shop", "/shop"],
  ["category", "/shop/perfumes"],
  ["product", "/product/amber-oud-eau-de-parfum"],
  ["cart", "/cart"],
  ["checkout", "/checkout"],
  ["about", "/about"],
  ["contact", "/contact"],
];

const out = `/tmp/shots-${mode}`;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: findExecutable() });
const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
const page = await context.newPage();

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`${page.url()} :: ${msg.text()}`);
});
page.on("pageerror", (error) => errors.push(`${page.url()} :: ${error.message}`));

// Seed a cart so /cart and /checkout render populated.
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem(
    "raj-kollections.cart.v1",
    JSON.stringify([
      { productId: "p-016", option: "50ml", quantity: 1 },
      { productId: "p-001", option: "5kg", quantity: 2 },
      { productId: "p-021", option: "M", quantity: 1 },
    ]),
  );
});

for (const [name, path] of pages) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  console.log(`shot ${name}`);
}

console.log(errors.length ? `\nCONSOLE ERRORS:\n${errors.join("\n")}` : "\nNo console errors.");
await browser.close();
