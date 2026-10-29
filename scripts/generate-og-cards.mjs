/**
 * Generate per-project Open Graph PNGs (1200x630) from the SVG text
 * cards in scripts/og-cards/ into dist/og/ at build time.
 *
 * Why generated, not committed: the GitHub snapshot connector only
 * accepts UTF-8 text files, so binary PNGs cannot be pushed through it.
 * The SVG sources ARE committed, and this script (run first in
 * postbuild, via sharp) reproduces the PNGs deterministically on every
 * build — so a clean checkout + `npm run build` yields the same dist
 * that gets deployed, with no uncommitted binary drifting in.
 *
 * Card content is deliberately minimal: project name + the caseStudy
 * role from src/data/projects.ts, nothing else — no new claims.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const srcDir = join(root, "scripts", "og-cards");
const outDir = join(root, "dist", "og");
mkdirSync(outDir, { recursive: true });

for (const file of readdirSync(srcDir).filter((f) => f.endsWith(".svg")).sort()) {
  const svg = readFileSync(join(srcDir, file));
  const outFile = join(outDir, file.replace(/\.svg$/, ".png"));
  const info = await sharp(svg).png().toFile(outFile);
  if (info.width !== 1200 || info.height !== 630) {
    throw new Error(`generate-og-cards: ${file} rendered ${info.width}x${info.height}, expected 1200x630`);
  }
  console.log(`generate-og-cards: wrote og/${file.replace(/\.svg$/, ".png")} (${info.size} bytes)`);
}
