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

// Monaco takes hex, not CSS variables: these are the brand kit's colours (src/index.css tokens):
// Slate #5B6B82, Night Navy #0B2347, Cloud #F4F7FB; dark: Night #0A1428 and the --editor surface.
monaco.editor.defineTheme("oyelearn-light", {
  base: "vs",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#FFFFFF",
    "editorLineNumber.foreground": "#5B6B82",
    "editorLineNumber.activeForeground": "#0B2347",
    "editor.lineHighlightBackground": "#F4F7FB",
  },
});

monaco.editor.defineTheme("oyelearn-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#060D1C",
    "editorLineNumber.foreground": "#8F9DB4",
    "editorLineNumber.activeForeground": "#ECF1F8",
    "editor.lineHighlightBackground": "#0A1428",
  },
});

export { monaco };
