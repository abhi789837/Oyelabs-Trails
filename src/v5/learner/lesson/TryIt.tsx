import { useContext, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

import { previewDocument } from "@shared/lessonCore";

import { CodeEditor } from "@/components/challenge/CodeEditor";
import { ApiRequestError } from "@/api/client";
import { toRunnableJs, type SnippetOutcome } from "@/lib/codeRunner";
import { Button } from "@/v5/design/components/Button";

import { lessonApi } from "./api";
import { LessonTopicContext } from "./LessonRich";

/**
 * The Read step's playground, loaded only when a learner presses "Try it". Scripts run in the
 * server's code sandbox (the production CSP blocks building code from strings in the browser), with
 * `console` output shown. TypeScript is stripped in the browser first (sucrase, no eval).
 * HTML and CSS render in a sandboxed iframe (`srcdoc`, no scripts) and are never sent anywhere.
 */
export default function TryIt({ code: initial, lang, kind }: { code: string; lang: string; kind: "script" | "page" }) {
  const [code, setCode] = useState(initial);
  const [running, setRunning] = useState(false);
  const [out, setOut] = useState<SnippetOutcome | null>(null);
  const [preview, setPreview] = useState(() => (kind === "page" ? previewDocument(lang, initial) : ""));
  const ts = /^(ts|typescript)$/i.test(lang);
  const topicId = useContext(LessonTopicContext);

  const run = async () => {
    if (kind === "page") {
      setPreview(previewDocument(lang, code));
      return;
    }
    setRunning(true);
    try {
      let js: string;
      try {
        js = await toRunnableJs(code, ts ? "typescript" : "javascript");
      } catch (err) {
        setOut({ stdout: "", stderr: err instanceof Error ? err.message : String(err), timedOut: false });
        return;
      }
      if (!topicId) throw new Error("no lesson");
      setOut(await lessonApi.runSnippet(topicId, js));
    } catch (err) {
      setOut({ stdout: "", stderr: err instanceof ApiRequestError ? err.message : "We couldn't run that just now. Try again.", timedOut: false });
    } finally {
      setRunning(false);
    }
  };

  return (
    <section aria-label="Playground" className="flex flex-col gap-3 rounded-card border border-line-1 bg-surface-1 p-3">
      <div className="[&_div[aria-hidden=true]]:text-editor-foreground/70">
        <CodeEditor value={code} onChange={setCode} fileName={`playground.${kind === "page" ? lang.toLowerCase() : ts ? "ts" : "js"}`} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={() => void run()} loading={running}>
          <Play aria-hidden="true" /> {kind === "page" ? "Update the preview" : "Run"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={code === initial}
          onClick={() => {
            setCode(initial);
            setOut(null);
            if (kind === "page") setPreview(previewDocument(lang, initial));
          }}
        >
          <RotateCcw aria-hidden="true" /> Start again
        </Button>
      </div>
      {kind === "page" ? (
        <iframe title="Preview of your HTML and CSS" sandbox="" srcDoc={preview} className="h-56 w-full rounded-control border border-line-1 bg-white" />
      ) : out ? (
        <div>
          <h4 className="text-small font-semibold text-fg-1">Output</h4>
          <pre role="log" tabIndex={0} className="mt-1 max-h-56 overflow-auto rounded-control bg-sunken p-3 font-mono text-small text-fg-1" data-testid="tryit-output">
            {out.stdout || (out.stderr ? "" : "(Nothing was printed. Use console.log to see values.)")}
            {out.stderr ? <span className="block text-danger-fg">{out.stderr}</span> : null}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
