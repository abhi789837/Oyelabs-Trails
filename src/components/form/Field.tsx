import { useId, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput, type NumberInputProps } from "@/components/ui/number-input";
import { PasswordInput, type PasswordInputProps } from "@/components/ui/password-input";
import { fieldMessage } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A labelled control with optional help text and an error message, wired for screen readers:
 * `aria-describedby` points at both, and `aria-invalid` flips when there is an error so the
 * message is announced rather than only shown.
 */
interface FieldProps {
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-1 text-muted-foreground" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {/* The message rises into place rather than appearing, so the eye is drawn to the field that
          moved. Transform and opacity only — animating height here would reflow the whole form. */}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key="error"
            id={errorId}
            variants={fieldMessage}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-xs font-medium text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

type TextFieldProps = Omit<React.ComponentProps<typeof Input>, "id"> & {
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
  containerClassName?: string;
};

/** The common case: a label above a single `<Input>`. */
export function TextField({ label, error, hint, containerClassName, className, required, ...inputProps }: TextFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={containerClassName}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cn(invalid && "border-destructive", className)}
          {...inputProps}
        />
      )}
    </Field>
  );
}

type PasswordFieldProps = Omit<PasswordInputProps, "id"> & {
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
  containerClassName?: string;
};

/** A password with a show/hide toggle, and — with `meter` — a strength bar and rule checklist. */
export function PasswordField({ label, error, hint, containerClassName, className, required, ...inputProps }: PasswordFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={containerClassName}>
      {({ id, describedBy, invalid }) => (
        <PasswordInput
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cn(invalid && "border-destructive", className)}
          {...inputProps}
        />
      )}
    </Field>
  );
}

type NumberFieldProps = Omit<NumberInputProps, "id"> & {
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
  containerClassName?: string;
};

/** A number with steppers. `value` is `number | null`, so an empty field stays distinct from 0. */
export function NumberField({ label, error, hint, containerClassName, className, required, ...inputProps }: NumberFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={containerClassName}>
      {({ id, describedBy, invalid }) => (
        <NumberInput
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cn(invalid && "border-destructive", className)}
          {...inputProps}
        />
      )}
    </Field>
  );
}

/** A form-level error, for failures that do not belong to one field. */
export function FormAlert({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/6 px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  );
}
