import { useState } from "react";
import { Check, Copy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shows a generated temporary password once.
 *
 * The server never returns it again — it is hashed the moment it is created — so this is
 * deliberately loud and dismissible rather than a toast that could disappear before it is read.
 */
export function TemporaryPasswordNotice({
  username,
  password,
  onDismiss,
  className,
}: {
  username: string;
  password: string;
  onDismiss: () => void;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the password is on screen either way.
    }
  };

  return (
    <div className={cn("rounded-md border border-trailmark/50 bg-trailmark/[0.07] p-4", className)} role="status">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">Temporary password for {username}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Shown once. Share it with them directly — it cannot be retrieved later, only reset.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss">
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="select-all rounded-md border bg-surface px-3 py-2 font-mono text-base tracking-wider">{password}</code>
        <Button variant="outline" size="sm" onClick={() => void copy()}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
