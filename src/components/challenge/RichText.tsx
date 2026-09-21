import { Fragment, type ReactNode } from "react";

/** Renders `inline code` spans inside a line of text. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
      <code key={i} className="rounded-sm bg-foreground/[0.07] px-1 py-px font-mono text-[0.85em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/**
 * A deliberately tiny Markdown subset for challenge instructions:
 * paragraphs separated by blank lines, "- " bullet lists, and `inline code`.
 */
export function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="max-w-prose space-y-3 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.trimStart().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.trimStart().slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderInline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
