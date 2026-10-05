import { describe, expect, test } from "vitest";

import { ERROR_CODES } from "@shared/api";

import { plainError } from "./plainErrorInfo";

describe("plainError", () => {
  test("keeps the server's own plain message and moves the code to details", () => {
    const info = plainError({ status: 400, code: ERROR_CODES.BAD_REQUEST, message: "We weren't sure what you meant by 'x'. Pick an option first." });
    expect(info.message).toBe("We weren't sure what you meant by 'x'. Pick an option first.");
    expect(info.message).not.toMatch(/400|bad_request/);
    expect(info.details).toContain("HTTP 400");
    expect(info.details).toContain("bad_request");
  });

  test("turns technical failures into plain words with what to do next", () => {
    expect(plainError({ status: 0, code: ERROR_CODES.INTERNAL, message: "x" }).message).toMatch(/couldn't reach/);
    expect(plainError({ status: 429, code: ERROR_CODES.RATE_LIMITED, message: "Rate limit exceeded" }).message).toMatch(/Wait a minute/);
    expect(plainError({ status: 500, code: ERROR_CODES.INTERNAL, message: "TypeError: x is undefined" }).message).toBe("Something went wrong on our side. Try again in a minute.");
    const ai = plainError({ status: 409, code: ERROR_CODES.AI_NOT_CONFIGURED, message: "No provider" });
    expect(ai.action).toEqual({ label: "Connect it", to: "/admin/ai" });
    expect(ai.message).toMatch(/we'll finish automatically after/);
  });

  test("strings and plain errors pass through", () => {
    expect(plainError("Pick a department.")).toEqual({ message: "Pick a department.", details: null });
    expect(plainError(new Error("The account was made."))).toMatchObject({ message: "The account was made.", details: null });
    expect(plainError(null, "Try again.").message).toBe("Try again.");
  });
});
