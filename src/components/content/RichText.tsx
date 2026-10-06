import { Fragment } from "react";

import { TermLink } from "@/features/handbook/TermLink";
import { splitTermLinks } from "@/features/handbook/termLinks";
import { parsePracticeBlock, type PracticeBlock } from "@/lib/practiceBlocks";
import { cn } from "@/lib/utils";

import { CodeBlock, parseBlocks, splitInline } from "./markdownCore";

export { CodeBlock, parseBlocks, splitInline };

/*
 * The curriculum's deliberately small Markdown subset:
 *   paragraphs (blank-line separated), "- " bullet lists, "1. " numbered lists,
 *   `inline code`, **bold**, *emphasis*, and fenced ```lang code blocks (highlighted for JS/TS/JSX).
 * v4.2: `[[term:id]]` and `[[term:id|label]]` render as handbook term links (not inside code).
 */

export function InlineText({ text }: { text: string }) {
  const parts = splitInline(text);
  return (
    <>
      {parts.map((part, i) => {
        if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="rounded-sm bg-foreground/[0.07] px-1 py-px font-mono text-[0.86em]">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i}>
              <TermText text={part.slice(2, -2)} />
            </strong>
          );
        }
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
          return (
            <em key={i}>
              <TermText text={part.slice(1, -1)} />
            </em>
          );
        }
        return <TermText key={i} text={part} />;
      })}
    </>
  );
}

/** Plain text with any handbook term links turned into `TermLink`s. */
export function TermText({ text }: { text: string }) {
  if (!text.includes("[[term:")) return <>{text}</>;
  return (
    <>
      {splitTermLinks(text).map((segment, i) =>
        segment.kind === "term" ? <TermLink key={i} id={segment.id} label={segment.label} /> : <Fragment key={i}>{segment.text}</Fragment>,
      )}
    </>
  );
}

export function RichText({ text, className, size = "sm" }: { text: string; className?: string; size?: "sm" | "base" }) {
  const blocks = parseBlocks(text.trim());
  return (
    <div className={cn("space-y-3 leading-relaxed", size === "sm" ? "text-sm" : "text-base", className)}>
      {blocks.map((block, i) => {
        if (block.kind === "code") {
          const practice = parsePracticeBlock(block.lang, block.code);
          if (practice) return <PracticeCard key={i} block={practice} />;
          return <CodeBlock key={i} code={block.code} lang={block.lang} />;
        }
        if (block.kind === "ul" || block.kind === "ol") {
          const List = block.kind === "ul" ? "ul" : "ol";
          return (
            <List key={i} className={cn("space-y-1 pl-5 marker:text-muted-foreground", block.kind === "ul" ? "list-disc" : "list-decimal")}>
              {block.items.map((item, j) => (
                <li key={j}>
                  <InlineText text={item} />
                </li>
              ))}
            </List>
          );
        }
        return (
          <p key={i}>
            <InlineText text={block.text} />
          </p>
        );
      })}
    </div>
  );
}

/**
 * A quick check or task from the v5 block editor (a ```quiz / ```task fence), shown quietly on the
 * older screens instead of as raw JSON. The new lesson view makes them interactive.
 */
function PracticeCard({ block }: { block: PracticeBlock }) {
  return (
    <aside className="rounded-md border border-border bg-surface-sunken px-4 py-3" aria-label="Practice" data-practice={block.kind}>
      <p className="font-display text-sm font-semibold">{block.kind === "quiz" ? "Quick check" : "Try this"}</p>
      {block.kind === "quiz" ? (
        <>
          <p className="mt-1 font-medium">
            <InlineText text={block.question} />
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-muted-foreground">
            {block.options.map((o, j) => (
              <li key={j}>
                <InlineText text={o} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Think about your answer. The new design lets you check it.</p>
        </>
      ) : (
        <>
          <p className="mt-1">
            <InlineText text={block.instructions} />
          </p>
          {block.doneWhen ? (
            <p className="mt-2 text-muted-foreground">
              <span className="font-medium text-foreground">Done when: </span>
              <InlineText text={block.doneWhen} />
            </p>
          ) : null}
        </>
      )}
    </aside>
  );
}
