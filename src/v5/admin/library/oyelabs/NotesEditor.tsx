import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import type { NotesDoc } from "@shared/oyelabsCourses";

import { Button, Skeleton, cn } from "@/v5/design";

import { lessonStarterKit } from "../editor/schema";

/**
 * A module's notes: rich text with the v5 lesson editor's Tiptap setup (`lessonStarterKit`), so
 * learners see the same formatting the lesson text has. Controlled loosely: the parent gets the
 * JSON on every change; an empty editor reports `null`.
 */

function ToolButton({ label, icon, active, onClick }: { label: string; icon: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className={cn("size-8", active && "bg-brand-soft text-brand-fg")} aria-label={label} aria-pressed={active} onClick={onClick}>
      {icon}
    </Button>
  );
}

function Toolbar({ editor, label }: { editor: Editor; label: string }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({ bold: e.isActive("bold"), italic: e.isActive("italic"), bullet: e.isActive("bulletList"), ordered: e.isActive("orderedList") }),
  });
  return (
    <div role="toolbar" aria-label={`${label}: formatting`} className="flex flex-wrap items-center gap-0.5 rounded-t-control border border-b-0 border-line-1 bg-surface-1 p-1">
      <ToolButton label="Bold" icon={<Bold />} active={s.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolButton label="Emphasis" icon={<Italic />} active={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolButton label="Bulleted list" icon={<List />} active={s.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolButton label="Numbered list" icon={<ListOrdered />} active={s.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
    </div>
  );
}

export function NotesEditor({ value, onChange, label, labelId }: { value: NotesDoc | null; onChange: (next: NotesDoc | null) => void; label: string; labelId: string }) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const editor = useEditor({
    extensions: [lessonStarterKit],
    content: (value as JSONContent | null) ?? "",
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
        class:
          "v5-article min-h-32 rounded-b-control border border-line-1 bg-surface-1 px-3 py-2 text-body text-fg-1 outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-6",
      },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(e.isEmpty ? null : (e.getJSON() as NotesDoc)),
  });

  // A draft chosen after mount ("Keep my unsaved changes") replaces the content once.
  const lastSet = useRef(value);
  useEffect(() => {
    if (!editor || value === lastSet.current) return;
    lastSet.current = value;
    const current = editor.isEmpty ? null : editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(value)) editor.commands.setContent((value as JSONContent | null) ?? "", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <Skeleton className="h-40 w-full" />;
  return (
    <div>
      <Toolbar editor={editor} label={label} />
      <EditorContent editor={editor} />
    </div>
  );
}
