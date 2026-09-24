import { createContext, useCallback, useContext, useId, useRef, useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ConfirmOptions {
  /** A question or a statement of what is about to happen. Not "Are you sure?". */
  title: string;
  /** What it does to the person on the other end. This is the part that matters. */
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  /**
   * Typed confirmation: the exact string — usually a username — that has to be typed before the
   * confirm button unlocks. For the handful of actions an admin cannot take back.
   */
  confirmPhrase?: string;
  /** Overrides the default "Type <phrase> to confirm." label above the field. */
  confirmPhraseLabel?: ReactNode;
  /**
   * Optional work to run *with the dialog still open*, showing a spinner on the confirm button. If
   * it throws, the message is shown inside the dialog and the dialog stays open to be retried.
   * Without it, `confirm()` resolves as soon as the button is pressed and the caller does the work.
   */
  onConfirm?: () => Promise<unknown> | void;
  /** Fade only, no scale or slide. For the assessment runner, which must stay calm. */
  calm?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * A promise-based replacement for `window.confirm`.
 *
 * ```ts
 * if (!(await confirm({ title: "Disable Ana?", body: "…", variant: "destructive" }))) return;
 * ```
 *
 * Resolves `true` only when the action was confirmed (and, when `onConfirm` is given, only after it
 * succeeded). Cancel, Escape and a superseding ask all resolve `false`.
 */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>.");
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  // `options` outlives `open` on purpose: the dialog keeps rendering while it animates out, so the
  // copy must not vanish from under the exit animation.
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const phraseId = useId();

  const confirm = useCallback<Confirm>(
    (next) =>
      new Promise<boolean>((resolve) => {
        // A second ask supersedes the first rather than stacking dialogs.
        resolveRef.current?.(false);
        resolveRef.current = resolve;
        setOptions(next);
        setTyped("");
        setError(null);
        setPending(false);
        setOpen(true);
      }),
    [],
  );

  const settle = useCallback((value: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setOpen(false);
    setPending(false);
    resolve?.(value);
  }, []);

  const runConfirm = async () => {
    if (!options || pending) return;
    if (!options.onConfirm) {
      settle(true);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await options.onConfirm();
      settle(true);
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "That didn't work. Try again.");
    }
  };

  const destructive = options?.variant === "destructive";
  const phrase = options?.confirmPhrase;
  const locked = Boolean(phrase) && typed.trim() !== phrase;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          // Escape. Ignored mid-flight: closing while the request is in the air would leave the
          // admin unsure whether it happened.
          if (!next && !pending) settle(false);
        }}
      >
        {options && (
          <AlertDialogContent
            calm={options.calm ?? false}
            onEscapeKeyDown={(event) => {
              if (pending) event.preventDefault();
            }}
            onOpenAutoFocus={(event) => {
              if (!phrase) return; // Radix focuses Cancel, which is the right default.
              event.preventDefault();
              inputRef.current?.focus();
            }}
          >
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            {options.body && <AlertDialogDescription>{options.body}</AlertDialogDescription>}

            {phrase && (
              <div className="mt-5 space-y-1.5">
                <Label htmlFor={phraseId}>
                  {options.confirmPhraseLabel ?? (
                    <>
                      Type <span className="font-mono font-semibold text-foreground">{phrase}</span> to confirm
                    </>
                  )}
                </Label>
                <Input
                  id={phraseId}
                  ref={inputRef}
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !locked) {
                      event.preventDefault();
                      void runConfirm();
                    }
                  }}
                  disabled={pending}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="font-mono"
                />
              </div>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/[0.07] px-3 py-2 text-sm">
                {error}
              </p>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline" disabled={pending}>
                  {options.cancelLabel ?? "Cancel"}
                </Button>
              </AlertDialogCancel>
              {/* Not `AlertDialogAction`: that one closes on click, which would cut the pending
                  state short before the work it is reporting on has finished. */}
              <Button
                variant={destructive ? "destructive" : "default"}
                onClick={() => void runConfirm()}
                disabled={locked}
                loading={pending}
              >
                {options.confirmLabel ?? "Confirm"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
