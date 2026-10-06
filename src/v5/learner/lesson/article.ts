import { calloutOf, lessonPassages, matchGlossary, type CalloutKind } from "@shared/lesson";

import { parseBlocks, splitInline } from "@/components/content/RichText";
import { humaniseId, splitTermLinks } from "@/features/handbook/termLinks";

/**
 * The Read step's article as a plain tree, built in one pass so "first occurrence" of a glossary
 * term means first in the whole article, in reading order. Rendering is then a pure walk.
 */

export type Inline =
  | { k: "text"; t: string }
  | { k: "code"; t: string }
  | { k: "strong"; c: Inline[] }
  | { k: "em"; c: Inline[] }
  | { k: "term"; t: string; id: string };

export type ArticleBlock = { k: "p"; c: Inline[] } | { k: "ul"; items: Inline[][] } | { k: "ol"; items: Inline[][] } | { k: "code"; lang: string; code: string };

export interface ArticlePassage {
  /** The grounding id (`sum.p1`), which the tutor cites. */
  id: string;
  heading: string | null;
  callout: CalloutKind | null;
  blocks: ArticleBlock[];
}

export interface ArticleSection {
  heading: string | null;
  passages: ArticlePassage[];
}

type Phrases = { phrase: string; termId: string }[];

function plain(text: string, phrases: Phrases, used: Set<string>): Inline[] {
  const out: Inline[] = [];
  for (const seg of splitTermLinks(text)) {
    if (seg.kind === "term") {
      used.add(seg.id);
      out.push({ k: "term", t: seg.label ?? humaniseId(seg.id), id: seg.id });
      continue;
    }
    for (const g of matchGlossary(seg.text, phrases, used)) {
      out.push(g.kind === "term" ? { k: "term", t: g.text, id: g.termId } : { k: "text", t: g.text });
    }
  }
  return out;
}

export function inlineTree(text: string, phrases: Phrases, used: Set<string>): Inline[] {
  const out: Inline[] = [];
  for (const part of splitInline(text)) {
    if (!part) continue;
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) out.push({ k: "code", t: part.slice(1, -1) });
    else if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) out.push({ k: "strong", c: plain(part.slice(2, -2), phrases, used) });
    else if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) out.push({ k: "em", c: plain(part.slice(1, -1), phrases, used) });
    else out.push(...plain(part, phrases, used));
  }
  return out;
}

export function blockTree(text: string, phrases: Phrases, used: Set<string>): ArticleBlock[] {
  return parseBlocks(text.trim()).map((b): ArticleBlock => {
    if (b.kind === "code") return { k: "code", lang: b.lang, code: b.code };
    if (b.kind === "ul") return { k: "ul", items: b.items.map((item) => inlineTree(item, phrases, used)) };
    if (b.kind === "ol") return { k: "ol", items: b.items.map((item) => inlineTree(item, phrases, used)) };
    return { k: "p", c: inlineTree(b.text, phrases, used) };
  });
}

export function buildArticle(summary: string, sections: readonly { heading: string; body: string }[], phrases: Phrases): ArticleSection[] {
  const used = new Set<string>();
  const out: ArticleSection[] = [];
  for (const p of lessonPassages(summary, sections)) {
    const callout = calloutOf(p.text);
    const passage: ArticlePassage = {
      id: p.id,
      heading: p.heading,
      callout: callout?.kind ?? null,
      blocks: blockTree(callout ? callout.body : p.text, phrases, used),
    };
    const last = out[out.length - 1];
    if (last && last.heading === p.heading) last.passages.push(passage);
    else out.push({ heading: p.heading, passages: [passage] });
  }
  return out;
}

/** The DOM id of a passage, for citation links ("sum.p1" → "passage-sum-p1"). */
export function passageDomId(passageId: string): string {
  return `passage-${passageId.replace(/[^a-z0-9]+/gi, "-")}`;
}
