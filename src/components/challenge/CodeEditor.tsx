import { forwardRef, useImperativeHandle, useRef, type KeyboardEvent } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  fileName?: string;
  describedBy?: string;
}

/**
 * A plain <textarea> styled as an editor: monospace, line-number gutter, and an
 * editor-dark background in both themes. Tab indents; Esc then Tab leaves the editor.
 */
export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(function CodeEditor(
  { value, onChange, fileName = "solution.js", describedBy },
  forwardedRef,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const escapeArmed = useRef(false);
  useImperativeHandle(forwardedRef, () => textareaRef.current!);

  const lineCount = value.split("\n").length;

  const insert = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    // execCommand keeps the browser's undo stack intact; fall back if it's unavailable.
    const ok = typeof document.execCommand === "function" && document.execCommand("insertText", false, text);
    if (!ok) {
      el.setRangeText(text, el.selectionStart, el.selectionEnd, "end");
      onChange(el.value);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      escapeArmed.current = true;
      return;
    }
    if (event.key === "Tab" && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (escapeArmed.current) {
        escapeArmed.current = false;
        return; // let focus move on
      }
      event.preventDefault();
      insert("  ");
      return;
    }
    escapeArmed.current = false;
    if (event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const el = event.currentTarget;
      const lineStart = el.value.lastIndexOf("\n", el.selectionStart - 1) + 1;
      const indent = /^[ \t]*/.exec(el.value.slice(lineStart, el.selectionStart))?.[0] ?? "";
      const opensBlock = /[{[(]\s*$/.test(el.value.slice(lineStart, el.selectionStart));
      event.preventDefault();
      insert("\n" + indent + (opensBlock ? "  " : ""));
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-editor-gutter bg-editor text-editor-foreground focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-trailmark">
      <div className="flex items-center justify-between border-b border-white/10 bg-editor-gutter px-3 py-1.5 font-mono text-xs text-editor-foreground/60">
        <span>{fileName}</span>
        <span>JavaScript</span>
      </div>
      <div className="flex font-mono text-[13px] leading-6">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="select-none overflow-hidden border-r border-white/5 bg-editor-gutter/60 py-3 pl-3 pr-2.5 text-right text-editor-foreground/35 tabular"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
          rows={Math.max(lineCount + 1, 12)}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label="Code editor"
          aria-describedby={describedBy}
          className="min-w-0 flex-1 resize-none overflow-x-auto whitespace-pre bg-transparent px-3 py-3 caret-trailmark selection:bg-trailmark/30 focus-visible:outline-none"
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
});
