/** Dev-only interaction check: node scripts/verify.mjs */
import { chromium } from "playwright";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3100";
const out = "/tmp/shots-flow";
mkdirSync(out, { recursive: true });

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

const results = [];
const check = (name, pass, detail = "") =>
  results.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);

const browser = await chromium.launch({ executablePath: findExecutable() });
const context = await browser.newContext({ viewport: { width: 1360, height: 950 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));

const badge = () =>
  page.locator('header a[href="/cart"] span').first().textContent().catch(() => null);

// 1. Quick-add from a home page card updates the navbar badge.
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const card = page.locator("article").first();
await card.hover();
await card.getByRole("button", { name: /Add .* to cart/ }).click();
await page.waitForTimeout(400);
check("quick add updates cart badge", (await badge()) === "1", `badge=${await badge()}`);

// 2. Search dialog finds a product by name.
await page.getByRole("button", { name: "Search" }).click();
await page.getByPlaceholder(/Search rice/).fill("oud");
await page.waitForTimeout(300);
const hits = await page.locator('div[role="dialog"] ul li').count();
check("search returns results for 'oud'", hits > 0, `${hits} hits`);
await page.screenshot({ path: `${out}/search.png` });
await page.keyboard.press("Escape");

// 3. Shop filters narrow the grid and write to the URL.
await page.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
const totalCount = await page.locator("article").count();
await page.getByText("Perfumes", { exact: true }).first().click();
await page.waitForTimeout(500);
const filtered = await page.locator("article").count();
check(
  "category filter narrows results",
  filtered === 5 && filtered < totalCount,
  `${totalCount} → ${filtered}`,
);
check("filter is reflected in the URL", page.url().includes("category=perfumes"), page.url());
await page.screenshot({ path: `${out}/shop-filtered.png`, fullPage: true });

// 4. Sorting by price ascending actually orders the grid.
await page.selectOption('select[aria-label="Sort products"]', "price-asc");
await page.waitForTimeout(500);
const prices = await page.locator("article").evaluateAll((nodes) =>
  nodes.map((node) => {
    const text = node.querySelector("span.tabular-nums")?.textContent ?? "0";
    return Number(text.replace(/[^\d.]/g, ""));
  }),
);
const ascending = prices.every((value, index) => index === 0 || prices[index - 1] <= value);
check("price sort is ascending", ascending, prices.join(", "));

// 5. Empty state appears when filters exclude everything.
await page.goto(`${BASE}/shop?category=dairy&sale=1`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const empty = await page.getByText("Nothing on this shelf").isVisible();
check("empty state renders", empty);

// 6. Product page: pick an option, add to cart, verify the cart line.
await page.goto(`${BASE}/product/ivory-linen-wrap-dress`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "L", exact: true }).click();
await page.getByRole("button", { name: /Add to cart/ }).click();
await page.waitForTimeout(400);
await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
const hasOption = await page.getByText("L", { exact: true }).first().isVisible();
check("selected size reaches the cart", hasOption);
await page.screenshot({ path: `${out}/cart.png`, fullPage: true });

// 7. Quantity stepper updates the line total.
const lineTotal = page.locator("li p.tabular-nums").first();
const before = await lineTotal.textContent();
await page.getByRole("button", { name: /Increase quantity/ }).first().click();
await page.waitForTimeout(300);
const after = await lineTotal.textContent();
check("stepper changes line total", before !== after, `${before} → ${after}`);

// 8. Checkout submits and confirms.
await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
await page.fill("#email", "ama@example.com");
await page.fill("#firstName", "Ama");
await page.fill("#lastName", "Mensah");
await page.fill("#phone", "+233200000000");
await page.fill("#address", "24 Ring Road East");
await page.fill("#city", "Accra");
await page.getByRole("button", { name: /Place order/ }).click();
await page.waitForTimeout(700);
check("checkout shows confirmation", await page.getByText("Order received").isVisible());
check("cart is emptied after checkout", (await badge()) === null, `badge=${await badge()}`);
await page.screenshot({ path: `${out}/order-received.png` });

// 9. Mobile: nav menu and filter drawer open.
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const small = await mobile.newPage();
await small.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
await small.getByRole("button", { name: "Open menu" }).click();
await small.waitForTimeout(350);
check(
  "mobile menu opens",
  await small.getByRole("banner").getByRole("link", { name: "All products" }).isVisible(),
);
await small.screenshot({ path: `${out}/mobile-menu.png` });
await small.getByRole("button", { name: "Close menu" }).click();
await small.getByRole("button", { name: "Filter" }).click();
await small.waitForTimeout(400);
check(
  "mobile filter drawer opens",
  await small.getByRole("button", { name: "Availability" }).last().isVisible(),
);
await small.screenshot({ path: `${out}/mobile-filters.png` });

console.log(results.join("\n"));
console.log(errors.length ? `\nERRORS:\n${[...new Set(errors)].join("\n")}` : "\nNo page errors.");
await browser.close();
