import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Server, shared and pure-client tests. They run in Node against an in-memory SQLite database and
 * Fastify's `inject`, so no port is bound and tests can run in parallel.
 *
 * `src/**` is included for logic that can be tested without a DOM -- there is no jsdom here, so a
 * client test has to exercise a pure function rather than render a component.
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
    include: ["server/**/*.test.ts", "shared/**/*.test.ts", "src/**/*.test.ts"],
    // Each file opens its own in-memory database, so isolation is already per file.
    pool: "threads",
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
