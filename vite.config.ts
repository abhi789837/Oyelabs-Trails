import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
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
            { name: "motion", test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: "ui", test: /node_modules[\\/](@radix-ui|@floating-ui|lucide-react|class-variance-authority|clsx|tailwind-merge|zustand)[\\/]/ },
            // The reference-embeddability map. From v3 the manifest and every module's content
            // come from the API, so this is the only generated curriculum data left in the bundle.
            { name: "embeds", test: /src[\\/]content[\\/]embeds\.generated\.ts$/ },
          ],
        },
      },
    },
  },
});
