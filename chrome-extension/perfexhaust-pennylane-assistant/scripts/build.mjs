import * as esbuild from "esbuild";
import { rmSync } from "node:fs";

const OUT_DIR = "dist";
rmSync(OUT_DIR, { recursive: true, force: true });

const entryPoints = [
  { in: "src/background.ts", out: "background" },
  { in: "src/content-scripts/perfexhaust-admin.ts", out: "content-scripts/perfexhaust-admin" },
  { in: "src/content-scripts/pennylane.ts", out: "content-scripts/pennylane" },
  { in: "src/popup.ts", out: "popup" },
];

for (const { in: entry, out } of entryPoints) {
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    target: "chrome110",
    outfile: `${OUT_DIR}/${out}.js`,
    logLevel: "info",
  });
}

console.log(`\n✓ Build terminé — ${entryPoints.length} fichiers dans ${OUT_DIR}/`);
