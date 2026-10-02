import { lazy, Suspense } from "react";
import { LoaderCircle } from "lucide-react";

import type { SandboxLanguage } from "@shared/catalog";

export interface CodeEditorMonacoProps {
  value: string;
  onChange?: (value: string) => void;
  language: SandboxLanguage;
  readOnly?: boolean;
  /** Pixels. The editor grows with its content between these. */
  minHeight?: number;
  maxHeight?: number;
  ariaLabel?: string;
  onBlur?: () => void;
  className?: string;
}

const MonacoEditorImpl = lazy(() => import("./MonacoEditorImpl"));

/**
 * A Monaco code editor, loaded on first use. Monaco is several megabytes; nobody who never opens a
 * coding question pays for it.
 */
export function CodeEditorMonaco(props: CodeEditorMonacoProps) {
  const minHeight = props.minHeight ?? 280;
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center gap-2 rounded-md border border-input bg-surface-sunken text-sm text-muted-foreground"
          style={{ height: minHeight }}
          role="status"
        >
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading the editor…
        </div>
      }
    >
      <MonacoEditorImpl {...props} />
    </Suspense>
  );
}

export const LANGUAGE_LABELS: Record<SandboxLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  php: "PHP",
  sql: "SQL",
  java: "Java",
  dart: "Dart",
  html: "HTML",
};
