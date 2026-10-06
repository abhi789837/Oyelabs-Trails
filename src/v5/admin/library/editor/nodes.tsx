import { NodeViewWrapper, ReactNodeViewRenderer, type Editor, type ReactNodeViewProps } from "@tiptap/react";
import { ArrowDown, ArrowUp, ClipboardList, ListChecks, PlayCircle, Plus, Trash2, X } from "lucide-react";
import { useId, type ReactNode } from "react";

import { youtubeId } from "@shared/courses";

import { Button, Input, Textarea, cn } from "@/v5/design";

import { quizAttrs, quizProblem, taskAttrs } from "./blocks";
import { QuizBlockBase, TaskBlockBase, VideoBlockBase } from "./schema";

/**
 * The custom blocks: video, quick check (quiz) and task. Each is an atom node whose attributes are
 * edited with ordinary form fields inside the block; `blocks.ts` turns them into the lesson shape.
 * Blocks move with Move up / Move down buttons (no dragging), so the keyboard can do everything.
 */

function moveBlock(editor: Editor, getPos: () => number | undefined, dir: -1 | 1): void {
  const pos = getPos();
  if (pos === undefined) return;
  const { doc } = editor.state;
  const $pos = doc.resolve(pos);
  const index = $pos.index(0);
  const node = doc.child(index);
  const neighbour = index + dir >= 0 && index + dir < doc.childCount ? doc.child(index + dir) : null;
  if (!neighbour) return;
  const tr = editor.state.tr.delete(pos, pos + node.nodeSize);
  const target = dir < 0 ? pos - neighbour.nodeSize : pos + neighbour.nodeSize;
  tr.insert(target, node);
  editor.view.dispatch(tr.scrollIntoView());
}

function BlockFrame({ icon, label, props, children, problem }: { icon: ReactNode; label: string; props: ReactNodeViewProps; children: ReactNode; problem?: string | null }) {
  const { editor, getPos, deleteNode, selected } = props;
  return (
    <NodeViewWrapper
      as="section"
      aria-label={label}
      data-block-kind={props.node.type.name}
      contentEditable={false}
      className={cn("my-3 rounded-card border bg-surface-1 p-3", selected ? "border-focus" : "border-line-1")}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-fg-2 [&_svg]:size-4" aria-hidden="true">
          {icon}
        </span>
        <span className="flex-1 text-small font-semibold text-fg-1">{label}</span>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${label.toLowerCase()} up`} onClick={() => moveBlock(editor, getPos, -1)}>
          <ArrowUp aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${label.toLowerCase()} down`} onClick={() => moveBlock(editor, getPos, 1)}>
          <ArrowDown aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`Remove ${label.toLowerCase()}`} onClick={() => deleteNode()}>
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
      {problem ? <p className="mt-2 text-small text-warning-fg">{problem}</p> : null}
    </NodeViewWrapper>
  );
}

function LabeledInput({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-caption font-medium text-fg-2">
        {label}
      </label>
      {multiline ? (
        <Textarea id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="min-h-20 text-small" />
      ) : (
        <Input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="text-small" />
      )}
    </div>
  );
}

function VideoView(props: ReactNodeViewProps) {
  const videoId = String(props.node.attrs.videoId ?? "");
  const title = String(props.node.attrs.title ?? "");
  const input = String(props.node.attrs.input ?? videoId);
  const parsed = input ? youtubeId(input) : null;
  return (
    <BlockFrame icon={<PlayCircle />} label="Video" props={props} problem={input && !parsed ? "That doesn't look like a YouTube link. Paste the link from the address bar." : null}>
      <LabeledInput
        label="YouTube link"
        value={input}
        placeholder="https://www.youtube.com/watch?v=…"
        onChange={(v) => props.updateAttributes({ input: v, videoId: youtubeId(v) ?? "" })}
      />
      <LabeledInput label="Video title (optional)" value={title} onChange={(v) => props.updateAttributes({ title: v })} />
    </BlockFrame>
  );
}

function QuizView(props: ReactNodeViewProps) {
  const q = quizAttrs(props.node.attrs);
  const set = (patch: Partial<typeof q>) => props.updateAttributes({ ...q, ...patch });
  const touched = q.question.trim() !== "" || q.options.some((o) => o.trim());
  return (
    <BlockFrame icon={<ListChecks />} label="Quick check" props={props} problem={touched ? quizProblem(q) : null}>
      <LabeledInput label="Question" value={q.question} onChange={(v) => set({ question: v })} multiline />
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-caption font-medium text-fg-2">Answers (tick the right ones)</legend>
        {q.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="size-6 shrink-0 accent-[rgb(var(--v5-brand))]"
              aria-label={`Answer ${i + 1} is right`}
              checked={q.correct.includes(i)}
              onChange={(e) => set({ correct: e.target.checked ? [...q.correct, i].sort((a, b) => a - b) : q.correct.filter((c) => c !== i) })}
            />
            <Input aria-label={`Answer ${i + 1}`} value={opt} onChange={(e) => set({ options: q.options.map((o, j) => (j === i ? e.target.value : o)) })} className="text-small" />
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Remove answer ${i + 1}`}
              disabled={q.options.length <= 2}
              onClick={() => set({ options: q.options.filter((_, j) => j !== i), correct: q.correct.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c)) })}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        ))}
        {q.options.length < 6 ? (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => set({ options: [...q.options, ""] })}>
            <Plus aria-hidden="true" />
            Add an answer
          </Button>
        ) : null}
      </fieldset>
      <LabeledInput label="Why it's right (shown after they answer)" value={q.why} onChange={(v) => set({ why: v })} />
    </BlockFrame>
  );
}

function TaskView(props: ReactNodeViewProps) {
  const t = taskAttrs(props.node.attrs);
  return (
    <BlockFrame icon={<ClipboardList />} label="Task" props={props}>
      <LabeledInput label="What to do" value={t.instructions} onChange={(v) => props.updateAttributes({ ...t, instructions: v })} multiline />
      <LabeledInput label="Done when" value={t.doneWhen} placeholder="They can show…" onChange={(v) => props.updateAttributes({ ...t, doneWhen: v })} />
    </BlockFrame>
  );
}

const stopEverything = { stopEvent: () => true };

/** The three blocks with their editing forms (the shapes are in `schema.ts`). */
export const VideoBlock = VideoBlockBase.extend({ addNodeView: () => ReactNodeViewRenderer(VideoView, stopEverything) });
export const QuizBlock = QuizBlockBase.extend({ addNodeView: () => ReactNodeViewRenderer(QuizView, stopEverything) });
export const TaskBlock = TaskBlockBase.extend({ addNodeView: () => ReactNodeViewRenderer(TaskView, stopEverything) });
