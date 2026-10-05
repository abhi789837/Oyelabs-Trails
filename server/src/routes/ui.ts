import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import {
  effectiveUiV5,
  uiV5DefaultSchema,
  uiV5PrefFrom,
  UI_V5_DEFAULT_KEY,
  updateMyUiSchema,
  uiSettingsSchema,
  type MyUiResponse,
  type UiSettings,
  type UiV5Default,
} from "../../../shared/ui";
import { requireActiveUser, requireStaff, requireSuperadmin } from "../auth/guards";
import { schema, type Db } from "../db";
import { writeAudit } from "../lib/audit";
import { parseOrThrow } from "../lib/errors";
import { now } from "../lib/ids";

/** The global default. Anything unexpected in app_meta reads as "off", the safe value. */
export function getUiV5Default(db: Db): UiV5Default {
  const raw = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, UI_V5_DEFAULT_KEY)).get()?.value;
  const parsed = uiV5DefaultSchema.safeParse(raw);
  return parsed.success ? parsed.data : "off";
}

function setUiV5Default(db: Db, value: UiV5Default): void {
  const timestamp = now();
  db.insert(schema.appMeta)
    .values({ key: UI_V5_DEFAULT_KEY, value, updatedAt: timestamp })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: timestamp } })
    .run();
}

function readPrefs(db: Db, userId: string): Record<string, unknown> {
  return db.select().from(schema.userPrefs).where(eq(schema.userPrefs.userId, userId)).get()?.data ?? {};
}

export function getUiV5Pref(db: Db, userId: string): boolean | null {
  return uiV5PrefFrom(readPrefs(db, userId));
}

/** The design this user gets, as `/api/auth/me` reports it. */
export function effectiveUiV5For(db: Db, userId: string): boolean {
  return effectiveUiV5(getUiV5Pref(db, userId), getUiV5Default(db));
}

/** Merges into the shared prefs blob, so autoplay and the other keys living there are kept. */
function setUiV5Pref(db: Db, userId: string, value: boolean | null): void {
  const data = { ...readPrefs(db, userId) };
  if (value === null) delete data.uiV5;
  else data.uiV5 = value;
  const timestamp = now();
  db.insert(schema.userPrefs)
    .values({ userId, data, updatedAt: timestamp })
    .onConflictDoUpdate({ target: schema.userPrefs.userId, set: { data, updatedAt: timestamp } })
    .run();
}

/**
 * v5 Phase 0: the switch between the old design and v5. Anyone signed in can choose for
 * themselves; only the superadmin changes the default for everyone. Both changes are audited so
 * "why does this person see the new design" has an answer.
 */
export async function registerUiRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/me/ui", async (request): Promise<MyUiResponse> => {
    const user = requireActiveUser(request);
    const v5Pref = getUiV5Pref(app.db, user.id);
    return { v5Pref, v5: effectiveUiV5(v5Pref, getUiV5Default(app.db)) };
  });

  app.put("/api/me/ui", async (request): Promise<MyUiResponse> => {
    const user = requireActiveUser(request);
    const { v5 } = parseOrThrow(updateMyUiSchema, request.body ?? {});
    const from = getUiV5Pref(app.db, user.id);
    setUiV5Pref(app.db, user.id, v5);
    writeAudit(app.db, { actorId: user.id, action: "ui.v5_toggle", targetType: "user", targetId: user.id, details: { from, to: v5 } });
    return { v5Pref: v5, v5: effectiveUiV5(v5, getUiV5Default(app.db)) };
  });

  app.get("/api/admin/settings/ui", async (request): Promise<UiSettings> => {
    requireStaff(request);
    return { v5Default: getUiV5Default(app.db) };
  });

  app.put("/api/admin/settings/ui", async (request): Promise<UiSettings> => {
    const actor = requireSuperadmin(request);
    const { v5Default } = parseOrThrow(uiSettingsSchema, request.body ?? {});
    const from = getUiV5Default(app.db);
    setUiV5Default(app.db, v5Default);
    writeAudit(app.db, { actorId: actor.id, action: "ui.v5_default", targetType: "app_meta", targetId: UI_V5_DEFAULT_KEY, details: { from, to: v5Default } });
    return { v5Default };
  });
}
