import { describe, expect, test } from "vitest";

import { parseDocLink, parseVideoLink, presignedExpiry } from "./parse";

/** PLAN.md §8 B: the pure `parseVideoLink` table, every source. */
describe("parseVideoLink", () => {
  const cases: [string, string, Partial<ReturnType<typeof parseVideoLink> & object>][] = [
    // YouTube
    ["watch", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s", { kind: "youtube", providerId: "dQw4w9WgXcQ", playerKind: "youtube", tracking: "exact", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" }],
    ["short link", "https://youtu.be/dQw4w9WgXcQ?si=abc", { kind: "youtube", providerId: "dQw4w9WgXcQ" }],
    ["shorts", "https://youtube.com/shorts/dQw4w9WgXcQ", { kind: "youtube", providerId: "dQw4w9WgXcQ" }],
    ["embed", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", { kind: "youtube", providerId: "dQw4w9WgXcQ" }],
    ["live", "https://www.youtube.com/live/dQw4w9WgXcQ", { kind: "youtube", providerId: "dQw4w9WgXcQ" }],
    ["no scheme", "m.youtube.com/watch?v=dQw4w9WgXcQ", { kind: "youtube", providerId: "dQw4w9WgXcQ" }],
    // Vimeo
    ["vimeo", "https://vimeo.com/76979871", { kind: "vimeo", providerId: "76979871", playerKind: "vimeo", tracking: "exact", embedUrl: "https://player.vimeo.com/video/76979871" }],
    ["vimeo unlisted", "https://vimeo.com/76979871/8272103f6e", { kind: "vimeo", embedUrl: "https://player.vimeo.com/video/76979871?h=8272103f6e" }],
    ["vimeo player", "https://player.vimeo.com/video/76979871?h=8272103f6e&badge=0", { kind: "vimeo", embedUrl: "https://player.vimeo.com/video/76979871?h=8272103f6e" }],
    ["vimeo channel", "https://vimeo.com/channels/staffpicks/76979871", { kind: "vimeo", providerId: "76979871" }],
    // Loom
    ["loom share", "https://www.loom.com/share/0123456789abcdef0123456789abcdef?sid=1", { kind: "loom", playerKind: "iframe", tracking: "estimated", embedUrl: "https://www.loom.com/embed/0123456789abcdef0123456789abcdef" }],
    ["loom embed", "https://www.loom.com/embed/0123456789abcdef0123456789abcdef", { kind: "loom", providerId: "0123456789abcdef0123456789abcdef" }],
    // Drive
    ["drive view", "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing", { kind: "gdrive", providerId: "1AbCdEfGhIjKlMnOp", playerKind: "iframe", tracking: "estimated", embedUrl: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview" }],
    ["drive open", "https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp", { kind: "gdrive", embedUrl: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview" }],
    // OneDrive / SharePoint
    ["1drv.ms", "https://1drv.ms/v/s!AbCdEf123", { kind: "onedrive", needsExpand: true, embedUrl: null, tracking: "estimated" }],
    ["onedrive long", "https://onedrive.live.com/redir?cid=ABC&resid=ABC!123&authkey=!XYZ", { kind: "onedrive", embedUrl: "https://onedrive.live.com/embed?cid=ABC&resid=ABC%21123&authkey=%21XYZ" }],
    ["sharepoint :v:", "https://oyelabs.sharepoint.com/:v:/s/Team/EaBcD123?e=abc", { kind: "onedrive", playerKind: "iframe", embedUrl: "https://oyelabs.sharepoint.com/:v:/s/Team/EaBcD123?e=abc&action=embedview" }],
    // Dropbox
    ["dropbox dl=0", "https://www.dropbox.com/s/abc123/kickoff.mp4?dl=0", { kind: "dropbox", playerKind: "html5", tracking: "exact", playbackUrl: "https://www.dropbox.com/s/abc123/kickoff.mp4?raw=1" }],
    ["dropbox dl=1", "https://www.dropbox.com/s/abc123/kickoff.mp4?dl=1", { kind: "dropbox", playbackUrl: "https://www.dropbox.com/s/abc123/kickoff.mp4?raw=1" }],
    ["dropbox scl", "https://www.dropbox.com/scl/fi/xyz789/kickoff.mp4?rlkey=k1&dl=0", { kind: "dropbox", playbackUrl: "https://www.dropbox.com/scl/fi/xyz789/kickoff.mp4?rlkey=k1&raw=1" }],
    ["dropbox folder", "https://www.dropbox.com/scl/fo/xyz789/h?rlkey=k1", { kind: "dropbox", unsupported: "folder" }],
    // Box
    ["box shared", "https://app.box.com/s/abcdef123456", { kind: "box", playerKind: "iframe", tracking: "estimated", embedUrl: "https://app.box.com/embed/s/abcdef123456" }],
    ["box tenant", "https://oyelabs.app.box.com/s/abcdef123456", { kind: "box", embedUrl: "https://oyelabs.app.box.com/embed/s/abcdef123456" }],
    ["box file page", "https://app.box.com/file/12345", { kind: "box", unsupported: "box_file" }],
    // Direct files
    ["mp4", "https://cdn.example.com/videos/intro.mp4", { kind: "direct", playerKind: "html5", tracking: "exact", playbackUrl: "https://cdn.example.com/videos/intro.mp4" }],
    ["webm", "https://cdn.example.com/a/b.webm?v=2", { kind: "direct", playerKind: "html5" }],
    ["m3u8", "https://stream.example.com/live/index.m3u8", { kind: "direct", playerKind: "hls" }],
    ["s3 presigned", "https://bucket.s3.amazonaws.com/v.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20261001T000000Z&X-Amz-Expires=3600&X-Amz-Signature=abc", { kind: "direct", expiresAt: Date.UTC(2026, 9, 1, 1, 0, 0) }],
    ["r2 presigned", "https://acc.r2.cloudflarestorage.com/b/v.webm?X-Amz-Date=20261001T000000Z&X-Amz-Expires=60", { kind: "direct", expiresAt: Date.UTC(2026, 9, 1, 0, 1, 0) }],
    // Anything else
    ["generic page", "https://wistia.example.com/medias/abc", { kind: "embed", playerKind: "iframe", tracking: "estimated", embedUrl: "https://wistia.example.com/medias/abc" }],
    ["lookalike", "https://evil.example/?u=drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view", { kind: "embed" }],
    ["youtube channel", "https://www.youtube.com/@oyelabs", { kind: "embed", unsupported: "folder" }],
  ];
  for (const [name, input, expected] of cases) {
    test(name, () => {
      expect(parseVideoLink(input)).toMatchObject(expected);
    });
  }

  test("garbage is not a link", () => {
    for (const bad of ["", "not a link", "javascript:alert(1)", "ftp://example.com/a.mp4", "file:///etc/passwd", "https://", "hello world.mp4"]) {
      expect(parseVideoLink(bad)).toBeNull();
    }
  });

  test("CloudFront expiry", () => {
    expect(presignedExpiry(new URL("https://d.cloudfront.net/v.mp4?Expires=1790000000&Signature=x&Key-Pair-Id=k"))).toBe(1790000000 * 1000);
  });
});

describe("parseDocLink", () => {
  test("Google export URLs", () => {
    expect(parseDocLink("https://docs.google.com/document/d/1AbCdEfGhIjK/edit")).toMatchObject({ kind: "gdoc", fetchUrl: "https://docs.google.com/document/d/1AbCdEfGhIjK/export?format=txt" });
    expect(parseDocLink("https://docs.google.com/spreadsheets/d/1AbCdEfGhIjK/edit#gid=42")).toMatchObject({ kind: "gsheet", fetchUrl: "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjK/export?format=csv&gid=42" });
    expect(parseDocLink("https://docs.google.com/presentation/d/1AbCdEfGhIjK/edit")).toMatchObject({ kind: "gslides", fetchUrl: "https://docs.google.com/presentation/d/1AbCdEfGhIjK/export/pdf" });
    expect(parseDocLink("https://drive.google.com/file/d/1AbCdEfGhIjK/view")).toMatchObject({ kind: "gdrive", fetchUrl: "https://drive.google.com/uc?export=download&id=1AbCdEfGhIjK" });
  });
  test("other drives and pages", () => {
    expect(parseDocLink("https://www.dropbox.com/s/a/b.pdf?dl=0")).toMatchObject({ kind: "dropbox", fetchUrl: "https://www.dropbox.com/s/a/b.pdf?raw=1" });
    expect(parseDocLink("https://1drv.ms/w/s!abc")?.kind).toBe("onedrive");
    expect(parseDocLink("https://oyelabs.sharepoint.com/:w:/s/T/abc")?.fetchUrl).toContain("download=1");
    expect(parseDocLink("https://oyelabs.notion.site/Handover-123")?.kind).toBe("notion");
    expect(parseDocLink("https://oyelabs.atlassian.net/wiki/spaces/X/pages/1")?.kind).toBe("confluence");
    expect(parseDocLink("https://example.com/guide")?.kind).toBe("web");
    expect(parseDocLink("nope nope")).toBeNull();
  });
});
