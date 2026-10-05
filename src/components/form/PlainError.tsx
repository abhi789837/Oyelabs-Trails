import { Link } from "react-router-dom";

import { plainError, type PlainErrorAction } from "./plainErrorInfo";

/**
 * v4.4 Phase 6: an error in plain words, near what failed, with what to do next. The status and
 * error code stay inside a collapsed "Show details". Pass the caught error, or plain `message`.
 */
export function PlainError({ error, message, fallback, action, className }: { error?: unknown; message?: string; fallback?: string; action?: PlainErrorAction; className?: string }) {
  if (error == null && !message) return null;
  const info = plainError(error ?? message, fallback);
  const text = message ?? info.message;
  const next = action ?? info.action;
  return (
    <div role="alert" className={`rounded-md border border-destructive/40 bg-destructive/6 px-3 py-2 text-sm text-destructive ${className ?? ""}`}>
      <p>
        {text}
        {next && (
          <>
            {" "}
            <Link to={next.to} className="font-medium underline underline-offset-2">
              {next.label}
            </Link>
          </>
        )}
      </p>
      {info.details && info.details !== text && (
        <details className="mt-1 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">Show details</summary>
          <p className="mt-1 font-mono break-words">{info.details}</p>
        </details>
      )}
    </div>
  );
}
