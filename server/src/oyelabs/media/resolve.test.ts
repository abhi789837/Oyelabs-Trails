import { describe, expect, test } from "vitest";

import { framingForbidden, pageTitle, resolveDocLink, resolveVideoLink, type ResolveDeps } from "./resolve";
import { BlockedUrlError, isBlockedAddress, safeFetch } from "./safeFetch";

/**
 * PLAN.md §8 B: the sharing check with an injected fetch (no network). `routes` maps a URL prefix to
 * a response; redirects are 302 + location, exactly as `redirect: "manual"` returns them.
 */
type Fake = { status: number; headers?: Record<string, string>; body?: string };
function fakeDeps(routes: Record<string, Fake>, seen: string[] = []): ResolveDeps {
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    seen.push(`${init?.method ?? "GET"} ${url}`);
    expect(init?.redirect).toBe("manual");
    expect(init?.credentials).toBe("omit");
    const key = Object.keys(routes)
      .filter((k) => url.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    const hit = key ? routes[key]! : { status: 404 };
    return new Response(hit.body ?? "", { status: hit.status, headers: hit.headers });
  }) as typeof fetch;
  return { fetchImpl, lookup: async () => ["142.250.1.1"], now: () => Date.UTC(2026, 9, 7) };
}

const DRIVE = "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view";

describe("video sharing check", () => {
  test("a private Drive video redirects to sign-in: private, with the exact fix", async () => {
    const deps = fakeDeps({
      [DRIVE]: { status: 302, headers: { location: "https://accounts.google.com/ServiceLogin?continue=x" } },
      "https://accounts.google.com/": { status: 200, body: "<title>Sign in</title>" },
    });
    const r = await resolveVideoLink(`${DRIVE}?usp=sharing`, deps);
    expect(r.status).toBe("private");
    expect(r.kind).toBe("gdrive");
    expect(r.embedUrl).toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview");
    expect(r.problem).toEqual({
      code: "private",
      message: "This Drive video is private.",
      fix: "In Google Drive: Share → General access → 'Anyone with the link' (or 'Oyelabs' if every learner is signed into their Oyelabs Google account) → Viewer. Then press Check again.",
    });
  });

  /** v4.5 P5: every source the resolver checks spots a private link and names its own plain fix. */
  const login = (to: string): Fake => ({ status: 302, headers: { location: to } });
  const privateCases: [string, string, Record<string, Fake>, string, RegExp][] = [
    ["YouTube", "https://youtu.be/dQw4w9WgXcQ", { "https://www.youtube.com/oembed": { status: 401 } }, "This YouTube video is private.", /YouTube Studio.*Unlisted or Public/],
    ["Vimeo", "https://vimeo.com/76979871", { "https://vimeo.com/api/oembed.json": { status: 403 } }, "This Vimeo video is private.", /In Vimeo: Settings → Privacy/],
    ["Loom", "https://www.loom.com/share/0123456789abcdef0123456789abcdef", { "https://www.loom.com/v1/oembed": { status: 403 } }, "This Loom video is private.", /In Loom: Share → .*Anyone with the link can view/],
    ["Drive", DRIVE, { [DRIVE]: login("https://accounts.google.com/ServiceLogin"), "https://accounts.google.com/": { status: 200 } }, "This Drive video is private.", /In Google Drive: Share → General access → 'Anyone with the link'/],
    [
      "OneDrive",
      "https://onedrive.live.com/redir?cid=ABC&resid=ABC!123",
      { "https://onedrive.live.com/": login("https://login.live.com/oauth"), "https://login.live.com/": { status: 200 } },
      "This OneDrive video is private.",
      /In OneDrive or SharePoint: Share → 'Anyone with the link can view'/,
    ],
    ["SharePoint", "https://oyelabs.sharepoint.com/:v:/s/Team/EaBcD123", { "https://oyelabs.sharepoint.com/": login("https://login.microsoftonline.com/x"), "https://login.microsoftonline.com/": { status: 200 } }, "This OneDrive video is private.", /OneDrive or SharePoint/],
    ["Dropbox", "https://www.dropbox.com/s/abc/kickoff.mp4?dl=0", { "https://www.dropbox.com/s/": login("https://www.dropbox.com/login?cont=x"), "https://www.dropbox.com/login": { status: 200 } }, "This Dropbox video is private.", /In Dropbox: Share → Create link/],
    ["Box", "https://app.box.com/s/abcdef123456", { "https://app.box.com/s/": login("https://account.box.com/login"), "https://account.box.com/": { status: 200 } }, "This Box video is private.", /In Box: Share → Shared link → 'People with the link'/],
    ["a direct file", "https://cdn.example.com/videos/intro.mp4", { "https://cdn.example.com/": { status: 403 } }, "This video is private.", /link that works without signing in.*or upload it here/],
    ["any other page", "https://videos.example.com/watch/42", { "https://videos.example.com/watch": login("https://videos.example.com/login?next=42"), "https://videos.example.com/login": { status: 200 } }, "This video is private.", /work without signing in/],
  ];
  for (const [name, link, routes, message, fix] of privateCases) {
    test(`private ${name} link: detected, with its plain fix`, async () => {
      const r = await resolveVideoLink(link, fakeDeps(routes));
      expect(r.status).toBe("private");
      expect(r.problem?.code).toBe("private");
      expect(r.problem?.message).toBe(message);
      expect(r.problem?.fix).toMatch(fix);
      expect(r.problem?.fix).toMatch(/Check again\.$/);
    });
  }

  test("a shared Drive video plays, with its title", async () => {
    const r = await resolveVideoLink(DRIVE, fakeDeps({ [DRIVE]: { status: 200, body: '<meta property="og:title" content="Kick-off call.mp4"><title>Kick-off call.mp4 - Google Drive</title>' } }));
    expect(r).toMatchObject({ status: "ok", problem: null, title: "Kick-off call.mp4", tracking: "estimated", durationSeconds: null });
    expect(r.thumbnailUrl).toContain("drive.google.com/thumbnail");
  });

  test("404 → not found", async () => {
    const r = await resolveVideoLink(DRIVE, fakeDeps({ [DRIVE]: { status: 404 } }));
    expect(r.status).toBe("not_found");
    expect(r.problem?.message).toBe("This Drive video wasn't found. It may have been deleted or moved.");
  });

  test("X-Frame-Options: DENY on a generic page → not embeddable", async () => {
    const r = await resolveVideoLink("https://videos.example.com/watch/1", fakeDeps({ "https://videos.example.com/": { status: 200, headers: { "x-frame-options": "DENY" }, body: "<title>Demo</title>" } }));
    expect(r.status).toBe("not_embeddable");
    expect(r.problem?.message).toBe("This page doesn't allow other sites to show it.");
    const ok = await resolveVideoLink("https://videos.example.com/watch/1", fakeDeps({ "https://videos.example.com/": { status: 200, headers: { "content-security-policy": "frame-ancestors *" } } }));
    expect(ok.status).toBe("ok");
  });

  test("SSRF: loopback and the metadata address are refused before any request", async () => {
    const seen: string[] = [];
    for (const url of ["http://127.0.0.1/a.mp4", "http://169.254.169.254/latest/meta-data/", "http://[::1]/x.mp4", "http://10.0.0.5/v.webm"]) {
      const r = await resolveVideoLink(url, fakeDeps({}, seen));
      expect(r.status, url).toBe("unsupported");
    }
    expect(seen).toEqual([]);
    // A public name that resolves to a private address is refused too.
    await expect(safeFetch("https://internal.example.com/", {}, { ...fakeDeps({}, seen), lookup: async () => ["192.168.1.10"] })).rejects.toBeInstanceOf(BlockedUrlError);
    // A redirect to a private address is refused at that hop.
    const hop = await resolveVideoLink("https://cdn.example.com/v.mp4", {
      ...fakeDeps({ "https://cdn.example.com/": { status: 302, headers: { location: "http://169.254.169.254/x.mp4" } } }, seen),
    });
    expect(hop.status).toBe("unsupported");
    expect(seen).toEqual(["HEAD https://cdn.example.com/v.mp4"]);
  });

  test("address rules", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "::", "fe80::1", "fd00::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "64:ff9b::a9fe:a9fe"]) {
      expect(isBlockedAddress(ip), ip).toBe(true);
    }
    for (const ip of ["142.250.1.1", "8.8.8.8", "2606:4700::1111", "::ffff:8.8.8.8"]) expect(isBlockedAddress(ip), ip).toBe(false);
  });

  test("too many redirects", async () => {
    await expect(safeFetch("https://a.example.com/", { maxRedirects: 2 }, fakeDeps({ "https://a.example.com/": { status: 302, headers: { location: "/again" } } }))).rejects.toThrow(/too many/);
  });

  test("YouTube and Vimeo oEmbed: title, private, duration", async () => {
    const yt = await resolveVideoLink("https://youtu.be/dQw4w9WgXcQ", {
      ...fakeDeps({ "https://www.youtube.com/oembed": { status: 200, body: JSON.stringify({ title: "Kick-off" }) } }),
      youtubeDuration: async () => 212,
    });
    expect(yt).toMatchObject({ status: "ok", title: "Kick-off", durationSeconds: 212, durationSource: "provider" });
    const ytPrivate = await resolveVideoLink("https://youtu.be/dQw4w9WgXcQ", fakeDeps({ "https://www.youtube.com/oembed": { status: 401 } }));
    expect(ytPrivate.status).toBe("private");
    const vimeo = await resolveVideoLink("https://vimeo.com/76979871", fakeDeps({ "https://vimeo.com/api/oembed.json": { status: 200, body: JSON.stringify({ title: "Demo", duration: 95, thumbnail_url: "https://i.vimeocdn.com/x.jpg" }) } }));
    expect(vimeo).toMatchObject({ status: "ok", durationSeconds: 95, thumbnailUrl: "https://i.vimeocdn.com/x.jpg" });
    const vimeoPrivate = await resolveVideoLink("https://vimeo.com/76979871", fakeDeps({ "https://vimeo.com/api/oembed.json": { status: 403 } }));
    expect(vimeoPrivate.status).toBe("private");
    expect(vimeoPrivate.problem?.fix).toContain("Privacy");
  });

  test("Dropbox: raw link checked as a video file", async () => {
    const seen: string[] = [];
    const r = await resolveVideoLink(
      "https://www.dropbox.com/s/abc/kickoff.mp4?dl=0",
      fakeDeps(
        {
          "https://www.dropbox.com/s/abc/kickoff.mp4?raw=1": { status: 302, headers: { location: "https://uc123.dl.dropboxusercontent.com/cd/0/inline/kickoff.mp4" } },
          "https://uc123.dl.dropboxusercontent.com/": { status: 200, headers: { "content-type": "video/mp4" } },
        },
        seen,
      ),
    );
    expect(r).toMatchObject({ kind: "dropbox", status: "ok", tracking: "exact", playerKind: "html5", playbackUrl: "https://www.dropbox.com/s/abc/kickoff.mp4?raw=1" });
    expect(seen[0]).toBe("HEAD https://www.dropbox.com/s/abc/kickoff.mp4?raw=1");
    const page = await resolveVideoLink("https://www.dropbox.com/s/abc/kickoff.mp4", fakeDeps({ "https://www.dropbox.com/": { status: 200, headers: { "content-type": "text/html" } } }));
    expect(page.status).toBe("unsupported");
  });

  test("an expired presigned link is caught without a request", async () => {
    const seen: string[] = [];
    const r = await resolveVideoLink("https://b.s3.amazonaws.com/v.mp4?X-Amz-Date=20260101T000000Z&X-Amz-Expires=60", fakeDeps({}, seen));
    expect(r.status).toBe("unreachable");
    expect(r.problem?.message).toBe("This file link has expired.");
    expect(seen).toEqual([]);
  });

  test("1drv.ms is expanded into its embed form", async () => {
    const r = await resolveVideoLink(
      "https://1drv.ms/v/s!AbC",
      fakeDeps({
        "https://1drv.ms/": { status: 301, headers: { location: "https://onedrive.live.com/redir?cid=C1&resid=C1!5&authkey=!K" } },
        "https://onedrive.live.com/redir": { status: 200, body: "<title>Demo.mp4</title>" },
      }),
    );
    expect(r).toMatchObject({ kind: "onedrive", status: "ok", embedUrl: "https://onedrive.live.com/embed?cid=C1&resid=C1%215&authkey=%21K" });
    const priv = await resolveVideoLink(
      "https://oyelabs.sharepoint.com/:v:/s/T/abc",
      fakeDeps({ "https://oyelabs.sharepoint.com/": { status: 302, headers: { location: "https://login.microsoftonline.com/x" } }, "https://login.microsoftonline.com/": { status: 200 } }),
    );
    expect(priv.status).toBe("private");
  });

  test("garbage", async () => {
    const r = await resolveVideoLink("not a link", fakeDeps({}));
    expect(r.status).toBe("unsupported");
    expect(r.problem?.fix).toContain("https://");
  });
});

describe("doc links", () => {
  test("a private Google Doc", async () => {
    const r = await resolveDocLink(
      "https://docs.google.com/document/d/1AbCdEfGhIjK/edit",
      fakeDeps({ "https://docs.google.com/document": { status: 302, headers: { location: "https://accounts.google.com/v3/signin" } }, "https://accounts.google.com/": { status: 200 } }),
    );
    expect(r).toMatchObject({ kind: "gdoc", status: "private", fetchUrl: "https://docs.google.com/document/d/1AbCdEfGhIjK/export?format=txt" });
    expect(r.problem?.fix).toContain("Anyone with the link");
  });
});

describe("helpers", () => {
  test("page titles and framing headers", () => {
    expect(pageTitle("<title>Process &amp; rates - Google Drive</title>")).toBe("Process & rates");
    expect(pageTitle("<title>Handover checklist - Google Docs</title>")).toBe("Handover checklist");
    expect(pageTitle("<title>Sign in</title>")).toBeNull();
    expect(framingForbidden(new Headers({ "x-frame-options": "SAMEORIGIN" }))).toBe(true);
    expect(framingForbidden(new Headers({ "content-security-policy": "default-src 'self'; frame-ancestors 'self'" }))).toBe(true);
    expect(framingForbidden(new Headers({ "content-security-policy": "frame-ancestors https:" }))).toBe(false);
    expect(framingForbidden(new Headers())).toBe(false);
  });
});
