import { describe, expect, it } from "vitest";

import type { AppNotification } from "@shared/notifications";

import {
  countUnread,
  groupNotifications,
  notificationFamily,
  notificationTone,
  relativeTime,
  unreadBadgeLabel,
} from "./notifications";

function note(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "n1",
    recipientId: "u1",
    kind: "plan.published",
    title: "Your learning plan is ready",
    body: "24 topics, about 30 hours.",
    link: "/plan",
    readAt: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("groupNotifications", () => {
  /* 14:00 on an arbitrary day, in whatever timezone the test runs in. Built from local parts so
     the "same calendar day" rule is exercised locally rather than in UTC. */
  const now = new Date(2026, 2, 14, 14, 0, 0).getTime();

  it("splits on the calendar day, not on the last 24 hours", () => {
    const thisMorning = new Date(2026, 2, 14, 7, 30).getTime();
    const lastNight = new Date(2026, 2, 13, 22, 30).getTime();

    const groups = groupNotifications(
      [note({ id: "a", createdAt: thisMorning }), note({ id: "b", createdAt: lastNight })],
      now,
    );

    expect(groups.today.map((item) => item.id)).toEqual(["a"]);
    // Under a rolling 24-hour rule this would still be "today" at 14:00, which reads as wrong.
    expect(groups.earlier.map((item) => item.id)).toEqual(["b"]);
  });

  it("keeps the order it was given inside each group", () => {
    const groups = groupNotifications(
      [
        note({ id: "newer", createdAt: now - 60_000 }),
        note({ id: "older", createdAt: now - 600_000 }),
      ],
      now,
    );
    expect(groups.today.map((item) => item.id)).toEqual(["newer", "older"]);
    expect(groups.earlier).toEqual([]);
  });
});

describe("unread", () => {
  it("counts only what has not been read", () => {
    expect(countUnread([note({ id: "a" }), note({ id: "b", readAt: 1 })])).toBe(1);
  });

  it("stops counting exactly where an exact number stops helping", () => {
    expect(unreadBadgeLabel(1)).toBe("1");
    expect(unreadBadgeLabel(9)).toBe("9");
    expect(unreadBadgeLabel(10)).toBe("9+");
  });
});

describe("relativeTime", () => {
  const now = new Date(2026, 2, 14, 14, 0, 0).getTime();

  it("is coarse on purpose", () => {
    expect(relativeTime(now - 5_000, now)).toBe("now");
    expect(relativeTime(now - 5 * 60_000, now)).toBe("5m");
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe("3h");
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe("2d");
  });

  it("falls back to a date once a week has passed", () => {
    expect(relativeTime(now - 30 * 86_400_000, now)).not.toMatch(/^\d+[mhd]$/);
  });

  it("never renders a negative age from a clock that is slightly ahead", () => {
    expect(relativeTime(now + 30_000, now)).toBe("now");
  });
});

describe("notificationTone", () => {
  it("maps the kinds the server actually sends", () => {
    expect(notificationTone("assessment.ready")).toBe("attention");
    expect(notificationTone("plan.published")).toBe("good");
    expect(notificationTone("evaluation.failed")).toBe("bad");
    expect(notificationTone("assessment.terminated")).toBe("bad");
  });

  it("still renders a kind it has never heard of", () => {
    // New kinds ship from the server without a client release; they must not disappear.
    expect(notificationTone("assessment.something.new")).toBe("progress");
    expect(notificationTone("billing.invoice")).toBe("neutral");
    expect(notificationFamily("billing.invoice")).toBe("billing");
  });
});
