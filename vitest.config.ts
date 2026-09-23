import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Server and shared tests only. They run in Node against an in-memory SQLite database and
 * Fastify's `inject`, so no port is bound and tests can run in parallel.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "shared/**/*.test.ts"],
    // Each file opens its own in-memory database, so isolation is already per file.
    pool: "threads",
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
