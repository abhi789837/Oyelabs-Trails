import fs from "node:fs";
import { describe, expect, it } from "vitest";

import { isPrecachedAsset, offlineChunks, precacheList, precacheVersion, type BuiltChunk } from "./precache";

const chunks: BuiltChunk[] = [
  { fileName: "assets/index-a.js", isEntry: true, imports: ["assets/react-b.js"] },
  { fileName: "assets/react-b.js", imports: [] },
  { fileName: "assets/V5App-c.js", facadeModuleId: "C:\\repo\\src\\v5\\app\\V5App.tsx", imports: ["assets/shared-d.js"] },
  { fileName: "assets/shared-d.js", imports: ["assets/react-b.js"] },
  { fileName: "assets/ReviewPage-e.js", facadeModuleId: "/repo/src/v5/learner/review/ReviewPage.tsx", imports: ["assets/shared-d.js", "assets/offline-f.js"] },
  { fileName: "assets/offline-f.js", imports: [] },
  { fileName: "assets/MonacoEditorImpl-g.js", facadeModuleId: "/repo/src/components/editor/MonacoEditorImpl.tsx", imports: ["assets/editor.api-h.js"] },
  { fileName: "assets/editor.api-h.js", imports: [] },
  { fileName: "assets/LessonPage-i.js", facadeModuleId: "/repo/src/v5/learner/lesson/LessonPage.tsx", imports: ["assets/shared-d.js"] },
];

describe("service worker precache", () => {
  it("takes the entry, the v5 frame and Review with their static imports, nothing else", () => {
    expect(offlineChunks(chunks)).toEqual(["assets/ReviewPage-e.js", "assets/V5App-c.js", "assets/index-a.js", "assets/offline-f.js", "assets/react-b.js", "assets/shared-d.js"]);
  });

  it("keeps CSS and woff2 fonts, skips woff, ttf and other files", () => {
    expect(isPrecachedAsset("assets/index-x.css")).toBe(true);
    expect(isPrecachedAsset("assets/geist-latin.woff2")).toBe(true);
    expect(isPrecachedAsset("assets/geist-latin.woff")).toBe(false);
    expect(isPrecachedAsset("assets/codicon.ttf")).toBe(false);
    expect(isPrecachedAsset("index.html")).toBe(false);
  });

  it("lists the shell, icons and manifest, never an /api URL, sorted and unique", () => {
    const list = precacheList(chunks, ["assets/index-x.css", "assets/a.woff2", "assets/a.woff", "index.html"]);
    expect(list).toContain("/index.html");
    expect(list).toContain("/site.webmanifest");
    expect(list).toContain("/icon-maskable-512.png");
    expect(list).toContain("/assets/index-x.css");
    expect(list).toContain("/assets/a.woff2");
    expect(list).not.toContain("/assets/a.woff");
    expect(list).not.toContain("/assets/MonacoEditorImpl-g.js");
    expect(list.some((u) => u.startsWith("/api"))).toBe(false);
    expect([...list].sort()).toEqual(list);
    expect(new Set(list).size).toBe(list.length);
  });

  it("changes the version when the list or the shell changes, and only then", () => {
    const list = precacheList(chunks, []);
    const v = precacheVersion(list, "<html>1</html>");
    expect(precacheVersion(list, "<html>1</html>")).toBe(v);
    expect(precacheVersion(list, "<html>2</html>")).not.toBe(v);
    expect(precacheVersion([...list, "/assets/new.js"], "<html>1</html>")).not.toBe(v);
  });

  it("the worker template has both build placeholders and passes /api through", () => {
    const src = fs.readFileSync(new URL("./sw.template.js", import.meta.url), "utf8");
    expect(src).toContain('"__OYELEARN_SW_VERSION__"');
    expect(src).toContain("/* __OYELEARN_PRECACHE__ */ []");
    expect(src).toContain('if (url.pathname.startsWith("/api/")) return;');
    // An update never takes over by itself: only the first install, or the page's SKIP_WAITING.
    expect(src).toContain("if (!self.registration.active) await self.skipWaiting();");
  });
});
