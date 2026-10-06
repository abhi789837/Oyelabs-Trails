import { eq } from "drizzle-orm";

import { schema, type Db } from "../../db";
import { now } from "../../lib/ids";

/** app_meta read and write for the lesson modules (the tutor cap, cached solutions). */
export function readMeta(db: Db, key: string): string | null {
  return db.select({ value: schema.appMeta.value }).from(schema.appMeta).where(eq(schema.appMeta.key, key)).get()?.value ?? null;
}

export function writeMeta(db: Db, key: string, value: string): void {
  const at = now();
  db.insert(schema.appMeta)
    .values({ key, value, updatedAt: at })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: at } })
    .run();
}
