import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * The curriculum's deliberately small Markdown subset:
 *   paragraphs (blank-line separated), "- " bullet lists, "1. " numbered lists,
 *   `inline code`, **bold**, and fenced ```lang code blocks (highlighted for JS/TS/JSX).
 */

type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; lang: string; code: string };

export function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (!para.length) return;
    if (para.every((l) => /^\s*[-*] /.test(l))) blocks.push({ kind: "ul", items: para.map((l) => l.replace(/^\s*[-*] /, "")) });
    else if (para.every((l) => /^\s*\d+[.)] /.test(l))) blocks.push({ kind: "ol", items: para.map((l) => l.replace(/^\s*\d+[.)] /, "")) });
    else blocks.push({ kind: "p", text: para.join(" ") });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^\s*```(\w*)\s*$/.exec(line);
    if (fence) {
      flush();
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i++]);
      blocks.push({ kind: "code", lang: fence[1] || "", code: code.join("\n") });
      continue;
    }
    if (line.trim() === "") flush();
    else para.push(line);
  }
  flush();
  return blocks;
}

/** Inline formatting: `code` and **bold**. */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
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
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

const JS_LANGS = new Set(["js", "javascript", "ts", "typescript", "jsx", "tsx", "mjs", "cjs", ""]);
const KEYWORDS =
  "abstract as async await break case catch class const continue debugger default delete do else enum export extends false finally for from function get if implements import in infer instanceof interface keyof let new null of private protected public readonly return satisfies set static super switch this throw true try type typeof undefined var void while with yield";
const KEYWORD_SET = new Set(KEYWORDS.split(" "));
const TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?\b)|([A-Za-z_$][\w$]*)/g;

/** Tiny highlighter for JS-family snippets: comments, strings, numbers, keywords. */
function highlight(code: string, lang: string): ReactNode {
  if (!JS_LANGS.has(lang.toLowerCase())) return code;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [tok, comment, str, num, word] = m;
    const cls = comment
      ? "text-editor-foreground/45 italic"
      : str
        ? "text-[#8FD4B5]"
        : num
          ? "text-[#F0B870]"
          : word && KEYWORD_SET.has(word)
            ? "text-[#B7AEF8]"
            : undefined;
    out.push(cls ? (
      <span key={m.index} className={cls}>
        {tok}
      </span>
    ) : (
      tok
    ));
    last = m.index + tok.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-editor-gutter bg-editor text-editor-foreground">
      {lang && (
        <div className="border-b border-white/10 bg-editor-gutter px-3 py-1 font-mono text-[11px] text-editor-foreground/55">
          {lang}
        </div>
      )}
      {/* Focusable so keyboard users can scroll long lines. */}
      <pre tabIndex={0} className="overflow-x-auto px-3.5 py-3 font-mono text-[13px] leading-6" style={{ tabSize: 2 }}>
        <code>{highlight(code, lang)}</code>
      </pre>
    </div>
  );
}

export function RichText({ text, className, size = "sm" }: { text: string; className?: string; size?: "sm" | "base" }) {
  const blocks = parseBlocks(text.trim());
  return (
    <div className={cn("space-y-3 leading-relaxed", size === "sm" ? "text-sm" : "text-base", className)}>
      {blocks.map((block, i) => {
        if (block.kind === "code") return <CodeBlock key={i} code={block.code} lang={block.lang} />;
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
