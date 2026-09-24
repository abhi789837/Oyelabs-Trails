import { PASSWORD_MIN_LENGTH } from "@shared/auth";

/**
 * A client-side estimate, deliberately not the authority.
 *
 * The server (`server/src/auth/password.ts`) is what actually accepts or rejects a password: it
 * checks the length, the username, and a 1500-entry common-password list with trailing digits and
 * punctuation stripped. Shipping that list to the browser to duplicate the check would cost more
 * than it is worth, so the meter checks the rules the client can verify exactly — length, the
 * username, and (when the caller supplies it) reuse of the current password — plus a variety
 * heuristic, and the copy next to it says the server has the final word.
 *
 * Every exact rule below is a transcription of the server's, thresholds included. Where the two
 * could drift the comment names the server line it mirrors.
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

export interface PasswordStrengthOptions {
  /**
   * A password the new one must not equal. The change-password route rejects `newPassword ===
   * currentPassword` before it even reaches the policy check, so the checklist can say so without
   * spending a round trip on it. Adds a fourth rule; omit it and the checklist keeps three.
   */
  differentFrom?: string;
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

/**
 * The username rule, copied from `checkPasswordPolicy` rather than approximated.
 *
 * The server rejects a password that *equals* the username at any length, but only rejects one
 * that *contains* it from four characters up — for "raj" or "ana" a substring rule would throw out
 * plenty of genuinely strong passphrases. A checklist that is stricter than the server is not
 * "safe": it withholds a tick the server would have given, which is the meter lying in the
 * direction nobody notices.
 */
function usernameRule(password: string, user: string): PasswordRule {
  const lower = password.toLowerCase();
  const clear = user.length === 0 || (lower !== user && !(user.length >= 4 && lower.includes(user)));
  return {
    label: user.length >= 4 ? "Does not contain your username" : "Is not your username",
    met: password.length > 0 && clear,
  };
}

export function passwordStrength(password: string, username = "", options: PasswordStrengthOptions = {}): PasswordStrength {
  const user = username.trim().toLowerCase();
  const classes = characterClasses(password);

  const rules: PasswordRule[] = [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    usernameRule(password, user),
    { label: "Mixes letters with digits or symbols", met: classes >= 2 },
  ];

  const reference = options.differentFrom ?? "";
  const reused = reference.length > 0 && password === reference;
  if (reference.length > 0) {
    rules.push({ label: "Different from your current password", met: password.length > 0 && !reused });
  }

  if (password.length === 0) return { score: 0, label: SCORE_LABELS[0], rules };

  // Scored on the three rules that describe the password itself. Reuse is a separate failure —
  // "Strong" would be a true statement about a password the server is about to refuse.
  const met = rules.slice(0, 3).filter((rule) => rule.met).length;
  let score: PasswordStrength["score"] = met === 3 ? 3 : met === 2 ? 2 : met === 1 ? 1 : 0;
  // "Strong" has to be earned with real length as well as variety, not by scraping past the minimum.
  if (score === 3 && password.length >= 14 && classes >= 3) score = 4;
  if (isLowEntropyPattern(password)) score = score > 1 ? 1 : score;
  if (reused) score = 0;

  return { score, label: SCORE_LABELS[score], rules };
}
