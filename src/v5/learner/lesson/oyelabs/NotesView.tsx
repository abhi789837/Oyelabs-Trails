import type { ReactNode } from "react";

/**
 * v4.5 Phase 2: a module's notes (Tiptap JSON from the editor), shown read-only without loading
 * Tiptap: the StarterKit nodes and marks are mapped to plain elements. Unknown nodes show their
 * text. Links open in a new tab and only http(s)/mailto are kept.
 */
interface Node {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
  content?: Node[];
}

function safeHref(href: unknown): string | null {
  return typeof href === "string" && /^(https?:|mailto:)/i.test(href) ? href : null;
}

function text(node: Node, key: number): ReactNode {
  let out: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") out = <strong>{out}</strong>;
    else if (mark.type === "italic") out = <em>{out}</em>;
    else if (mark.type === "strike") out = <s>{out}</s>;
    else if (mark.type === "code") out = <code>{out}</code>;
    else if (mark.type === "underline") out = <u>{out}</u>;
    else if (mark.type === "link") {
      const href = safeHref(mark.attrs?.href);
      if (href) out = <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-fg underline underline-offset-4">{out}</a>;
    }
  }
  return <span key={key}>{out}</span>;
}

function render(nodes: Node[] | undefined): ReactNode[] {
  return (nodes ?? []).map((node, i) => {
    const kids = render(node.content);
    switch (node.type) {
      case "text":
        return text(node, i);
      case "paragraph":
        return <p key={i}>{kids}</p>;
      case "heading": {
        const level = Math.min(4, Math.max(2, Number(node.attrs?.level ?? 2) + 1));
        return level === 2 ? <h2 key={i}>{kids}</h2> : level === 3 ? <h3 key={i}>{kids}</h3> : <h4 key={i}>{kids}</h4>;
      }
      case "bulletList":
        return <ul key={i}>{kids}</ul>;
      case "orderedList":
        return <ol key={i}>{kids}</ol>;
      case "listItem":
        return <li key={i}>{kids}</li>;
      case "blockquote":
        return <blockquote key={i}>{kids}</blockquote>;
      case "codeBlock":
        return (
          <pre key={i}>
            <code>{kids}</code>
          </pre>
        );
      case "hardBreak":
        return <br key={i} />;
      case "horizontalRule":
        return <hr key={i} />;
      default:
        return <span key={i}>{kids}</span>;
    }
  });
}

export function NotesView({ doc }: { doc: { type: "doc"; content: unknown[] } }) {
  return <div className="v5-article text-body leading-relaxed text-fg-1">{render(doc.content as Node[])}</div>;
}
