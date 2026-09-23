import { describe, expect, test } from "vitest";

import { PASSWORD_MIN_LENGTH } from "../../../shared/auth";
import { checkPasswordPolicy, generatePassword, hashPassword, verifyPassword } from "./password";

describe("hashing", () => {
  test("produces an argon2id PHC string at the OWASP-recommended parameters", async () => {
    const hash = await hashPassword("a-perfectly-fine-password");
    // Guards the inlined algorithm constant: `Algorithm.Argon2id` cannot be imported under
    // verbatimModuleSyntax, so this checks the output instead of the input.
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  test("the same password hashes differently every time (random salt)", async () => {
    const [a, b] = await Promise.all([hashPassword("same-password-here"), hashPassword("same-password-here")]);
    expect(a).not.toBe(b);
    expect(await verifyPassword(a, "same-password-here")).toBe(true);
    expect(await verifyPassword(b, "same-password-here")).toBe(true);
  });

  test("verification returns false rather than throwing on a corrupt hash", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
    expect(await verifyPassword("", "anything")).toBe(false);
    expect(await verifyPassword("$argon2id$v=19$truncated", "anything")).toBe(false);
  });
});

describe("policy", () => {
  const ok = (password: string, username = "someone") => checkPasswordPolicy(password, username) === null;

  test(`requires at least ${PASSWORD_MIN_LENGTH} characters`, () => {
    expect(ok("short1!")).toBe(false);
    expect(ok("123456789")).toBe(false);
    expect(ok("just-long-enough")).toBe(true);
  });

  test("rejects the username itself, and usernames of 4+ characters appearing anywhere", () => {
    expect(ok("priya.sharma", "priya.sharma")).toBe(false);
    expect(ok("my-priya-password", "priya")).toBe(false);
    // A short username is only rejected on an exact match, so ordinary passphrases still pass.
    expect(ok("radiator-flange-88", "raj")).toBe(true);
  });

  test("rejects common passwords, including with characters appended", () => {
    expect(ok("password1234")).toBe(false);
    expect(ok("qwerty123456")).toBe(false);
    expect(ok("iloveyou!!!!")).toBe(false);
    expect(ok("letmein2024!")).toBe(false);
  });

  test("accepts a genuinely uncommon passphrase", () => {
    expect(ok("basalt-ridge-camp-41")).toBe(true);
    expect(ok("Tr4ils.Summit.Vista")).toBe(true);
  });

  test("returns a message a person can act on, not just a boolean", () => {
    expect(checkPasswordPolicy("short", "x")?.message).toMatch(/at least 10 characters/);
    expect(checkPasswordPolicy("password1234", "x")?.message).toMatch(/common password/i);
  });
});

describe("generated passwords", () => {
  const sequential = (n: number) => Uint8Array.from({ length: n }, (_, i) => i);

  test("is grouped, readable, and free of confusable characters", () => {
    const password = generatePassword(sequential, 12);
    expect(password).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(password).not.toMatch(/[O0I1L]/);
  });

  test("the seeded superadmin length is 20 characters plus separators", () => {
    const password = generatePassword(sequential, 20);
    expect(password.replace(/-/g, "")).toHaveLength(20);
  });

  test("a generated password always satisfies the policy", () => {
    // Deterministic sweep rather than one sample: a generator that can emit a rejected password
    // would make onboarding fail intermittently.
    for (let seed = 0; seed < 64; seed++) {
      const password = generatePassword((n) => Uint8Array.from({ length: n }, (_, i) => (i * 7 + seed) % 256), 12);
      expect(checkPasswordPolicy(password, "someone"), `seed ${seed} produced ${password}`).toBeNull();
    }
  });
});
