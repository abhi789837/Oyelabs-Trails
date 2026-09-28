import { describe, expect, test } from "vitest";

import { inviteMailto, inviteMessage, inviteSubject, signInUrl } from "./invite";

const base = {
  username: "priya.sharma",
  password: "98CK-HW2M-UU2M",
  displayName: "Priya Sharma",
  origin: "https://learn.oyegen.com",
} as const;

describe("signInUrl", () => {
  test("points at the sign-in page", () => {
    expect(signInUrl("https://learn.oyegen.com")).toBe("https://learn.oyegen.com/login");
  });

  test("a trailing slash does not double up", () => {
    // `window.location.origin` never has one, but a hand-set value might, and "//login" is a
    // different path to some proxies.
    expect(signInUrl("https://learn.oyegen.com/")).toBe("https://learn.oyegen.com/login");
  });
});

describe("inviteMessage", () => {
  test("carries the three things the recipient needs, and the link", () => {
    const message = inviteMessage({ kind: "new", ...base });
    expect(message).toContain("https://learn.oyegen.com/login");
    expect(message).toContain("priya.sharma");
    expect(message).toContain("98CK-HW2M-UU2M");
  });

  test("says the password is temporary — the line a hand-written message forgets", () => {
    for (const kind of ["new", "reset"] as const) {
      expect(inviteMessage({ kind, ...base })).toMatch(/stops working/i);
    }
  });

  test("greets by first name only", () => {
    expect(inviteMessage({ kind: "new", ...base })).toContain("Hi Priya —");
    expect(inviteMessage({ kind: "new", ...base })).not.toContain("Hi Priya Sharma");
  });

  test("drops the greeting rather than writing an empty one", () => {
    for (const displayName of [undefined, null, "", "   "]) {
      const message = inviteMessage({ kind: "new", ...base, displayName });
      expect(message).not.toMatch(/Hi\s*[—,]/);
      expect(message).not.toContain("undefined");
      expect(message.startsWith("You've been added")).toBe(true);
    }
  });

  test("a reset does not claim the account was just created", () => {
    const message = inviteMessage({ kind: "reset", ...base });
    expect(message).toMatch(/password has been reset/i);
    expect(message).not.toMatch(/added to/i);
  });

  test("is plain text, so it survives a chat client", () => {
    const message = inviteMessage({ kind: "new", ...base });
    // No Markdown: WhatsApp and Teams would render the asterisks and backticks literally.
    expect(message).not.toMatch(/[*_`#]/);
    expect(message.split("\n\n")).toHaveLength(3);
  });
});

describe("inviteMailto", () => {
  test("has no recipient, because the platform stores no email addresses", () => {
    expect(inviteMailto({ kind: "new", ...base }).startsWith("mailto:?")).toBe(true);
  });

  test("encodes the body, so a password with punctuation survives", () => {
    const url = inviteMailto({ kind: "new", ...base, password: "a&b=c d+e" });
    expect(url).toContain(encodeURIComponent("a&b=c d+e"));
    // An unencoded `&` would end the body parameter and silently truncate the message.
    expect(url).not.toContain("a&b=c");
  });

  test("the subject matches what happened", () => {
    expect(inviteSubject("new")).toMatch(/account/i);
    expect(inviteSubject("reset")).toMatch(/reset/i);
  });
});
