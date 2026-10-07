import { describe, expect, test } from "vitest";

import {
  biggestCelebration,
  buildBoard,
  buildWeeklyRecap,
  CELEBRATION_KINDS,
  celebrationFor,
  celebrationMode,
  encouragement,
  inQuietHours,
  localClock,
  minutesOf,
  parseRecapSchedule,
  recapWindowOpen,
  reminderDecision,
  shouldShowWelcome,
  type BoardCandidate,
  type RecapInput,
  type ReminderInput,
} from "./motivation";

describe("celebrations", () => {
  test("each kind has a size and stays within 2 seconds", () => {
    expect(celebrationFor("lesson")).toMatchObject({ size: "small", confetti: false });
    expect(celebrationFor("level_up")).toMatchObject({ size: "medium", confetti: true });
    expect(celebrationFor("weekly_summit")).toMatchObject({ size: "big", confetti: true });
    expect(celebrationFor("certificate")).toMatchObject({ size: "big", confetti: true });
    for (const kind of CELEBRATION_KINDS) {
      const spec = celebrationFor(kind);
      expect(spec.durationMs).toBeGreaterThan(0);
      expect(spec.durationMs).toBeLessThanOrEqual(2000);
    }
    expect(celebrationFor("lesson").durationMs).toBeLessThan(celebrationFor("level_up").durationMs);
    expect(celebrationFor("level_up").durationMs).toBeLessThan(celebrationFor("certificate").durationMs);
  });

  test("the learner's settings decide off, static or animated", () => {
    expect(celebrationMode({ celebrations: false, reducedMotion: "off", systemReduce: false })).toBe("off");
    expect(celebrationMode({ celebrations: true, reducedMotion: "on", systemReduce: false })).toBe("static");
    expect(celebrationMode({ celebrations: true, reducedMotion: "system", systemReduce: true })).toBe("static");
    expect(celebrationMode({ celebrations: true, reducedMotion: "off", systemReduce: true })).toBe("animated");
    expect(celebrationMode({ celebrations: true, reducedMotion: "system", systemReduce: false })).toBe("animated");
  });

  test("the bigger moment wins", () => {
    expect(biggestCelebration(["lesson", "level_up"])).toBe("level_up");
    expect(biggestCelebration(["lesson", "certificate", "level_up"])).toBe("certificate");
    expect(biggestCelebration([])).toBeNull();
  });
});

describe("welcome", () => {
  test("once, on Today, unless asked for again", () => {
    expect(shouldShowWelcome({ welcomeDoneAt: null, pathname: "/learn", search: "" })).toBe(true);
    expect(shouldShowWelcome({ welcomeDoneAt: 123, pathname: "/learn", search: "" })).toBe(false);
    expect(shouldShowWelcome({ welcomeDoneAt: 123, pathname: "/learn", search: "?welcome=1" })).toBe(true);
    expect(shouldShowWelcome({ welcomeDoneAt: null, pathname: "/learn/lesson/x", search: "" })).toBe(false);
    expect(shouldShowWelcome({ welcomeDoneAt: null, pathname: "/learn/me", search: "?welcome=1" })).toBe(false);
  });
});

describe("local time and quiet hours", () => {
  test("reads a time zone's clock", () => {
    const at = Date.UTC(2026, 9, 6, 23, 30); // 23:30 UTC
    expect(localClock(at, "UTC")).toEqual({ day: "2026-10-06", minutes: 23 * 60 + 30 });
    expect(localClock(at, "Asia/Kolkata")).toEqual({ day: "2026-10-07", minutes: 5 * 60 });
    expect(localClock(at, "Not/AZone").day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("quiet hours, including across midnight", () => {
    expect(minutesOf("18:30")).toBe(1110);
    expect(minutesOf("24:00")).toBeNull();
    expect(inQuietHours(minutesOf("23:00")!, { from: "22:00", to: "07:00" })).toBe(true);
    expect(inQuietHours(minutesOf("06:59")!, { from: "22:00", to: "07:00" })).toBe(true);
    expect(inQuietHours(minutesOf("07:00")!, { from: "22:00", to: "07:00" })).toBe(false);
    expect(inQuietHours(minutesOf("13:00")!, { from: "12:00", to: "14:00" })).toBe(true);
    expect(inQuietHours(minutesOf("14:00")!, { from: "12:00", to: "14:00" })).toBe(false);
    expect(inQuietHours(600, { from: "10:00", to: "10:00" })).toBe(false);
    expect(inQuietHours(600, null)).toBe(false);
  });
});

describe("reminder rules", () => {
  const base: ReminderInput = {
    reminderTime: "18:00",
    quietHours: null,
    now: { day: "2026-10-06", minutes: 18 * 60 + 5 },
    learnedToday: false,
    lastReminderDay: null,
  };

  test("sends at or after the chosen time", () => {
    expect(reminderDecision(base)).toEqual({ send: true });
    expect(reminderDecision({ ...base, now: { day: "2026-10-06", minutes: 18 * 60 } })).toEqual({ send: true });
    expect(reminderDecision({ ...base, now: { day: "2026-10-06", minutes: 17 * 60 + 59 } })).toEqual({ send: false, reason: "too_early" });
  });

  test("no time chosen, no reminder", () => {
    expect(reminderDecision({ ...base, reminderTime: null })).toEqual({ send: false, reason: "no_time" });
  });

  test("never more than one a day", () => {
    expect(reminderDecision({ ...base, lastReminderDay: "2026-10-06" })).toEqual({ send: false, reason: "already_sent" });
    expect(reminderDecision({ ...base, lastReminderDay: "2026-10-05" })).toEqual({ send: true });
  });

  test("not when they already learned today", () => {
    expect(reminderDecision({ ...base, learnedToday: true })).toEqual({ send: false, reason: "learned_today" });
  });

  test("quiet hours win, and a stale reminder isn't sent late", () => {
    expect(reminderDecision({ ...base, quietHours: { from: "18:00", to: "19:00" } })).toEqual({ send: false, reason: "quiet_hours" });
    expect(reminderDecision({ ...base, quietHours: { from: "18:00", to: "19:00" }, now: { day: "2026-10-06", minutes: 19 * 60 + 1 } })).toEqual({ send: true });
    expect(reminderDecision({ ...base, now: { day: "2026-10-06", minutes: 23 * 60 } })).toEqual({ send: false, reason: "too_late" });
  });
});

describe("the weekly recap", () => {
  const input: RecapInput = {
    firstName: "Tara",
    weekLabel: "week 40",
    xpLastWeek: 190,
    lessonsLastWeek: 3,
    minutesLastWeek: 150,
    goalMinutes: 180,
    lastWeek: { met: false, frozen: false },
    streak: { current: 2, freezesLeft: 1 },
    next: [
      { title: "Closures", href: "/learn/lesson/js-closures" },
      { title: "The <event> loop", href: "/learn/lesson/js-event-loop" },
      { title: "Promises", href: "/learn/lesson/p" },
      { title: "Fourth", href: "/learn/lesson/q" },
    ],
    appUrl: "https://learn.oyelabs.com/",
  };

  test("progress, what's next and one kind line, in text and HTML", () => {
    const mail = buildWeeklyRecap(input);
    expect(mail.subject).toBe("Tara, your week in learning");
    expect(mail.text).toContain("Hi Tara,");
    expect(mail.text).toContain("You learned for 2.5 hours of your 3 hours goal.");
    expect(mail.text).toContain("You finished 3 lessons.");
    expect(mail.text).toContain("You earned 190 XP.");
    expect(mail.text).toContain("Your weekly streak is 2 weeks.");
    expect(mail.text).toContain("- Closures: https://learn.oyelabs.com/learn/lesson/js-closures");
    expect(mail.text).not.toContain("Fourth");
    expect(mail.text).toContain(encouragement(input));
    expect(mail.text).toContain("https://learn.oyelabs.com/learn/me?tab=settings");
    expect(mail.bodyHtml).toContain("The &lt;event&gt; loop");
    expect(mail.bodyHtml).not.toContain("<event>");
    expect(mail.bodyHtml).toContain('href="https://learn.oyelabs.com/learn"');
  });

  test("the kind line never guilt-trips", () => {
    expect(encouragement({ lastWeek: { met: false, frozen: true }, lessonsLastWeek: 0, streak: { current: 3, freezesLeft: 0 } })).toMatch(/freeze kept your streak safe/);
    expect(encouragement({ lastWeek: { met: true, frozen: false }, lessonsLastWeek: 5, streak: { current: 5, freezesLeft: 1 } })).toMatch(/5 weeks in a row/);
    expect(encouragement({ lastWeek: null, lessonsLastWeek: 0, streak: { current: 0, freezesLeft: 1 } })).toMatch(/fresh start/);
  });

  test("no goal: lessons are the progress line; met: a happier subject", () => {
    const mail = buildWeeklyRecap({ ...input, goalMinutes: null, lessonsLastWeek: 1, lastWeek: { met: true, frozen: false }, next: [] });
    expect(mail.subject).toBe("Tara, you reached your goal last week");
    expect(mail.text).toContain("You finished 1 lesson.");
    expect(mail.text).toContain("Your next lessons show on Today.");
  });

  test("schedule: Monday 08:00 by default, configurable", () => {
    expect(parseRecapSchedule(undefined)).toEqual({ weekday: 1, hour: 8 });
    expect(parseRecapSchedule("fri 17:00")).toEqual({ weekday: 5, hour: 17 });
    expect(parseRecapSchedule("3 9")).toEqual({ weekday: 3, hour: 9 });
    expect(parseRecapSchedule("nonsense")).toEqual({ weekday: 1, hour: 8 });
    expect(recapWindowOpen(new Date(2026, 9, 5, 8, 10), { weekday: 1, hour: 8 })).toBe(true); // Mon 5 Oct 2026
    expect(recapWindowOpen(new Date(2026, 9, 5, 7, 59), { weekday: 1, hour: 8 })).toBe(false);
    expect(recapWindowOpen(new Date(2026, 9, 6, 9, 0), { weekday: 1, hour: 8 })).toBe(false);
  });
});

describe("the team board", () => {
  const person = (id: string, name: string, xp: number, extra: Partial<BoardCandidate> = {}): BoardCandidate => ({
    userId: id,
    displayName: name,
    departmentId: "eng",
    optedIn: true,
    active: true,
    xp,
    ...extra,
  });

  test("only opted-in, active people from the same department, first names only", () => {
    const view = buildBoard("me", "eng", [
      person("me", "Tara Today", 40),
      person("a", "Rahul Verma", 120),
      person("b", "Hidden Person", 500, { optedIn: false }),
      person("c", "Other Team", 900, { departmentId: "sales" }),
      person("d", "Gone Person", 800, { active: false }),
    ]);
    expect(view.entries).toEqual([
      { firstName: "Rahul", xp: 120, you: false },
      { firstName: "Tara", xp: 40, you: true },
    ]);
    expect(view.you).toBeNull();
    expect(view.size).toBe(2);
  });

  test("top 10, plus 'you' when you're further down; nobody when you didn't join", () => {
    const many = Array.from({ length: 12 }, (_, i) => person(`p${i}`, `Person${i} X`, 100 + i));
    const mine = buildBoard("me", "eng", [...many, person("me", "Tara T", 5)]);
    expect(mine.entries).toHaveLength(10);
    expect(mine.entries[0]).toEqual({ firstName: "Person11", xp: 111, you: false });
    expect(mine.you).toEqual({ firstName: "Tara", xp: 5, you: true });
    const notJoined = buildBoard("me", "eng", [...many, person("me", "Tara T", 500, { optedIn: false })]);
    expect(notJoined.entries.some((e) => e.you)).toBe(false);
    expect(notJoined.you).toBeNull();
  });

  test("no department matches no department", () => {
    const view = buildBoard("me", null, [person("me", "Tara", 1, { departmentId: null }), person("a", "Ana", 2, { departmentId: null }), person("b", "Bo", 3)]);
    expect(view.entries.map((e) => e.firstName)).toEqual(["Ana", "Tara"]);
  });
});
