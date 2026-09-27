import { describe, expect, it } from "vitest";

import type { ModuleMeta, TrackMeta } from "@shared/content";

import {
  GROUP_LIMITS,
  buildCurriculumIndex,
  groupResults,
  rankEntries,
  scoreEntry,
  type CommandEntry,
} from "./commandIndex";
import { pushRecent, parseRecents, RECENTS_LIMIT } from "./paletteRecents";

const options = {
  topicHref: (topic: { trackId: string; moduleId: string; id: string }) =>
    `/track/${topic.trackId}/module/${topic.moduleId}/topic/${topic.id}`,
  moduleHref: (module: { trackId: string; id: string }) => `/track/${module.trackId}/module/${module.id}`,
  levelLabel: (level: string) => level,
};

function topic(id: string, title: string) {
  return {
    id,
    moduleId: "js-core",
    trackId: "frontend" as const,
    title,
    level: "advanced" as const,
    estMinutes: 30,
    challengeType: "quiz" as const,
    challengeSize: 8,
  };
}

function camp(overrides: Partial<ModuleMeta> = {}): ModuleMeta {
  return {
    id: "js-core",
    trackId: "frontend",
    name: "JavaScript Core",
    description: "",
    available: true,
    topics: [topic("js-closures", "Closures"), topic("js-settimeout-closures", "setTimeout and closures")],
    ...overrides,
  };
}

function track(overrides: Partial<TrackMeta> = {}): TrackMeta {
  return {
    id: "frontend",
    name: "Frontend",
    tagline: "The browser trail",
    accentToken: "trailmark",
    modules: [camp()],
    ...overrides,
  };
}

describe("buildCurriculumIndex", () => {
  it("flattens a track into one trail, one camp and its topics", () => {
    const index = buildCurriculumIndex([track()], options);
    expect(index.map((entry) => entry.id)).toEqual([
      "trail:frontend",
      "camp:js-core",
      "topic:js-closures",
      "topic:js-settimeout-closures",
    ]);
    expect(index[2].href).toBe("/track/frontend/module/js-core/topic/js-closures");
  });

  it("leaves out a module that has not been written, and its topics with it", () => {
    const unwritten = camp({ id: "js-soon", name: "Later", available: false });
    const index = buildCurriculumIndex([track({ modules: [unwritten] })], options);
    expect(index.map((entry) => entry.kind)).toEqual(["trail"]);
  });
});

describe("scoreEntry", () => {
  const index = buildCurriculumIndex([track()], options);
  const byId = (id: string) => index.find((entry) => entry.id === id) as CommandEntry;

  it("returns 0 unless every word of the query appears", () => {
    expect(scoreEntry(byId("topic:js-closures"), "closures")).toBeGreaterThan(0);
    expect(scoreEntry(byId("topic:js-closures"), "closures postgres")).toBe(0);
  });

  it("ranks a title that starts with the query above one that merely contains it", () => {
    expect(scoreEntry(byId("topic:js-closures"), "closures")).toBeGreaterThan(
      scoreEntry(byId("topic:js-settimeout-closures"), "closures"),
    );
  });

  it("puts an exact topic id first, however it ranks by title", () => {
    const exact = scoreEntry(byId("topic:js-settimeout-closures"), "js-settimeout-closures");
    const prefix = scoreEntry(byId("topic:js-closures"), "closures");
    expect(exact).toBeGreaterThan(prefix);
  });

  it("ignores an empty query rather than matching everything", () => {
    expect(scoreEntry(byId("trail:frontend"), "   ")).toBe(0);
  });
});

describe("groupResults", () => {
  it("splits matches by kind and caps each group", () => {
    const many = track({
      modules: [
        camp({
          topics: Array.from({ length: 40 }, (_, i) => topic(`js-async-${i}`, `Async topic ${i}`)),
        }),
      ],
    });
    const index = buildCurriculumIndex([many], options);
    const results = groupResults(index, "async");

    expect(results.topics).toHaveLength(GROUP_LIMITS.topic);
    expect(results.total).toBe(GROUP_LIMITS.topic);
  });

  it("keeps a matching camp visible even when many topics match too", () => {
    const index = buildCurriculumIndex([track()], options);
    const results = groupResults(index, "javascript");
    expect(results.camps.map((entry) => entry.id)).toEqual(["camp:js-core"]);
  });

  it("returns nothing for a query nothing matches", () => {
    const index = buildCurriculumIndex([track()], options);
    expect(groupResults(index, "kubernetes").total).toBe(0);
  });
});

describe("rankEntries", () => {
  it("caps the list and orders it best first", () => {
    const index = buildCurriculumIndex([track()], options);
    const ranked = rankEntries(index, "closures", { limit: 1 });
    expect(ranked).toHaveLength(1);
    expect(ranked[0].id).toBe("topic:js-closures");
  });

  it("is empty for a blank query, so an empty palette renders nothing", () => {
    const index = buildCurriculumIndex([track()], options);
    expect(rankEntries(index, "", { limit: 10 })).toEqual([]);
  });
});

describe("recents", () => {
  const entry = (id: string) => ({ id, kind: "topic" as const, title: id, context: "", href: `/${id}` });

  it("puts the newest first and never repeats one", () => {
    const list = pushRecent(pushRecent([entry("a")], entry("b")), entry("a"));
    expect(list.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("caps the list", () => {
    let list = [] as ReturnType<typeof entry>[];
    for (let i = 0; i < RECENTS_LIMIT + 3; i += 1) list = pushRecent(list, entry(`t${i}`));
    expect(list).toHaveLength(RECENTS_LIMIT);
  });

  it("survives a corrupt or foreign value in storage", () => {
    expect(parseRecents(null)).toEqual([]);
    expect(parseRecents("not json")).toEqual([]);
    expect(parseRecents(JSON.stringify({ id: "x" }))).toEqual([]);
    expect(parseRecents(JSON.stringify([{ id: "x" }, entry("ok")]))).toEqual([entry("ok")]);
  });
});
