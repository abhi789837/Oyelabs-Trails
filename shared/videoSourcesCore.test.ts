import { describe, expect, test } from "vitest";

import { activeIncrement, creditedActiveSeconds, ESTIMATED_IDLE_AFTER_SEC, estimatedProgress, isBrokenStatus } from "./videoSourcesCore";

describe("estimated tracking rules", () => {
  test("the client counts only visible, focused, non-idle time", () => {
    const on = { dtSec: 1, visible: true, focused: true, idleSec: 3 };
    expect(activeIncrement(on)).toBe(1);
    expect(activeIncrement({ ...on, visible: false })).toBe(0);
    expect(activeIncrement({ ...on, focused: false })).toBe(0);
    expect(activeIncrement({ ...on, idleSec: ESTIMATED_IDLE_AFTER_SEC })).toBe(0);
    // A tick after the laptop slept adds nothing.
    expect(activeIncrement({ ...on, dtSec: 600 })).toBe(0);
  });

  test("the server caps each sample by the wall clock", () => {
    expect(creditedActiveSeconds({ activeSeconds: 15, visible: true, focused: true }, 15)).toBe(15);
    expect(creditedActiveSeconds({ activeSeconds: 30, visible: true, focused: true }, 4)).toBe(6);
    expect(creditedActiveSeconds({ activeSeconds: 30, visible: true, focused: true }, null)).toBe(17);
    expect(creditedActiveSeconds({ activeSeconds: 30, visible: true, focused: true }, 9999)).toBe(30);
    expect(creditedActiveSeconds({ activeSeconds: 15, visible: false, focused: true }, 15)).toBe(0);
    expect(creditedActiveSeconds({ activeSeconds: 15, visible: true, focused: false }, 15)).toBe(0);
  });

  test("watched = 80% active time and the click", () => {
    expect(estimatedProgress(79, 100, true)).toMatchObject({ canConfirm: false, watched: false });
    expect(estimatedProgress(80, 100, false)).toMatchObject({ canConfirm: true, watched: false, requiredSeconds: 80, progress: 1 });
    expect(estimatedProgress(80, 100, true).watched).toBe(true);
    expect(estimatedProgress(500, null, true)).toEqual({ requiredSeconds: null, canConfirm: false, watched: false, progress: 0 });
  });

  test("broken statuses", () => {
    expect(isBrokenStatus("ok")).toBe(false);
    expect(isBrokenStatus("pending")).toBe(false);
    expect(isBrokenStatus("private")).toBe(true);
  });
});
