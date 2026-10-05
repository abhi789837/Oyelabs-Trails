import crypto from "node:crypto";

import { describe, expect, it } from "vitest";

import { openBuffer, sealBuffer } from "./secretBox";

const key = crypto.randomBytes(32);

describe("sealBuffer / openBuffer", () => {
  it("round-trips binary data and never stores the plaintext", () => {
    const plain = crypto.randomBytes(4096);
    const sealed = sealBuffer(plain, key);
    expect(sealed.length).toBe(plain.length + 28);
    expect(sealed.includes(plain.subarray(0, 64))).toBe(false);
    expect(openBuffer(sealed, key).equals(plain)).toBe(true);
  });

  it("round-trips an empty buffer", () => {
    expect(openBuffer(sealBuffer(Buffer.alloc(0), key), key).length).toBe(0);
  });

  it("uses a fresh nonce each time", () => {
    const plain = Buffer.from("same input");
    expect(sealBuffer(plain, key).equals(sealBuffer(plain, key))).toBe(false);
  });

  it("detects tampering with the ciphertext, the tag or the nonce", () => {
    const sealed = sealBuffer(Buffer.from("hello audio"), key);
    for (const index of [0, 12, sealed.length - 1]) {
      const bad = Buffer.from(sealed);
      bad[index] ^= 0x01;
      expect(() => openBuffer(bad, key)).toThrow();
    }
  });

  it("rejects the wrong key, truncated data and a bad key length", () => {
    const sealed = sealBuffer(Buffer.from("hello audio"), key);
    expect(() => openBuffer(sealed, crypto.randomBytes(32))).toThrow();
    expect(() => openBuffer(sealed.subarray(0, 20), key)).toThrow(/too short/);
    expect(() => sealBuffer(Buffer.from("x"), crypto.randomBytes(16))).toThrow(/32 bytes/);
  });
});
