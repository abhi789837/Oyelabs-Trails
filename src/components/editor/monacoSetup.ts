import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import TsWorker from "monaco-editor/language/typescript/ts.worker?worker";

/**
 * Monaco, loaded once and only by the lazy editor chunk.
 *
 * Two workers are bundled: the core editor worker and the TypeScript one (which also serves
 * JavaScript). Every other label gets the core worker — the assessment never opens a CSS, HTML or
 * JSON model, so their language services are never asked for anything.
 */
self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === "typescript" || label === "javascript") return new TsWorker();
    return new EditorWorker();
  },
};

/* Squiggles for TypeScript would be noise in a test: the starter code often references types the
   learner has not written yet, and red underlines read as "you are wrong". Syntax errors stay. */
for (const defaults of [monaco.typescript.typescriptDefaults, monaco.typescript.javascriptDefaults]) {
  defaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
  defaults.setCompilerOptions({ target: monaco.typescript.ScriptTarget.ES2020, allowNonTsExtensions: true, strict: false });
}

monaco.editor.defineTheme("oyelearn-light", {
  base: "vs",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#FFFFFF",
    "editorLineNumber.foreground": "#6B7280",
    "editorLineNumber.activeForeground": "#1B1F27",
    "editor.lineHighlightBackground": "#F2F4F8",
  },
});

monaco.editor.defineTheme("oyelearn-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#0C0F15",
    "editorLineNumber.foreground": "#7B8496",
    "editorLineNumber.activeForeground": "#EDEFF3",
    "editor.lineHighlightBackground": "#151921",
  },
});

export { monaco };
