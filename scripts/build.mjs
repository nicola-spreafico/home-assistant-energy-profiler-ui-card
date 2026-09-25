import { build } from "esbuild";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
const file = "home-assistant-energy-profiler-ui-card.js";
await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/card.js"], bundle: true, format: "esm", target: ["es2022"],
  minify: true, legalComments: "none", outfile: "dist/" + file,
  banner: { js: "/*! Energy Profiler Card v" + pkg.version + " | GPL-3.0-or-later | github.com/nicola-spreafico/home-assistant-energy-profiler-ui-card */" },
});
const content = await readFile("dist/" + file);
await writeFile("dist/SHA256SUMS", createHash("sha256").update(content).digest("hex") + "  " + file + "\n");
console.log(file + " · v" + pkg.version + " · " + content.length + " bytes");
