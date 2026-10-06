import { Fragment, type ReactNode } from "react";

import { cn } from "@/v5/design/cn";

/**
 * The small Markdown subset quiz items and key points use: ``` fenced code blocks and `inline
 * code`. Everything else is plain text (whitespace kept). No HTML is ever injected.
 */
export function parseCardText(text: string): ({ kind: "text"; value: string } | { kind: "code"; value: string } | { kind: "block"; value: string })[] {
  const out: ({ kind: "text"; value: string } | { kind: "code"; value: string } | { kind: "block"; value: string })[] = [];
  const fence = /```[a-zA-Z0-9-]*\n?([\s\S]*?)```/g;
  let last = 0;
  const pushInline = (chunk: string) => {
    const parts = chunk.split(/(`[^`\n]+`)/g);
    for (const part of parts) {
      if (!part) continue;
      if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) out.push({ kind: "code", value: part.slice(1, -1) });
      else out.push({ kind: "text", value: part });
    }
  };
  for (const match of text.matchAll(fence)) {
    pushInline(text.slice(last, match.index));
    out.push({ kind: "block", value: match[1].replace(/\n$/, "") });
    last = (match.index ?? 0) + match[0].length;
  }
  pushInline(text.slice(last));
  return out;
}

export function CardText({ text, className }: { text: string; className?: string }): ReactNode {
  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parseCardText(text).map((part, i) =>
        part.kind === "block" ? (
          <code key={i} className="my-2 block whitespace-pre-wrap break-words rounded-control bg-sunken p-3 font-mono text-small font-normal text-fg-1">
            {part.value}
          </code>
        ) : part.kind === "code" ? (
          <code key={i} className="rounded bg-sunken px-1 py-0.5 font-mono text-[0.9em] font-normal">
            {part.value}
          </code>
        ) : (
          <Fragment key={i}>{part.value}</Fragment>
        ),
      )}
    </span>
  );
}
