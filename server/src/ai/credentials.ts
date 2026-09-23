import { desc, eq } from "drizzle-orm";

import type { CredentialStatus, ProviderId } from "../../../shared/enums";
import { hint, open, seal } from "../crypto/secretBox";
import { schema, type Db } from "../db";
import type { Env } from "../env";
import { newId, now } from "../lib/ids";

export interface StoredCredential {
  id: string;
  provider: ProviderId;
  label: string;
  secretHint: string;
  status: CredentialStatus;
  lastVerifiedAt: number | null;
  lastError: string | null;
  sharedUseAcknowledged: boolean;
  createdAt: number;
}

export interface AiSettings {
  activeCredentialId: string | null;
  modelGeneration: string | null;
  modelEvaluation: string | null;
  modelCritic: string | null;
  monthlyBudgetNote: string | null;
  updatedAt: number;
}

const SETTINGS_ID = "singleton";

/** Everything an admin may see about a credential. The secret is never part of it. */
function toStored(row: typeof schema.aiCredentials.$inferSelect): StoredCredential {
  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    secretHint: row.secretHint,
    status: row.status,
    lastVerifiedAt: row.lastVerifiedAt,
    lastError: row.lastError,
    sharedUseAcknowledged: row.sharedUseAcknowledged,
    createdAt: row.createdAt,
  };
}

export function listCredentials(db: Db): StoredCredential[] {
  return db.select().from(schema.aiCredentials).orderBy(desc(schema.aiCredentials.createdAt)).all().map(toStored);
}

export function getCredential(db: Db, id: string): StoredCredential | null {
  const row = db.select().from(schema.aiCredentials).where(eq(schema.aiCredentials.id, id)).get();
  return row ? toStored(row) : null;
}

export interface CreateCredentialInput {
  provider: ProviderId;
  label: string;
  secret: string;
  sharedUseAcknowledged: boolean;
  createdBy: string;
}

export function createCredential(db: Db, env: Env, input: CreateCredentialInput): StoredCredential {
  const sealed = seal(input.secret, env.masterKey);
  const id = newId();

  db.insert(schema.aiCredentials)
    .values({
      id,
      provider: input.provider,
      label: input.label,
      secretCiphertext: sealed.ciphertext,
      secretIv: sealed.iv,
      secretTag: sealed.tag,
      secretHint: hint(input.secret),
      status: "unverified",
      sharedUseAcknowledged: input.sharedUseAcknowledged,
      createdBy: input.createdBy,
      createdAt: now(),
    })
    .run();

  return getCredential(db, id)!;
}

/**
 * Decrypts a credential for use. The plaintext should live no longer than the call that needs it
 * and must never be returned from a route.
 */
export function revealSecret(db: Db, env: Env, id: string): string | null {
  const row = db.select().from(schema.aiCredentials).where(eq(schema.aiCredentials.id, id)).get();
  if (!row) return null;
  return open({ ciphertext: row.secretCiphertext, iv: row.secretIv, tag: row.secretTag }, env.masterKey);
}

export function setCredentialStatus(db: Db, id: string, status: CredentialStatus, error?: string | null): void {
  db.update(schema.aiCredentials)
    .set({
      status,
      lastError: error ?? null,
      ...(status === "verified" ? { lastVerifiedAt: now() } : {}),
    })
    .where(eq(schema.aiCredentials.id, id))
    .run();
}

export function deleteCredential(db: Db, id: string): void {
  // The settings row references this, with ON DELETE SET NULL, so the active credential simply
  // becomes "none" rather than dangling.
  db.delete(schema.aiCredentials).where(eq(schema.aiCredentials.id, id)).run();
}

export function getSettings(db: Db): AiSettings {
  const row = db.select().from(schema.aiSettings).where(eq(schema.aiSettings.id, SETTINGS_ID)).get();
  if (!row) {
    return {
      activeCredentialId: null,
      modelGeneration: null,
      modelEvaluation: null,
      modelCritic: null,
      monthlyBudgetNote: null,
      updatedAt: 0,
    };
  }
  return {
    activeCredentialId: row.activeCredentialId,
    modelGeneration: row.modelGeneration,
    modelEvaluation: row.modelEvaluation,
    modelCritic: row.modelCritic,
    monthlyBudgetNote: row.monthlyBudgetNote,
    updatedAt: row.updatedAt,
  };
}

export function updateSettings(db: Db, patch: Partial<Omit<AiSettings, "updatedAt">>): AiSettings {
  const current = getSettings(db);
  const next = { ...current, ...patch, updatedAt: now() };

  db.insert(schema.aiSettings)
    .values({ id: SETTINGS_ID, ...next })
    .onConflictDoUpdate({ target: schema.aiSettings.id, set: next })
    .run();

  return next;
}
