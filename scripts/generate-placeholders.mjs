/**
 * Generates the tone-on-tone SVG placeholders in `public/images/<category>/<n>.svg`.
 * Replace these files with real photography when assets are supplied — the paths
 * referenced by `src/data/products.json` can stay the same.
 *
 * Run with: node scripts/generate-placeholders.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 800;
const H = 1000;
const VARIANTS = 6;

const palettes = {
  "rice-grains": { a: "#F5EFE3", b: "#E7DCC7", line: "#B39A72" },
  oils: { a: "#F6F0DE", b: "#EBE0BE", line: "#B2963F" },
  dairy: { a: "#F4F3EE", b: "#E6E4DA", line: "#9E988A" },
  perfumes: { a: "#F7EDE9", b: "#EDDBD4", line: "#B98A79" },
  dresses: { a: "#F4EEEF", b: "#E6DADD", line: "#A98F97" },
  household: { a: "#EEF2EE", b: "#DFE6DF", line: "#8E9C8E" },
};

/** Line-art motifs, drawn inside a 0 0 400 400 box and scaled into place. */
const motifs = {
  "rice-grains": `
    <path d="M96 196c0 84 46 140 104 140s104-56 104-140Z" />
    <path d="M74 196h252" />
    <g opacity="0.75">
      <ellipse cx="168" cy="130" rx="13" ry="30" transform="rotate(-28 168 130)" />
      <ellipse cx="214" cy="106" rx="13" ry="30" transform="rotate(14 214 106)" />
      <ellipse cx="252" cy="140" rx="13" ry="30" transform="rotate(42 252 140)" />
      <ellipse cx="196" cy="164" rx="13" ry="30" transform="rotate(-6 196 164)" />
    </g>`,
  oils: `
    <path d="M170 64h60v46c0 16 8 24 20 34 26 22 40 46 40 78v120c0 20-16 36-36 36h-108c-20 0-36-16-36-36V222c0-32 14-56 40-78 12-10 20-18 20-34Z" />
    <path d="M164 60h72" />
    <path d="M148 268h104" />
    <path d="M200 306c-14 16-22 28-22 40a22 22 0 0 0 44 0c0-12-8-24-22-40Z" opacity="0.7" />`,
  dairy: `
    <path d="M148 78h104l-14 62c22 16 34 40 34 68v122c0 22-18 40-40 40h-64c-22 0-40-18-40-40V208c0-28 12-52 34-68Z" />
    <path d="M138 254h124" />
    <path d="M144 78h112" />
    <path d="M176 140h48" opacity="0.7" />`,
  perfumes: `
    <path d="M172 88h56v40h-56z" />
    <path d="M150 128h100c28 0 50 22 50 50v138c0 28-22 50-50 50H150c-28 0-50-22-50-50V178c0-28 22-50 50-50Z" />
    <path d="M228 100h34v34" opacity="0.65" />
    <path d="M262 134c22 0 34 12 34 28s-12 28-30 28" opacity="0.65" />
    <path d="M124 226h152" opacity="0.55" />`,
  dresses: `
    <path d="M200 46a15 15 0 0 1 15 15c0 11-15 13-15 25" />
    <path d="M200 86 140 112 h120 Z" opacity="0.7" />
    <path d="M200 112 150 134 132 198 166 208 178 250 128 352 q72 22 144 0 L222 250 234 208 268 198 250 134 Z" />
    <path d="M172 208h56" opacity="0.5" />
    <path d="M150 288h100" opacity="0.4" />`,
  household: `
    <path d="M96 170h208l-24 164c-3 18-18 32-36 32H156c-18 0-33-14-36-32Z" />
    <path d="M78 170h244" />
    <path d="M150 170c0-40 22-70 50-70s50 30 50 70" />
    <path d="M112 240h176" opacity="0.45" />
    <path d="M122 300h156" opacity="0.45" />
    <path d="M136 176l12 186" opacity="0.4" />
    <path d="M264 176l-12 186" opacity="0.4" />
    <path d="M200 176v186" opacity="0.4" />`,
};

const svg = (category, variant) => {
  const p = palettes[category];
  const motif = motifs[category];
  const id = `${category}-${variant}`;
  // Each variant nudges the framing so a gallery of the same product still reads as different shots.
  const scale = [1, 0.9, 1.08, 0.84, 1, 0.94][variant % VARIANTS];
  const dx = [0, 26, -22, 12, -14, 20][variant % VARIANTS];
  const dy = [0, -18, 14, 24, -26, 8][variant % VARIANTS];
  const rotate = [0, -4, 3, -2, 5, -6][variant % VARIANTS];
  const size = 520 * scale;
  const x = (W - size) / 2 + dx;
  const y = (H - size) / 2 + dy;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="${p.a}" />
      <stop offset="1" stop-color="${p.b}" />
    </linearGradient>
    <radialGradient id="glow-${id}" cx="0.5" cy="0.38" r="0.62">
      <stop offset="0" stop-color="#FFFDF9" stop-opacity="0.85" />
      <stop offset="1" stop-color="#FFFDF9" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg-${id})" />
  <rect width="${W}" height="${H}" fill="url(#glow-${id})" />
  <circle cx="${W / 2 + dx}" cy="${H * 0.46 + dy}" r="${248 * scale}" fill="#FFFDF9" opacity="0.34" />
  <g transform="translate(${x} ${y}) scale(${(size / 400).toFixed(4)}) rotate(${rotate} 200 200)"
     fill="none" stroke="${p.line}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    ${motif}
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${p.line}" stroke-opacity="0.14" />
</svg>
`;
};

let count = 0;
for (const category of Object.keys(palettes)) {
  const dir = join(root, "public", "images", category);
  mkdirSync(dir, { recursive: true });
  for (let v = 1; v <= VARIANTS; v++) {
    writeFileSync(join(dir, `${v}.svg`), svg(category, v - 1), "utf8");
    count++;
  }
}
console.log(`Wrote ${count} placeholder images.`);
