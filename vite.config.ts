import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { precacheList, precacheVersion, type BuiltChunk } from "./src/v5/app/pwa/precache";
import { BOOT_FUNCTIONS } from "./src/v5/app/routePlan";

/**
 * v5 Phase 8: writes dist/sw.js from src/v5/app/pwa/sw.template.js with this build's precache list
 * and version (docs/v5/DECISIONS.md, "Phase 8 — app-wide"). Build only: no service worker in dev.
 * Hand-written rather than vite-plugin-pwa: the worker needs custom rules (the offline-only
 * /api/auth/me copy, wiping data on sign-out) and only a small precache list, so Workbox would add
 * weight and indirection without removing any of our own code.
 */
function oyelearnServiceWorker(): Plugin {
  return {
    name: "oyelearn-service-worker",
    apply: "build",
    writeBundle(options, bundle) {
      const outDir = options.dir ?? path.resolve("dist");
      const chunks: BuiltChunk[] = [];
      const assets: string[] = [];
      for (const out of Object.values(bundle)) {
        if (out.type === "chunk") chunks.push({ fileName: out.fileName, facadeModuleId: out.facadeModuleId, isEntry: out.isEntry, imports: out.imports });
        else assets.push(out.fileName);
      }
      const urls = precacheList(chunks, assets);
      const indexHtml = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
      const version = precacheVersion(urls, indexHtml);
      const template = fs.readFileSync(fileURLToPath(new URL("./src/v5/app/pwa/sw.template.js", import.meta.url)), "utf8");
      const sw = template
        .replace('"__OYELEARN_SW_VERSION__"', JSON.stringify(version))
        .replace("/* __OYELEARN_PRECACHE__ */ []", JSON.stringify(urls, null, 2));
      if (sw === template) throw new Error("sw.template.js placeholders not found");
      fs.writeFileSync(path.join(outDir, "sw.js"), sw);
    },
  };
}

/**
 * Phase 9 performance: an inline start-up script in index.html (src/v5/app/routePlan.ts
 * `bootPrefetch`). On a device that last opened v5 (or a staff `?ui=v5`), while the HTML is still
 * parsing, it:
 * - starts the route's queries (Today's, Review's, a lesson's, the admin inbox's) in parallel with
 *   the JavaScript download, instead of after it;
 * - for a lesson, warms the video poster and the module content as soon as their inputs arrive;
 * - preloads v5's fonts: Geist (body text) and Sora 600 (headings, Today's hero among them), latin
 *   only. Text in a web font that's still downloading isn't painted for a moment.
 * The old UI never gets any of it. The functions are inlined from routePlan.ts (one copy of the
 * rules); the font files are found in the bundle by name. server/src/lib/csp.ts hashes every inline
 * script in dist/index.html, so the CSP allows it.
 */
function bootPrefetchScript(): Plugin {
  const FONTS = [/(^|\/)geist-latin-wght-normal-[\w-]+\.woff2$/, /(^|\/)sora-latin-600-normal-[\w-]+\.woff2$/];
  return {
    name: "oyelearn-boot-prefetch",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const files = Object.keys(ctx.bundle ?? {});
        const fonts = FONTS.map((re) => {
          const hit = files.find((f) => re.test(f));
          if (!hit) throw new Error(`bootPrefetchScript: no font matching ${re} in the bundle`);
          return `/${hit}`;
        });
        const source = BOOT_FUNCTIONS.map((fn) => fn.toString()).join("\n");
        if (/__name|__vite|import\(|require\(/.test(source)) throw new Error("bootPrefetchScript: routePlan.ts compiled to code that can't run inline");
        const script = `<script>(function(){\n${source}\nbootPrefetch(${JSON.stringify(fonts)});\n})();</script>`;
        // Before the module script and the stylesheet: an inline script after a stylesheet waits for it.
        const at = html.indexOf('<script type="module"');
        return at === -1 ? html.replace("</head>", `${script}\n</head>`) : `${html.slice(0, at)}${script}\n    ${html.slice(at)}`;
      },
    },
  };
}

/**
 * Phase 9 performance (docs/v5/QUALITY.md, fix 8): writes a `.br` and a `.gz` next to every text
 * asset, so the Node server can send them compressed on its own (`@fastify/static`
 * `preCompressed`), without a proxy. Behind Caddy nothing changes: `encode` leaves a response that
 * already has a Content-Encoding alone. Build only; files under 1 KB, and copies that aren't smaller,
 * are skipped.
 */
function precompressAssets(): Plugin {
  return {
    name: "oyelearn-precompress",
    apply: "build",
    writeBundle(options, bundle) {
      const outDir = options.dir ?? path.resolve("dist");
      for (const name of Object.keys(bundle)) {
        if (!/^assets\/.+\.(js|css|svg|json|txt|map)$/.test(name)) continue;
        const file = path.join(outDir, name);
        const raw = fs.readFileSync(file);
        if (raw.length < 1024) continue;
        const br = zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } });
        const gz = zlib.gzipSync(raw, { level: 9 });
        if (br.length < raw.length) fs.writeFileSync(`${file}.br`, br);
        if (gz.length < raw.length) fs.writeFileSync(`${file}.gz`, gz);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), oyelearnServiceWorker(), bootPrefetchScript(), precompressAssets()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Same-origin in production (one Node process serves both). In dev, Vite proxies to the API
    // so the session cookie is first-party here too and there is no CORS anywhere.
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.PORT ?? 8787}`,
        changeOrigin: false,
        // Server-sent events for the admin live feed must not be buffered.
        ws: false,
      },
    },
  },
  build: {
    // The only chunk above the default 500 kB is @react-pdf/renderer (~1.2 MB), which is
    // loaded on demand when someone clicks "Download PDF", never on page load.
    chunkSizeWarningLimit: 1300,
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks cache across deploys; app code changes more often.
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|cookie|set-cookie-parser)[\\/]/ },
            // v5 (P1): no forced `motion` or `ui` groups. Forcing them put every Radix primitive, every
            // Lucide icon used anywhere and all of Motion into the first download of every route
            // (about 100 KB gzipped). Rolldown now splits them by what each route actually imports.
            // The reference-embeddability map. From v3 the manifest and every module's content
            // come from the API, so this is the only generated curriculum data left in the bundle.
            { name: "embeds", test: /src[\\/]content[\\/]embeds\.generated\.ts$/ },
          ],
        },
      },
    },
  },
});
