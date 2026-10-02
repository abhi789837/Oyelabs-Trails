import { useEffect, useRef } from "react";

import { editorScopeProps, registerCopySource } from "@/features/proctor/editorScope";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

import { monaco } from "./monacoSetup";
import type { CodeEditorMonacoProps } from "./CodeEditorMonaco";

const MONACO_LANGUAGE: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  php: "php",
  sql: "sql",
  java: "java",
  dart: "dart",
  html: "html",
};

/**
 * The Monaco instance behind `CodeEditorMonaco`. Loaded lazily — this module pulls in Monaco itself.
 *
 * Proctoring: the wrapper carries `data-proctor-editor`, so typing, selecting, undo, copy and cut
 * inside are ordinary work, and it registers a reader for what is *really* selected (the model's
 * selection, not the hidden textarea's), so pasting your own code back is recognised. The native
 * context menu and drop-into-editor are off: both are ways to put text in without a paste event.
 */
export default function MonacoEditorImpl({
  value,
  onChange,
  language,
  readOnly = false,
  minHeight = 280,
  maxHeight = 560,
  ariaLabel,
  onBlur,
  className,
}: CodeEditorMonacoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const theme = useUiStore((s) => s.theme);

  // Latest callbacks without re-creating the editor.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  useEffect(() => {
    const host = hostRef.current;
    const wrapper = wrapperRef.current;
    if (!host || !wrapper) return;

    const model = monaco.editor.createModel(value, MONACO_LANGUAGE[language] ?? "plaintext");
    const editor = monaco.editor.create(host, {
      model,
      theme: useUiStore.getState().theme === "dark" ? "oyelearn-dark" : "oyelearn-light",
      readOnly,
      readOnlyMessage: { value: "This answer has been submitted and can't be changed." },
      ariaLabel: ariaLabel ?? "Code editor",
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
      fontSize: 14,
      lineHeight: 21,
      tabSize: language === "python" || language === "java" || language === "php" ? 4 : 2,
      contextmenu: false,
      dropIntoEditor: { enabled: false },
      padding: { top: 10, bottom: 10 },
      lineNumbersMinChars: 3,
      renderLineHighlight: "line",
      scrollbar: { alwaysConsumeMouseWheel: false },
      fixedOverflowWidgets: false,
      wordWrap: "off",
    });
    editorRef.current = editor;

    const unregister = registerCopySource(wrapper, () => {
      const current = editor.getModel();
      const selections = editor.getSelections() ?? [];
      if (!current) return "";
      return selections
        .map((selection) =>
          // An empty selection copies the whole line (Monaco's emptySelectionClipboard).
          selection.isEmpty() ? current.getLineContent(selection.startLineNumber) : current.getValueInRange(selection),
        )
        .join("\n");
    });

    const subscriptions = [
      editor.onDidChangeModelContent(() => onChangeRef.current?.(editor.getValue())),
      editor.onDidBlurEditorText(() => onBlurRef.current?.()),
      editor.onDidContentSizeChange(({ contentHeight }) => {
        const height = Math.max(minHeight, Math.min(maxHeight, contentHeight));
        host.style.height = `${height}px`;
        editor.layout();
      }),
    ];
    host.style.height = `${Math.max(minHeight, Math.min(maxHeight, editor.getContentHeight()))}px`;

    return () => {
      unregister();
      subscriptions.forEach((s) => s.dispose());
      editor.dispose();
      model.dispose();
      editorRef.current = null;
    };
    // The editor is created once per mount; value/readOnly/theme are synced by the effects below.
  }, [language]);

  useEffect(() => {
    monaco.editor.setTheme(theme === "dark" ? "oyelearn-dark" : "oyelearn-light");
  }, [theme]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly });
  }, [readOnly]);

  // A value set from outside (a restored draft) replaces the text, as one undoable edit.
  useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model || model.getValue() === value) return;
    editor.executeEdits("external", [{ range: model.getFullModelRange(), text: value }]);
  }, [value]);

  return (
    <div
      ref={wrapperRef}
      {...editorScopeProps()}
      className={cn("overflow-hidden rounded-md border border-input", readOnly && "opacity-90", className)}
    >
      <div ref={hostRef} style={{ height: minHeight }} />
    </div>
  );
}
