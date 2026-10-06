import type { ReactNode } from "react";

/*
 * The dependency-free half of `RichText`: the Markdown subset's block parser, the inline
 * tokeniser and the code block. Split out (and re-exported by RichText) so the v5 lesson player can
 * use them without pulling in term links, popovers and the handbook schemas.
 */

export type Block =
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

/**
 * Inline formatting: `code`, **bold** and *emphasis*.
 *
 * Emphasis follows CommonMark's rule -- the opening `*` must be followed by a non-space and the
 * closing `*` preceded by one -- so a literal asterisk with a space after it (`SELECT * FROM`,
 * a `* @param` line) is left alone. `**bold**` is matched first in the same alternation, so it
 * never decomposes into two emphasis runs.
 */
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|(?<!\*)\*(?!\s)[^*\n]+?(?<!\s)\*(?!\*))/g;

/** The tokenising step, split out so it can be tested without a DOM. */
export function splitInline(text: string): string[] {
  return text.split(INLINE);
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

