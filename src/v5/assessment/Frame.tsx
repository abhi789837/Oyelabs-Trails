import { useState, type ReactNode } from "react";

import { Button } from "@/v5/design/components/Button";
import { Dialog } from "@/v5/design/components/Overlays";
import { Logo } from "@/components/brand/Logo";
import { ContourBackground } from "@/v5/design/components/States";
import { cn } from "@/v5/design/cn";

/**
 * A calm, centred page for the moments around the test (loading, waiting, closed). Spacious, the
 * logo, one heading, one action. Contours sit far back.
 */
export function CalmPage({ title, children, actions, wide }: { title?: ReactNode; children?: ReactNode; actions?: ReactNode; wide?: boolean }) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface-0 px-4 py-12 text-fg-1">
      <ContourBackground seed={7} className="-z-10" />
      <div className={cn("flex w-full flex-col items-center text-center", wide ? "max-w-3xl" : "max-w-xl")}>
        <Logo variant="endorsed" theme="auto" size={64} clearSpace={false} className="mb-8" />
        {title ? <h1 className="font-display text-h2 font-semibold text-fg-1">{title}</h1> : null}
        {children ? <div className="mt-3 w-full text-body text-fg-2">{children}</div> : null}
        {actions ? <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div> : null}
      </div>
    </main>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-10 text-small text-fg-2">
      <span className="size-4 animate-spin rounded-full border-2 border-line-2 border-t-brand motion-reduce:animate-none" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export interface ConfirmOptions {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
}

/**
 * A calm yes/no as a promise, on the v5 Dialog: `const ok = await confirm({...})`. Escape and the
 * close button mean "no". Focus goes back to whatever opened it.
 */
export function useCalmConfirm(): [ReactNode, (options: ConfirmOptions) => Promise<boolean>] {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const close = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };
  const element = (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open) close(false);
      }}
      title={state?.title ?? ""}
      closeLabel={state?.cancelLabel ?? "Close"}
      footer={
        state ? (
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              {state.cancelLabel}
            </Button>
            <Button variant="primary" onClick={() => close(true)}>
              {state.confirmLabel}
            </Button>
          </>
        ) : null
      }
    >
      <div className="text-body text-fg-2">{state?.body}</div>
    </Dialog>
  );
  const ask = (options: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...options, resolve }));
  return [element, ask];
}
