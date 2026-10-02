import { describe, expect, test } from "vitest";

import { registry } from "@/content/registry";
import type { Module } from "@/types/curriculum";
import { checkTask, taskSchema } from "@shared/tasks";
import { SOP_MARKER } from "@shared/sop";

/** v4.1: the agency PM courses, checked as data (the content gate runs the deeper checks). */
const files = import.meta.glob<{ default: Module }>("./pma-*.ts", { eager: true });
const modules = Object.values(files).map((m) => m.default);
const pm = registry.find((t) => t.id === "pm")!;

describe("agency PM courses", () => {
  test("all 13 are on the PM trail, after the v4.2 process academy and ahead of the generic theory", () => {
    const ids = pm.modules.map((m) => m.id);
    const agency = ids.filter((id) => id.startsWith("pma-"));
    const academy = ids.filter((id) => id.startsWith("pmp-"));
    expect(agency).toHaveLength(13);
    expect(modules).toHaveLength(13);
    const firstTheory = ids.indexOf("pm-beginner");
    expect(Math.max(...agency.map((id) => ids.indexOf(id)))).toBeLessThan(firstTheory);
    expect(Math.max(...academy.map((id) => ids.indexOf(id)))).toBeLessThan(ids.indexOf("pma-refresh"));
    expect(ids[0]).toBe("pmp-a00");
  });

  test("every link and video carries its verification time", () => {
    for (const mod of modules) {
      for (const topic of mod.topics) {
        expect(topic.webRefs.length, topic.id).toBeGreaterThanOrEqual(2);
        for (const ref of topic.webRefs) expect(Date.parse(ref.verifiedAt ?? ""), `${topic.id} ${ref.url}`).not.toBeNaN();
        for (const video of [topic.video, ...(topic.alternateVideos ?? [])]) {
          expect(Date.parse(video.verifiedAt ?? ""), `${topic.id} ${video.url}`).not.toBeNaN();
          expect(video.url).toBe(`https://www.youtube.com/watch?v=${video.videoId}`);
        }
      }
    }
  });

  test("every topic has valid hands-on practice and a quiz, beginner to advanced", () => {
    for (const mod of modules) {
      const levels = mod.topics.map((t) => ["beginner", "intermediate", "advanced", "expert"].indexOf(t.level));
      expect(levels, mod.id).toEqual([...levels].sort((a, b) => a - b));
      for (const topic of mod.topics) {
        const parsed = taskSchema.safeParse(topic.practice);
        expect(parsed.success, topic.id).toBe(true);
        if (parsed.success) expect(checkTask(parsed.data), topic.id).toEqual([]);
        expect(topic.quiz?.length ?? 0, topic.id).toBeGreaterThanOrEqual(4);
      }
    }
  });

  test("internal procedures are SOP blocks for an admin, never invented", () => {
    const blocks = modules.flatMap((m) => m.topics.flatMap((t) => t.sop ?? []));
    expect(blocks.length).toBeGreaterThan(20);
    for (const block of blocks) {
      expect(block.title.trim()).not.toBe("");
      expect(block.prompt).toContain(SOP_MARKER);
    }
    const keka = modules.find((m) => m.id === "pma-keka")!;
    expect(keka.topics.some((t) => t.sop?.length)).toBe(true);
  });
});
