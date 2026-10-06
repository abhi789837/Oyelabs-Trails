/**
 * The block editor's document ↔ the lesson shape the course API already saves
 * (`UpsertCourseTopicRequest`: title, body, video, videoTitle, links, estMinutes).
 *
 * Pure (Tiptap JSON in, plain objects out), so it is tested without a browser.
 *
 * | Block    | Saved as                                                                   |
 * |----------|----------------------------------------------------------------------------|
 * | video    | `video` + `videoTitle` (one per lesson; it always shows first)             |
 * | reading  | paragraphs, `- ` and `1. ` lists, `code`, **bold**, *emphasis* in `body`    |
 * | code     | a fenced block in `body`: ```js … ```                                      |
 * | quiz     | a fenced block in `body`: ```quiz {"question","options","correct","why"} ```|
 * | task     | a fenced block in `body`: ```task {"instructions","doneWhen"} ```           |
 *
 * That is the Markdown subset `RichText` already renders, so an older screen still shows every
 * lesson; quiz and task blocks show there as their JSON until a newer screen draws them.
 */

export interface PMMark {
  type: string;
}

export interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: PMMark[];
}

export interface PMDoc {
  type: "doc";
  content: PMNode[];
}

export interface QuizAttrs {
  question: string;
  options: string[];
  /** Indexes of the right options. */
  correct: number[];
  why: string;
}

export interface TaskAttrs {
  instructions: string;
  doneWhen: string;
}

export interface LessonContent {
  body: string;
  videoId: string | null;
  videoTitle: string | null;
}

export interface Serialised {
  body: string;
  /** What to send as `video` (an id); undefined when the lesson has none. */
  video: string | undefined;
  videoTitle: string | undefined;
  /** Plain warnings for the author ("only one video per lesson"). */
  warnings: string[];
}

export const EMPTY_QUIZ: QuizAttrs = { question: "", options: ["", ""], correct: [0], why: "" };
export const EMPTY_TASK: TaskAttrs = { instructions: "", doneWhen: "" };

// ---------------------------------------------------------------------------
// Inline text
// ---------------------------------------------------------------------------

function inlineToMarkdown(nodes: readonly PMNode[] | undefined): string {
  let out = "";
  for (const n of nodes ?? []) {
    if (n.type === "hardBreak") {
      out += "\n";
      continue;
    }
    if (n.type !== "text" || !n.text) continue;
    const marks = new Set((n.marks ?? []).map((m) => m.type));
    if (marks.has("code")) out += `\`${n.text}\``;
    else if (marks.has("bold")) out += `**${n.text}**`;
    else if (marks.has("italic")) out += `*${n.text}*`;
    else out += n.text;
  }
  return out;
}

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|(?<!\*)\*(?!\s)[^*\n]+?(?<!\s)\*(?!\*))/g;

export function markdownToInline(text: string): PMNode[] {
  const out: PMNode[] = [];
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (i > 0) out.push({ type: "hardBreak" });
    for (const part of line.split(INLINE)) {
      if (!part) continue;
      if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) out.push({ type: "text", text: part.slice(1, -1), marks: [{ type: "code" }] });
      else if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) out.push({ type: "text", text: part.slice(2, -2), marks: [{ type: "bold" }] });
      else if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) out.push({ type: "text", text: part.slice(1, -1), marks: [{ type: "italic" }] });
      else out.push({ type: "text", text: part });
    }
  });
  return out;
}

function textOf(node: PMNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  return (node.content ?? []).map(textOf).join("");
}

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function quizAttrs(raw: Record<string, unknown> | undefined): QuizAttrs {
  const options = Array.isArray(raw?.options) ? (raw!.options as unknown[]).map(str) : [...EMPTY_QUIZ.options];
  const correct = Array.isArray(raw?.correct) ? (raw!.correct as unknown[]).filter((n): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) < options.length) : [];
  return { question: str(raw?.question), options, correct, why: str(raw?.why) };
}

export function taskAttrs(raw: Record<string, unknown> | undefined): TaskAttrs {
  return { instructions: str(raw?.instructions), doneWhen: str(raw?.doneWhen) };
}

/** What's missing from a quiz before it can be saved, in plain words; null when it's fine. */
export function quizProblem(q: QuizAttrs): string | null {
  if (!q.question.trim()) return "Add the question.";
  if (q.options.filter((o) => o.trim()).length < 2) return "Add at least two answers.";
  if (!q.correct.some((i) => q.options[i]?.trim())) return "Tick the right answer.";
  return null;
}

// ---------------------------------------------------------------------------
// Document → lesson
// ---------------------------------------------------------------------------

export function docToLesson(doc: PMDoc): Serialised {
  const parts: string[] = [];
  const warnings: string[] = [];
  let video: { id: string; title: string } | null = null;

  // A block dropped inside a list item (a quick check, some code) is saved after that list.
  const flat: PMNode[] = [];
  for (const node of doc.content ?? []) {
    if (node.type !== "bulletList" && node.type !== "orderedList") {
      flat.push(node);
      continue;
    }
    const items: PMNode[] = [];
    const after: PMNode[] = [];
    for (const li of node.content ?? []) {
      const paras = (li.content ?? []).filter((c) => c.type === "paragraph");
      after.push(...(li.content ?? []).filter((c) => c.type !== "paragraph"));
      items.push({ ...li, content: paras });
    }
    flat.push({ ...node, content: items }, ...after);
  }

  for (const node of flat) {
    switch (node.type) {
      case "videoBlock": {
        const id = str(node.attrs?.videoId).trim();
        if (!id) break;
        if (video) warnings.push("A lesson has one video. Only the first one is saved.");
        else video = { id, title: str(node.attrs?.title).trim() };
        break;
      }
      case "paragraph": {
        const md = inlineToMarkdown(node.content).trim();
        if (md) parts.push(md);
        break;
      }
      case "bulletList":
      case "orderedList": {
        const items = (node.content ?? []).map((li) => (li.content ?? []).map((p) => inlineToMarkdown(p.content)).join(" ").replace(/\n/g, " ").trim()).filter(Boolean);
        if (items.length) parts.push(items.map((t, i) => (node.type === "bulletList" ? `- ${t}` : `${i + 1}. ${t}`)).join("\n"));
        break;
      }
      case "codeBlock": {
        const code = textOf(node).replace(/\n+$/, "");
        const lang = str(node.attrs?.language).replace(/[^\w]/g, "");
        if (code.trim()) parts.push(`\`\`\`${lang}\n${code}\n\`\`\``);
        break;
      }
      case "quizBlock": {
        const q = quizAttrs(node.attrs);
        if (quizProblem(q)) {
          if (q.question.trim() || q.options.some((o) => o.trim())) warnings.push(`A quick check isn't finished: ${quizProblem(q)}`);
          break;
        }
        parts.push(`\`\`\`quiz\n${JSON.stringify(q)}\n\`\`\``);
        break;
      }
      case "taskBlock": {
        const t = taskAttrs(node.attrs);
        if (!t.instructions.trim()) break;
        parts.push(`\`\`\`task\n${JSON.stringify(t)}\n\`\`\``);
        break;
      }
      default: {
        const text = textOf(node).trim();
        if (text) parts.push(text);
      }
    }
  }
  return { body: parts.join("\n\n"), video: video?.id, videoTitle: video?.title || undefined, warnings };
}

// ---------------------------------------------------------------------------
// Lesson → document
// ---------------------------------------------------------------------------

function paragraph(text: string): PMNode {
  const content = markdownToInline(text);
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(text) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function lessonToDoc(lesson: LessonContent): PMDoc {
  const content: PMNode[] = [];
  if (lesson.videoId) content.push({ type: "videoBlock", attrs: { videoId: lesson.videoId, title: lesson.videoTitle ?? "" } });

  const lines = lesson.body.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  const flush = () => {
    if (!para.length) return;
    if (para.every((l) => /^\s*[-*] /.test(l))) {
      content.push({ type: "bulletList", content: para.map((l) => ({ type: "listItem", content: [paragraph(l.replace(/^\s*[-*] /, ""))] })) });
    } else if (para.every((l) => /^\s*\d+[.)] /.test(l))) {
      content.push({ type: "orderedList", attrs: { start: 1 }, content: para.map((l) => ({ type: "listItem", content: [paragraph(l.replace(/^\s*\d+[.)] /, ""))] })) });
    } else {
      content.push(paragraph(para.join("\n")));
    }
    para = [];
  };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    const fence = /^\s*```(\w*)\s*$/.exec(line);
    if (fence) {
      flush();
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i]!)) code.push(lines[i++]!);
      const lang = fence[1] ?? "";
      const text = code.join("\n");
      const json = lang === "quiz" || lang === "task" ? parseJson(text) : null;
      if (lang === "quiz" && json) content.push({ type: "quizBlock", attrs: { ...quizAttrs(json) } });
      else if (lang === "task" && json) content.push({ type: "taskBlock", attrs: { ...taskAttrs(json) } });
      else content.push({ type: "codeBlock", attrs: { language: lang || null }, content: text ? [{ type: "text", text }] : undefined });
      continue;
    }
    if (line.trim() === "") flush();
    else para.push(line);
  }
  flush();
  if (!content.length) content.push({ type: "paragraph" });
  return { type: "doc", content };
}
