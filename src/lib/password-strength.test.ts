import { describe, expect, it } from "vitest";

import { PASSWORD_MIN_LENGTH } from "@shared/auth";

import { passwordStrength } from "./password-strength";

describe("passwordStrength", () => {
  it("scores an empty field zero and marks nothing as met", () => {
    const result = passwordStrength("");
    expect(result.score).toBe(0);
    expect(result.rules.every((rule) => !rule.met)).toBe(true);
  });

  it("fails the length rule below the server's minimum and passes it at the minimum", () => {
    expect(passwordStrength("aB3".padEnd(PASSWORD_MIN_LENGTH - 1, "x")).rules[0]!.met).toBe(false);
    expect(passwordStrength("aB3".padEnd(PASSWORD_MIN_LENGTH, "x")).rules[0]!.met).toBe(true);
  });

  it("catches the username inside the password, case-insensitively", () => {
    expect(passwordStrength("Abhishek-2026!", "abhishek").rules[1]!.met).toBe(false);
    expect(passwordStrength("correct-horse-42", "abhishek").rules[1]!.met).toBe(true);
  });

  it("ignores a username too short to be a meaningful match", () => {
    expect(passwordStrength("about-turn-1999", "ab").rules[1]!.met).toBe(true);
  });

  it("does not call a long run of one character strong", () => {
    const result = passwordStrength("aaaaaaaaaaaaaaaa");
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("does not call a sequential run strong, in either direction", () => {
    expect(passwordStrength("abcdefghijklmn").score).toBeLessThanOrEqual(1);
    expect(passwordStrength("9876543210").score).toBeLessThanOrEqual(1);
  });

  it("reserves the top score for real length plus real variety", () => {
    // Long, three classes, nothing patterned.
    expect(passwordStrength("Trailmark-camp-88").score).toBe(4);
    // Long enough for the rules, but only two character classes.
    expect(passwordStrength("trailcamp8").score).toBe(3);
  });
});
