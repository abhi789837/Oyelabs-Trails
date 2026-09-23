#!/usr/bin/env node
// Bundles server/src/index.ts into dist-server/index.js with esbuild.
//
// Why a bundle rather than `tsc` emit: the server and the SPA share `shared/`, and a bundle keeps
// relative imports working without adding .js extensions everywhere or shipping a second
// package.json. Type checking is a separate step (`tsc -b`), so nothing is lost.
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist-server");

/**
 * Native modules and anything that loads files relative to its own package must stay external and
 * be resolved from node_modules at runtime.
 */
const external = [
  "better-sqlite3",
  "@node-rs/argon2",
  "isolated-vm",
  "fsevents",
  // Pino resolves its transport workers by path at runtime.
  "pino",
  "pino-pretty",
  "thread-stream",
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const result = await build({
  entryPoints: [path.join(root, "server/src/index.ts")],
  outfile: path.join(outDir, "index.js"),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: true,
  minify: false,
  external,
  logLevel: "info",
  // ESM output plus a CJS dependency graph needs these shims for packages that reference
  // __dirname or call require() internally.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __pathDirname } from 'node:path';",
      "const require = __createRequire(import.meta.url);",
      "const __filename = __fileURLToPath(import.meta.url);",
      "const __dirname = __pathDirname(__filename);",
    ].join("\n"),
  },
});

if (result.errors.length) process.exit(1);

// The bundle looks for migrations next to itself (see server/src/db/index.ts).
await cp(path.join(root, "server/drizzle"), path.join(outDir, "drizzle"), { recursive: true });

// Mark the output as ESM so `node dist-server/index.js` does not need a flag.
await writeFile(path.join(outDir, "package.json"), JSON.stringify({ type: "module" }, null, 2) + "\n");

console.log(`\nserver bundled -> ${path.relative(root, outDir)}/index.js`);
