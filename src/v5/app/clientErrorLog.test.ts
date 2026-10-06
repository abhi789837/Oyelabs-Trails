import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { clientErrorLogDeps, logClientError, resetClientErrorLog } from "./clientErrorLog";

const original = clientErrorLogDeps.fetch;
let calls: { url: string; init: RequestInit }[];

beforeEach(() => {
  resetClientErrorLog();
  calls = [];
  clientErrorLogDeps.fetch = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return {};
  });
});

afterEach(() => {
  clientErrorLogDeps.fetch = original;
});

describe("logClientError", () => {
  test("posts the route, message and stack as JSON", () => {
    expect(logClientError(new Error("boom"), "/learn/plan?x=1")).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("/api/client-errors");
    expect(calls[0]!.init.method).toBe("POST");
    const body = JSON.parse(String(calls[0]!.init.body));
    expect(body.route).toBe("/learn/plan");
    expect(body.message).toBe("Error: boom");
    expect(typeof body.stack).toBe("string");
  });

  test("sends the same crash once per page load", () => {
    logClientError(new Error("same"), "/learn");
    expect(logClientError(new Error("same"), "/learn")).toBe(false);
    expect(calls).toHaveLength(1);
  });

  test("sends at most five per page load", () => {
    for (let i = 0; i < 8; i++) logClientError(new Error(`e${i}`), "/learn");
    expect(calls).toHaveLength(5);
  });

  test("never throws when the network fails", async () => {
    clientErrorLogDeps.fetch = () => Promise.reject(new Error("offline"));
    expect(() => logClientError(new Error("x"), "/learn")).not.toThrow();
    await Promise.resolve();
  });
});
