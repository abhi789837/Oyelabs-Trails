import { Monitor, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/v5/design/cn";

const KEY = "oyelearn.v5.admin.bigger-screen";

function readDismissed(): string[] {
  try {
    const raw = globalThis.sessionStorage?.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * A calm note on phones only (hidden from 768 px): this screen works, but it's easier on a bigger
 * one. Closing it hides it for the rest of the visit, per screen.
 */
export function BiggerScreenNote({ id, body = "This page works here, but it's easier to use on a tablet or a computer.", className }: { id: string; body?: string; className?: string }) {
  const [hidden, setHidden] = useState(() => readDismissed().includes(id));
  if (hidden) return null;
  const close = () => {
    setHidden(true);
    try {
      globalThis.sessionStorage?.setItem(KEY, JSON.stringify([...new Set([...readDismissed(), id])]));
    } catch {
      // Blocked storage: it comes back on the next visit, which is fine.
    }
  };
  return (
    <aside aria-label="Best on a bigger screen" className={cn("flex items-start gap-3 rounded-card border border-line-1 bg-surface-1 px-4 py-3 text-small md:hidden", className)}>
      <Monitor className="mt-0.5 size-4 shrink-0 text-fg-2" aria-hidden="true" />
      <p className="flex-1 text-fg-2">
        <span className="font-medium text-fg-1">Best on a bigger screen. </span>
        {body}
      </p>
      <button type="button" onClick={close} aria-label="Hide this note" className="-m-1 grid size-8 shrink-0 place-items-center rounded-control text-fg-2 hover:bg-sunken hover:text-fg-1">
        <X className="size-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
