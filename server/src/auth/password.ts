import { hash, verify } from "@node-rs/argon2";

import { PASSWORD_MIN_LENGTH } from "../../../shared/auth";
import { COMMON_PASSWORDS } from "./common-passwords";

/**
 * `Algorithm.Argon2id` from @node-rs/argon2 is an ambient `const enum`, which cannot be imported
 * under `verbatimModuleSyntax`. The numeric value is inlined instead, and
 * password.test.ts asserts every hash we produce is tagged `$argon2id$` — a stronger guard than
 * the import was, since it checks the output rather than the input.
 */
const ARGON2ID = 2;

/**
 * OWASP's recommended minimum for Argon2id: 19 MiB of memory, 2 passes, 1 thread. These match
 * the package defaults, written out so a future change is a deliberate edit rather than a silent
 * dependency bump. The parameters are embedded in the resulting PHC string, so raising them later
 * still verifies existing hashes.
 */
const OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

/**
 * Never throws. A malformed hash in the database (a truncated column, a hand-edited row) must
 * read as "wrong password", not as a 500 that tells an attacker the account is special.
 */
export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}

export interface PasswordProblem {
  message: string;
}

/**
 * Brief §6: at least 10 characters, not the username, and not one of the most common passwords.
 *
 * The common-password check also strips trailing digits and punctuation before looking the
 * password up, so "password1234!" is rejected along with "password" — appending a few characters
 * to a top-1500 password is the single most common way people meet a length rule.
 */
export function checkPasswordPolicy(password: string, username: string): PasswordProblem | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { message: `Use at least ${PASSWORD_MIN_LENGTH} characters.` };
  }

  const lower = password.toLowerCase();
  const user = username.trim().toLowerCase();
  if (user && lower === user) {
    return { message: "Your password cannot be your username." };
  }
  // "Contains" is only applied to usernames of 4 characters or more. For a short one like
  // "admin" or "raj", a substring rule would reject plenty of genuinely strong passphrases that
  // merely happen to contain those letters.
  if (user.length >= 4 && lower.includes(user)) {
    return { message: "Your password cannot contain your username." };
  }

  if (COMMON_PASSWORDS.has(lower)) {
    return { message: "That is one of the most common passwords. Choose something less guessable." };
  }

  const stem = lower.replace(/[0-9!@#$%^&*._-]+$/, "");
  if (stem.length >= 4 && COMMON_PASSWORDS.has(stem)) {
    return {
      message: "That is a common password with characters added to the end. Choose something less guessable.",
    };
  }

  return null;
}

/**
 * A readable generated password, e.g. "K7NP-4QHD-2MXR". Confusable characters (0/O, 1/I/L) are
 * left out of the alphabet so it survives being read aloud, written down or typed by hand — it is
 * always a temporary password someone has to relay.
 *
 * The 31-character alphabet gives just under 5 bits per character: 12 characters is ~59 bits
 * (onboarding, changed on first login) and 20 is ~99 bits (the seeded superadmin, §6).
 *
 * `randomBytes` is injected so tests can make it deterministic; production passes
 * `crypto.randomBytes`.
 */
export function generatePassword(randomBytes: (n: number) => Uint8Array, length = 12): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const chars = [...randomBytes(length)].map((b) => alphabet[b % alphabet.length]);
  const groups: string[] = [];
  for (let i = 0; i < chars.length; i += 4) groups.push(chars.slice(i, i + 4).join(""));
  return groups.join("-");
}
