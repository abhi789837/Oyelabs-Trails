import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
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
            { name: "curriculum", test: /src[\\/]data[\\/]tracks[\\/]/ },
          ],
        },
      },
    },
  },
});
