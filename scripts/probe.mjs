/** Dev-only layout probe: node scripts/probe.mjs "<selector>" */
import { chromium } from "playwright";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3100";
const path = process.env.PATH_ = process.env.PATH_ ?? "/";
const selector = process.argv[2] ?? "body";

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

const browser = await chromium.launch({ executablePath: findExecutable() });
const page = await browser.newPage({ viewport: { width: 1360, height: 950 } });
await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });

const info = await page.evaluate((sel) => {
  const walk = (element, depth) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const node = {
      tag: element.tagName.toLowerCase(),
      class: (element.getAttribute("class") ?? "").slice(0, 80),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      maxW: style.maxWidth,
      display: style.display,
      aspect: style.aspectRatio,
      children: [],
    };
    if (depth > 0) {
      for (const child of element.children) node.children.push(walk(child, depth - 1));
    }
    return node;
  };
  const target = document.querySelector(sel);
  return target ? walk(target, 2) : null;
}, selector);

console.log(JSON.stringify(info, null, 2));
await browser.close();
