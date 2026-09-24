import * as React from "react";
import { Check, Circle, Eye, EyeOff } from "lucide-react";

import { Input, type InputProps } from "@/components/ui/input";
import { passwordStrength, type PasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<InputProps, "type" | "trailing" | "onClear"> {
  /** Show the strength meter and the rule checklist below the field. */
  meter?: boolean;
  /** The account's username, so "abhishek-2026" cannot quietly pass the username rule. */
  username?: string;
}

/** score -> the bar fill and the word next to it. Four steps, so "Fair" is visibly not "Good". */
const TONES = [
  { bar: "bg-destructive", text: "text-destructive" },
  { bar: "bg-destructive", text: "text-destructive" },
  { bar: "bg-trailmark", text: "text-trailmark-strong" },
  { bar: "bg-trailmark", text: "text-trailmark-strong" },
  { bar: "bg-summit", text: "text-summit-strong" },
] as const;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ meter = false, username = "", className, value, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const password = String(value ?? "");
    const strength: PasswordStrength | null = meter ? passwordStrength(password, username) : null;

    return (
      <div>
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          value={value}
          /* Edge and Safari add their own reveal control; two of them side by side is confusing. */
          className={cn("[&::-ms-reveal]:hidden", className)}
          trailing={
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              tabIndex={-1}
              className="flex h-6 w-6 items-center justify-center rounded-sm transition-colors duration-[120ms] hover:bg-accent hover:text-foreground"
            >
              {visible ? <EyeOff /> : <Eye />}
            </button>
          }
          {...props}
        />

        {strength && password.length > 0 && (
          <>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-1 flex-1 gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((segment) => (
                  <span
                    key={segment}
                    className={cn(
                      "h-full flex-1 rounded-full transition-colors duration-200",
                      segment < strength.score ? TONES[strength.score]!.bar : "bg-input/60",
                    )}
                  />
                ))}
              </span>
              <span aria-live="polite" className={cn("font-mono text-xs", TONES[strength.score]!.text)}>
                {strength.label}
              </span>
            </div>

            <ul className="mt-2 space-y-1">
              {strength.rules.map((rule) => (
                <li
                  key={rule.label}
                  className={cn("flex items-center gap-1.5 text-xs", rule.met ? "text-summit-strong" : "text-muted-foreground")}
                >
                  {rule.met ? (
                    <Check className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 opacity-50" aria-hidden="true" />
                  )}
                  <span className="sr-only">{rule.met ? "Met:" : "Still needed:"}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
