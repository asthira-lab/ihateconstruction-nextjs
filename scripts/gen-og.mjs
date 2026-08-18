// Generates public/og-default.png and public/rebar-calculator-og.png (1200x630).
// Run: node scripts/gen-og.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdir } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public");

const bg = "#0a0a0a";
const fg = "#ffffff";
const muted = "#a3a3a3";
const accent = "#f5f5f4";

function card(title, subtitle) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${bg}"/>
    <rect x="0" y="0" width="1200" height="6" fill="${accent}"/>
    <text x="72" y="120" font-family="Helvetica, Arial, sans-serif" font-size="28" letter-spacing="6" fill="${muted}">IHATECONSTRUCTION.CO</text>
    <text x="72" y="320" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="64" fill="${fg}">${title}</text>
    <text x="72" y="396" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="${muted}">${subtitle}</text>
    <text x="72" y="560" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="${muted}">Free construction calculators for contractors</text>
  </svg>`;
}

const jobs = [
  {
    file: "og-default.png",
    svg: card(
      "Free Construction Calculators",
      "Cement &#183; Concrete &#183; Concrete Volume &#183; Brick &#183; Steel &#183; Rebar &#183; Paint &#183; Tile",
    ),
  },
  {
    file: "rebar-calculator-og.png",
    svg: card(
      "Rebar Calculator",
      "Slab &#183; Footing &#183; Wall &#183; Foundation &#8212; length, pieces &amp; weight",
    ),
  },
  {
    file: "concrete-volume-calculator-og.png",
    svg: card(
      "Concrete Volume Calculator",
      "Cubic yards &#183; Cubic feet &#183; Cubic metres &#8212; slab, footing &amp; post hole",
    ),
  },
  {
    file: "concrete-slab-calculator-og.png",
    svg: card(
      "Concrete Slab Calculator",
      "Cubic yards &#183; Premix bags &#183; Ready-mix trucks &#8212; length, width &amp; thickness",
    ),
  },
];

await mkdir(outDir, { recursive: true });
for (const job of jobs) {
  const out = path.join(outDir, job.file);
  await sharp(Buffer.from(job.svg)).png().toFile(out);
  console.log("wrote", out);
}