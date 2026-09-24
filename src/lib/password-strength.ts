import { PASSWORD_MIN_LENGTH } from "@shared/auth";

/**
 * A client-side estimate, deliberately not the authority.
 *
 * The server (`server/src/auth/password.ts`) is what actually accepts or rejects a password: it
 * checks the length, the username, and a 1500-entry common-password list with trailing digits and
 * punctuation stripped. Shipping that list to the browser to duplicate the check would cost more
 * than it is worth, so the meter checks the two rules the client can verify exactly plus a
 * variety heuristic, and the copy next to it says the server has the final word.
 *
 * Rules are returned rather than just a score so the change-password screen can show *which*
 * requirement is outstanding, which is the difference between a meter and an instruction.
 */

export interface PasswordRule {
  label: string;
  met: boolean;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  rules: PasswordRule[];
}

const SCORE_LABELS = ["Weak", "Weak", "Fair", "Good", "Strong"] as const;

function characterClasses(password: string): number {
  let classes = 0;
  if (/[a-z]/.test(password)) classes += 1;
  if (/[A-Z]/.test(password)) classes += 1;
  if (/[0-9]/.test(password)) classes += 1;
  if (/[^A-Za-z0-9]/.test(password)) classes += 1;
  return classes;
}

/** "aaaaaaaaaa", "abcdefghij" and "0987654321" all clear a naive length rule and none is a password. */
function isLowEntropyPattern(password: string): boolean {
  if (password.length < 3) return false;
  const codes = [...password.toLowerCase()].map((c) => c.charCodeAt(0));
  const step = codes[1]! - codes[0]!;
  if (step !== 0 && step !== 1 && step !== -1) return false;
  return codes.every((code, i) => i === 0 || code - codes[i - 1]! === step);
}

export function passwordStrength(password: string, username = ""): PasswordStrength {
  const user = username.trim().toLowerCase();
  const lower = password.toLowerCase();
  const classes = characterClasses(password);

  const rules: PasswordRule[] = [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    // A username under 3 characters would match almost anything, so it is not worth testing.
    { label: "Does not contain your username", met: password.length > 0 && (user.length < 3 || !lower.includes(user)) },
    { label: "Mixes letters with digits or symbols", met: classes >= 2 },
  ];

  if (password.length === 0) return { score: 0, label: SCORE_LABELS[0], rules };

  const met = rules.filter((rule) => rule.met).length;
  let score: PasswordStrength["score"] = met === 3 ? 3 : met === 2 ? 2 : met === 1 ? 1 : 0;
  // "Strong" has to be earned with real length as well as variety, not by scraping past the minimum.
  if (score === 3 && password.length >= 14 && classes >= 3) score = 4;
  if (isLowEntropyPattern(password)) score = score > 1 ? 1 : score;

  return { score, label: SCORE_LABELS[score], rules };
}
