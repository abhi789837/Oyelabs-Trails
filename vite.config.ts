import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { precacheList, precacheVersion, type BuiltChunk } from "./src/v5/app/pwa/precache";

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

export default defineConfig({
  plugins: [react(), oyelearnServiceWorker()],
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
