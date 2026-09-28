/**
 * The message an admin sends someone after creating their account or resetting their password.
 *
 * Pure, and in its own file, because it is the part that is easy to get subtly wrong: a sign-in
 * link pointing at the wrong host, a missing note that the password is temporary, a stray "Hi
 * undefined". None of that is visible from the component that renders the button, and all of it is
 * visible from a test.
 *
 * ## Why the whole message rather than just the password
 *
 * The old notice copied the password alone, which made the admin assemble the rest by hand every
 * time — the URL from the address bar, the username from the row, and some wording about it being
 * temporary. That is four or five actions per person, and the wording is exactly the part that got
 * dropped when someone was in a hurry. One click now produces something that can be pasted straight
 * into a chat.
 */

export interface InviteInput {
  /** `new` for a freshly created account, `reset` when an existing password was replaced. */
  kind: "new" | "reset";
  username: string;
  password: string;
  /** Used for the greeting. Omitted or blank drops the greeting rather than writing "Hi ,". */
  displayName?: string | null;
  /** Where the app lives, e.g. `https://learn.oyegen.com`. A trailing slash is tolerated. */
  origin: string;
}

const PRODUCT = "Oyelearn";

/** Just the first name: "Hi Priya" reads like a person wrote it, "Hi Priya Sharma" does not. */
function firstName(displayName: string | null | undefined): string | null {
  const trimmed = displayName?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0];
}

/** `https://host` with no trailing slash, so joining a path never doubles it. */
export function signInUrl(origin: string): string {
  return `${origin.replace(/\/+$/, "")}/login`;
}

/** The subject line, for the mail draft. */
export function inviteSubject(kind: InviteInput["kind"]): string {
  return kind === "new" ? `Your ${PRODUCT} account` : `Your ${PRODUCT} password has been reset`;
}

/**
 * The body, ready to paste into a chat or an email.
 *
 * Plain text with blank lines between blocks: it survives WhatsApp, Slack, Teams and a mail client
 * equally, which Markdown does not.
 */
export function inviteMessage({ kind, username, password, displayName, origin }: InviteInput): string {
  const name = firstName(displayName);
  const opening =
    kind === "new"
      ? `${name ? `Hi ${name} — you` : "You"}'ve been added to ${PRODUCT}.`
      : `${name ? `Hi ${name} — your` : "Your"} ${PRODUCT} password has been reset.`;

  /* The last line is the one that matters and the one a hand-written message always forgets. A
     temporary password that nobody says is temporary gets saved into a password manager as if it
     were permanent, and the forced change at first sign-in then reads as the app being broken. */
  const closing =
    kind === "new"
      ? "You'll be asked to choose your own password the first time you sign in — this one stops working then."
      : "You'll be asked to choose a new password when you sign in — this one stops working then.";

  return [
    opening,
    "",
    `Sign in: ${signInUrl(origin)}`,
    `Username: ${username}`,
    `Temporary password: ${password}`,
    "",
    closing,
  ].join("\n");
}

/**
 * A `mailto:` URL with the body filled in and **no recipient**.
 *
 * Deliberately no address: the platform stores usernames, not email addresses, so there is nothing
 * truthful to put there. It opens a draft the admin addresses themselves, which is still two
 * actions rather than five.
 */
export function inviteMailto(input: InviteInput): string {
  const subject = encodeURIComponent(inviteSubject(input.kind));
  const body = encodeURIComponent(inviteMessage(input));
  return `mailto:?subject=${subject}&body=${body}`;
}
