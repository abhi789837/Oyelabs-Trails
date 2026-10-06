import { createContext, lazy, Suspense, useState, type ReactNode } from "react";
import { Play } from "lucide-react";

import { runnableKind } from "@shared/lesson";

import { CodeBlock } from "@/components/content/RichText";
import { useGlossary } from "@/features/handbook/useGlossary";
import { Button, Tooltip, cn } from "@/v5/design";

import { blockTree, type ArticleBlock, type Inline } from "./article";

const TryIt = lazy(() => import("./TryIt"));

/** The lesson whose code "Try it" runs (the server checks the learner may open it). */
export const LessonTopicContext = createContext<string | null>(null);

function GlossaryTerm({ id, children }: { id: string; children: ReactNode }) {
  const glossary = useGlossary();
  const term = glossary.byId.get(id);
  if (!term) return <>{children}</>;
  return (
    <Tooltip
      content={
        <span className="block max-w-72 text-left">
          <span className="block font-semibold">{term.name}</span>
          <span className="mt-0.5 block">{term.definition}</span>
        </span>
      }
    >
      <button
        type="button"
        className="cursor-help rounded-sm text-inherit underline decoration-brand decoration-dotted decoration-2 underline-offset-4"
        aria-label={`${typeof children === "string" ? children : term.name}: glossary term`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function InlineView({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.k) {
          case "text":
            return <span key={i}>{n.t}</span>;
          case "code":
            return (
              <code key={i} className="rounded-sm bg-sunken px-1 py-px font-mono text-[0.88em]">
                {n.t}
              </code>
            );
          case "strong":
            return (
              <strong key={i}>
                <InlineView nodes={n.c} />
              </strong>
            );
          case "em":
            return (
              <em key={i}>
                <InlineView nodes={n.c} />
              </em>
            );
          case "term":
            return (
              <GlossaryTerm key={i} id={n.id}>
                {n.t}
              </GlossaryTerm>
            );
        }
      })}
    </>
  );
}

/** A code block from the content, with "Try it" for JavaScript, TypeScript, HTML and CSS. */
export function RunnableCode({ code, lang }: { code: string; lang: string }) {
  const kind = runnableKind(lang);
  const [open, setOpen] = useState(false);
  return (
    <div className="not-prose my-4 flex flex-col gap-2">
      <CodeBlock code={code} lang={lang} />
      {kind ? (
        <div>
          <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <Play aria-hidden="true" /> {open ? "Hide the playground" : "Try it"}
          </Button>
        </div>
      ) : null}
      {open && kind ? (
        <Suspense fallback={<p className="text-small text-fg-2">Loading the playground…</p>}>
          <TryIt code={code} lang={lang} kind={kind} />
        </Suspense>
      ) : null}
    </div>
  );
}

export function BlocksView({ blocks, className }: { blocks: ArticleBlock[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {blocks.map((b, i) => {
        if (b.k === "code") return <RunnableCode key={i} code={b.code} lang={b.lang} />;
        if (b.k === "ul" || b.k === "ol") {
          const items = b.items.map((item, j) => (
            <li key={j}>
              <InlineView nodes={item} />
            </li>
          ));
          return b.k === "ul" ? (
            <ul key={i} className="flex list-disc flex-col gap-1 pl-5">
              {items}
            </ul>
          ) : (
            <ol key={i} className="flex list-decimal flex-col gap-1 pl-5">
              {items}
            </ol>
          );
        }
        return (
          <p key={i}>
            <InlineView nodes={b.c} />
          </p>
        );
      })}
    </div>
  );
}

/** Content Markdown with no glossary matching: instructions, quiz prompts, explanations. */
export function LessonMarkdown({ text, className }: { text: string; className?: string }) {
  return <BlocksView blocks={blockTree(text, [], new Set())} className={className} />;
}
