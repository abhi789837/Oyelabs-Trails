import { defineConfig } from "drizzle-kit";

/**
 * Generates SQL migrations from server/src/db/schema.ts into server/drizzle/.
 * `dbCredentials.url` is only used by introspection and `drizzle-kit studio`; the app applies
 * migrations itself at boot (see server/src/db/index.ts).
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./server/src/db/schema.ts",
  out: "./server/drizzle",
  dbCredentials: { url: "./data/oyelearn.db" },
  strict: true,
  verbose: true,
});
