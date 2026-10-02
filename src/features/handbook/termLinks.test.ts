import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RichText } from "@/components/content/RichText";
import type { GlossaryTerm } from "@shared/handbook";
import { TermCardBody } from "./TermLink";
import { humaniseId, isPlaceholder, splitTermLinks, withoutMarker } from "./termLinks";
import { loadGlossary, primeGlossary, resetGlossary } from "./useGlossary";

const CR: GlossaryTerm = {
  id: "change-request",
  name: "Change request",
  aka: ["CR"],
  category: "scope",
  projectTypes: ["custom", "whitelabel"],
  definition: "A formal request to change agreed scope.",
  oyelabsMeaning: "[Oyelabs SOP – admin to confirm] Who approves a CR and how it is priced.",
  clientSentence: "That's outside what we agreed, so I'll raise a change request with the cost and timeline.",
  status: "to-confirm",
};
const BUG: GlossaryTerm = { ...CR, id: "bug", name: "Bug", aka: [], oyelabsMeaning: "Logged in Jira with steps to reproduce.", status: "confirmed" };

afterEach(() => {
  resetGlossary();
  vi.unstubAllGlobals();
});

describe("splitTermLinks", () => {
  it("returns plain text untouched", () => {
    expect(splitTermLinks("no links here")).toEqual([{ kind: "text", text: "no links here" }]);
  });

  it("splits a bare link and a labelled link", () => {
    expect(splitTermLinks("Raise a [[term:change-request|CR]] for any [[term:new-feature]].")).toEqual([
      { kind: "text", text: "Raise a " },
      { kind: "term", id: "change-request", label: "CR", raw: "[[term:change-request|CR]]" },
      { kind: "text", text: " for any " },
      { kind: "term", id: "new-feature", raw: "[[term:new-feature]]" },
      { kind: "text", text: "." },
    ]);
  });

  it("handles adjacent links and links at the edges", () => {
    const parts = splitTermLinks("[[term:bug]][[term:enhancement]]");
    expect(parts.map((p) => p.kind)).toEqual(["term", "term"]);
  });

  it("is stable across repeated calls (no leaked regex state)", () => {
    const text = "a [[term:bug]] b";
    expect(splitTermLinks(text)).toEqual(splitTermLinks(text));
  });

  it("ignores malformed links", () => {
    expect(splitTermLinks("[[term:Bad_Id]] and [[term:]]")).toEqual([{ kind: "text", text: "[[term:Bad_Id]] and [[term:]]" }]);
  });
});

describe("placeholder helpers", () => {
  it("spots the admin-to-confirm marker and strips it", () => {
    expect(isPlaceholder(CR.oyelabsMeaning)).toBe(true);
    expect(isPlaceholder(BUG.oyelabsMeaning)).toBe(false);
    expect(withoutMarker(CR.oyelabsMeaning)).toBe("Who approves a CR and how it is priced.");
    expect(humaniseId("change-request")).toBe("change request");
  });
});

const render = (node: ReturnType<typeof createElement>) => renderToStaticMarkup(createElement(MemoryRouter, null, node));

describe("term links in RichText", () => {
  it("renders a known term as a button with its label", () => {
    primeGlossary([CR, BUG]);
    const html = render(createElement(RichText, { text: "Raise a [[term:change-request|CR]] now." }));
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>CR<\/button>/);
    expect(html).toContain("decoration-dotted");
    expect(html).toContain('aria-haspopup="dialog"');
  });

  it("uses the term name when there is no label", () => {
    primeGlossary([CR, BUG]);
    expect(render(createElement(RichText, { text: "A [[term:bug]] is…" }))).toMatch(/<button[^>]*>Bug<\/button>/);
  });

  it("renders unknown ids as plain text", () => {
    primeGlossary([CR]);
    const html = render(createElement(RichText, { text: "See [[term:mystery-term]] and [[term:other|that]]." }));
    expect(html).not.toContain("<button");
    expect(html).toContain("See mystery term and that.");
  });

  it("leaves links inside inline code alone, and works inside bold", () => {
    primeGlossary([CR]);
    const html = render(createElement(RichText, { text: "`[[term:change-request]]` and **a [[term:change-request|CR]]**" }));
    expect(html).toContain("<code");
    expect(html).toContain("[[term:change-request]]</code>");
    expect(html).toMatch(/<strong>a <button[^>]*>CR<\/button><\/strong>/);
  });
});

describe("TermCardBody", () => {
  it("shows every part, with the to-confirm note for a placeholder meaning", () => {
    const html = render(createElement(TermCardBody, { term: CR }));
    expect(html).toContain("Change request");
    expect(html).toContain("Industry standard – to confirm");
    expect(html).toContain("At Oyelabs:");
    expect(html).toContain("To confirm. </span>Who approves a CR");
    expect(html).not.toContain("[Oyelabs SOP");
    expect(html).toContain("Say it to a client:");
    expect(html).toContain('href="/glossary/change-request"');
    expect(html).toContain("Open in glossary");
  });

  it("shows the confirmed chip and the real meaning", () => {
    const html = render(createElement(TermCardBody, { term: BUG }));
    expect(html).toContain("Confirmed by Oyelabs");
    expect(html).toContain("Logged in Jira");
    expect(html).not.toContain("To confirm.");
  });
});

describe("useGlossary cache", () => {
  it("loads the glossary once per session", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ terms: [CR] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([loadGlossary(), loadGlossary()]);
    await loadGlossary();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/handbook/glossary");
  });
});
