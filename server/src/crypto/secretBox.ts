import crypto from "node:crypto";

/**
 * AES-256-GCM for the AI provider credentials at rest (brief §8.1, §15).
 *
 * GCM is authenticated: a tampered ciphertext fails to decrypt rather than returning garbage that
 * would then be sent to a provider as an API key. The nonce is random per encryption and stored
 * alongside, which is required — reusing a nonce with the same key breaks GCM completely.
 *
 * The key is `APP_MASTER_KEY`. If it changes, every stored credential becomes unreadable and has
 * to be re-entered; `.env.example` says so.
 */

export interface SealedSecret {
  ciphertext: string;
  iv: string;
  tag: string;
}

/** 96 bits, the size GCM is specified for. */
const IV_BYTES = 12;

export function seal(plaintext: string, key: Buffer): SealedSecret {
  if (key.length !== 32) throw new Error("The master key must be 32 bytes.");
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function open(sealed: SealedSecret, key: Buffer): string {
  if (key.length !== 32) throw new Error("The master key must be 32 bytes.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(sealed.iv, "base64"));
  decipher.setAuthTag(Buffer.from(sealed.tag, "base64"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext, "base64")), decipher.final()]);
  return plaintext.toString("utf8");
}

/**
 * The only part of a secret that is ever shown again: the last four characters, so the admin can
 * tell two credentials apart without the value being recoverable.
 */
export function hint(plaintext: string): string {
  const trimmed = plaintext.trim();
  return trimmed.length <= 4 ? "…".padEnd(5, "•") : `…${trimmed.slice(-4)}`;
}

/**
 * v4.4: binary variant for recorded audio at rest.
 *
 * Layout: `iv (12) | tag (16) | ciphertext`, one self-contained blob per file, so a file can be
 * decrypted with nothing but the master key. Same key and algorithm as `seal`: a tampered or
 * truncated file fails the GCM tag check instead of returning altered audio.
 */
const TAG_BYTES = 16;

export function sealBuffer(plaintext: Buffer, key: Buffer): Buffer {
  if (key.length !== 32) throw new Error("The master key must be 32 bytes.");
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

export function openBuffer(sealed: Buffer, key: Buffer): Buffer {
  if (key.length !== 32) throw new Error("The master key must be 32 bytes.");
  if (sealed.length < IV_BYTES + TAG_BYTES) throw new Error("The sealed data is too short.");
  const iv = sealed.subarray(0, IV_BYTES);
  const tag = sealed.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(sealed.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]);
}
