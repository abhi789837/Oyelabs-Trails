import { cloneElement, forwardRef, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type TextareaHTMLAttributes } from "react";

import { cn } from "../cn";

const controlBase =
  "w-full rounded-control border border-line-2 bg-surface-1 px-3 text-body text-fg-1 placeholder:text-fg-3 " +
  "transition-[border-color,box-shadow] duration-120 focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/30 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlBase, "h-(--v5-control-h)", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(controlBase, "min-h-24 py-2", className)} {...props} />
));
Textarea.displayName = "Textarea";

export interface FieldProps {
  label: ReactNode;
  /** One short line under the label: what to type, or why we ask. */
  hint?: ReactNode;
  /** Plain words: what went wrong and how to fix it. Keep what the person typed. */
  error?: ReactNode;
  optional?: boolean;
  className?: string;
  /** A single Input, Textarea or other control. It receives id, aria-describedby and aria-invalid. */
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
}

/** Label, hint and error wired to one control. The error sits right under the field that failed. */
export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, { id: children.props.id ?? id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })
    : children;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={children.props.id ?? id} className="text-small font-medium text-fg-1">
        {label}
        {optional ? <span className="ml-1 font-normal text-fg-2">(optional)</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-small text-fg-2">
          {hint}
        </p>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} className="text-small font-medium text-danger-fg" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
