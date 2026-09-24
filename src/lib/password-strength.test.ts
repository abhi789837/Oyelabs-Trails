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

  it("matches the server's contains-threshold: three characters is equality only", () => {
    // checkPasswordPolicy applies "contains" from four characters up, and equality at any length.
    expect(passwordStrength("rajasthan-tonight-7", "raj").rules[1]!.met).toBe(true);
    expect(passwordStrength("raj", "raj").rules[1]!.met).toBe(false);
    expect(passwordStrength("RAJ", "raj").rules[1]!.met).toBe(false);
    // Four characters is where the substring rule starts, on the server and here.
    expect(passwordStrength("rajaa-tonight-7", "raja").rules[1]!.met).toBe(false);
  });

  it("adds the reuse rule only when a current password is supplied", () => {
    expect(passwordStrength("Trailmark-camp-88", "abhishek")).toHaveProperty("rules.length", 3);

    const reused = passwordStrength("Trailmark-camp-88", "abhishek", { differentFrom: "Trailmark-camp-88" });
    expect(reused.rules).toHaveLength(4);
    expect(reused.rules[3]!.met).toBe(false);
    // The server will refuse it, so it must not read as "Strong" on the way there.
    expect(reused.score).toBe(0);

    const fresh = passwordStrength("Trailmark-camp-88", "abhishek", { differentFrom: "something-else-9" });
    expect(fresh.rules[3]!.met).toBe(true);
    expect(fresh.score).toBe(4);
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
