/**
 * Environment configuration. Parsed once at boot and shared.
 *
 * Production refuses to start without the secrets it needs (brief §15). Development fills them
 * with values derived from the data directory so `npm run dev` works on a fresh clone with no
 * setup, while still using the same code paths as production.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { z } from "zod";

const rawSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default("127.0.0.1"),
  DATA_DIR: z.string().default("./data"),
  PUBLIC_ORIGIN: z.string().default("http://localhost:5173"),
  /** 32 bytes, base64 or hex, for the AES-256-GCM secret box. */
  APP_MASTER_KEY: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  SUPERADMIN_USERNAME: z.string().default("admin"),
  SUPERADMIN_PASSWORD: z.string().optional(),
  SNAPSHOT_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
  /** Dev-only escape hatch for the code sandbox on Windows, where isolated-vm may not build. */
  DEV_UNSAFE_RUNNER: z.coerce.boolean().default(false),
  /** Where the SPA build lives, served in production. */
  CLIENT_DIST: z.string().default("./dist"),
  /** Where build-server-content.mjs writes module JSON. */
  SERVER_CONTENT_DIR: z.string().default("./server/content"),
});

export type Env = {
  nodeEnv: "development" | "test" | "production";
  isProduction: boolean;
  isTest: boolean;
  port: number;
  host: string;
  dataDir: string;
  publicOrigin: string;
  masterKey: Buffer;
  sessionSecret: string;
  superadminUsername: string;
  superadminPassword: string | undefined;
  snapshotRetentionDays: number;
  devUnsafeRunner: boolean;
  clientDist: string;
  serverContentDir: string;
  snapshotsDir: string;
  backupsDir: string;
  dbPath: string;
};

/** Accepts base64 or hex and insists on exactly 32 bytes, so a truncated key fails loudly. */
function parseKey(value: string, label: string): Buffer {
  const buf = /^[0-9a-fA-F]{64}$/.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  if (buf.length !== 32) {
    throw new Error(`${label} must decode to exactly 32 bytes (got ${buf.length}). Generate one with: openssl rand -base64 32`);
  }
  return buf;
}

/**
 * Dev/test only: keep a generated key on disk so restarts can still decrypt what they wrote.
 * Production must supply its own, or stored credentials become unreadable after a redeploy.
 */
function devKeyFile(dataDir: string, name: string, bytes: number): string {
  const file = path.join(dataDir, `.dev-${name}`);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, crypto.randomBytes(bytes).toString("base64"), { mode: 0o600 });
  }
  return fs.readFileSync(file, "utf8").trim();
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = rawSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${detail}`);
  }
  const raw = parsed.data;
  const isProduction = raw.NODE_ENV === "production";
  const dataDir = path.resolve(raw.DATA_DIR);

  if (isProduction) {
    if (!raw.APP_MASTER_KEY) throw new Error("APP_MASTER_KEY is required in production. Generate one with: openssl rand -base64 32");
    if (!raw.SESSION_SECRET) throw new Error("SESSION_SECRET is required in production. Generate one with: openssl rand -base64 32");
  }

  const masterKeyRaw = raw.APP_MASTER_KEY ?? devKeyFile(dataDir, "master-key", 32);
  const sessionSecret = raw.SESSION_SECRET ?? devKeyFile(dataDir, "session-secret", 32);

  return {
    nodeEnv: raw.NODE_ENV,
    isProduction,
    isTest: raw.NODE_ENV === "test",
    port: raw.PORT,
    host: raw.HOST,
    dataDir,
    publicOrigin: raw.PUBLIC_ORIGIN,
    masterKey: parseKey(masterKeyRaw, "APP_MASTER_KEY"),
    sessionSecret,
    superadminUsername: raw.SUPERADMIN_USERNAME.trim().toLowerCase(),
    superadminPassword: raw.SUPERADMIN_PASSWORD,
    snapshotRetentionDays: raw.SNAPSHOT_RETENTION_DAYS,
    devUnsafeRunner: raw.DEV_UNSAFE_RUNNER,
    clientDist: path.resolve(raw.CLIENT_DIST),
    serverContentDir: path.resolve(raw.SERVER_CONTENT_DIR),
    snapshotsDir: path.join(dataDir, "snapshots"),
    backupsDir: path.join(dataDir, "backups"),
    dbPath: path.join(dataDir, "oyelearn.db"),
  };
}
