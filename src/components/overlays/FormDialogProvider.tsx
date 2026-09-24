import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export interface FormDialogOptions<T> {
  title: string;
  description?: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /**
   * The fields. Uncontrolled: give each input a `name` and read it back from the `FormData` in
   * `onSubmit`. `pending` is there so fields can disable themselves while the save is in flight.
   */
  body: (context: { pending: boolean }) => ReactNode;
  /**
   * Runs with the dialog open and a spinner on the submit button. Throw to show the message inside
   * the dialog and keep it open; whatever it returns is what `formDialog(...)` resolves with.
   */
  onSubmit: (data: FormData) => T | Promise<T>;
}

// The options are stored erased, because one provider serves every caller's result type. The cast
// back happens in one place, below, where the generic signature is re-applied.
type AnyOptions = FormDialogOptions<unknown>;
type OpenFormDialog = <T>(options: FormDialogOptions<T>) => Promise<T | null>;

const FormDialogContext = createContext<OpenFormDialog | null>(null);

/**
 * Small create/edit forms in a modal, with the same promise shape as `useConfirm`.
 *
 * ```ts
 * const label = await formDialog({
 *   title: "Rename credential",
 *   body: () => <TextField name="label" label="Label" defaultValue={current} />,
 *   onSubmit: (data) => api.rename(String(data.get("label"))),
 * });
 * if (label === null) return; // dismissed
 * ```
 */
export function useFormDialog(): OpenFormDialog {
  const open = useContext(FormDialogContext);
  if (!open) throw new Error("useFormDialog must be used inside <FormDialogProvider>.");
  return open;
}

export function FormDialogProvider({ children }: { children: ReactNode }) {
  // As in ConfirmProvider, the options outlive `open` so the exit animation has something to draw.
  const [options, setOptions] = useState<AnyOptions | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolveRef = useRef<((value: unknown) => void) | null>(null);
  // `useId` values carry punctuation that is legal in an id but awkward in one; strip it, because
  // this one is also a `form=` reference from a button outside the form element.
  const formId = `form-dialog${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const openDialog = useCallback<OpenFormDialog>(
    (next) =>
      new Promise((resolve) => {
        resolveRef.current?.(null);
        resolveRef.current = resolve as (value: unknown) => void;
        setOptions(next as AnyOptions);
        setError(null);
        setPending(false);
        setOpen(true);
      }),
    [],
  );

  const settle = useCallback((value: unknown) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setOpen(false);
    setPending(false);
    resolve?.(value);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!options || pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      settle(await options.onSubmit(data));
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "That couldn't be saved. Try again.");
    }
  };

  return (
    <FormDialogContext.Provider value={openDialog}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !pending) settle(null);
        }}
      >
        {options && (
          <DialogContent
            onEscapeKeyDown={(event) => {
              if (pending) event.preventDefault();
            }}
            onInteractOutside={(event) => {
              if (pending) event.preventDefault();
            }}
          >
            <DialogTitle>{options.title}</DialogTitle>
            {options.description && <DialogDescription>{options.description}</DialogDescription>}

            <form id={formId} onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-4">
              <fieldset disabled={pending} className="space-y-4">
                {options.body({ pending })}
              </fieldset>
            </form>

            {error && (
              <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/[0.07] px-3 py-2 text-sm">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={pending}>
                  {options.cancelLabel ?? "Cancel"}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form={formId}
                variant={options.destructive ? "destructive" : "default"}
                loading={pending}
              >
                {options.submitLabel ?? "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </FormDialogContext.Provider>
  );
}
