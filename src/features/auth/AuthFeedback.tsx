import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, TriangleAlert } from "lucide-react";

import { FormAlert } from "@/components/form/Field";
import { easing, fieldMessage, transition } from "@/lib/motion";

/**
 * The three pieces of feedback the two auth screens share. They live here rather than in
 * `Field.tsx` because each one is specific to signing in: a shake that fires on a rejected
 * attempt, a Caps Lock warning, and a confirmation tick.
 */

/**
 * The form-level error, with a short horizontal shake each time an attempt is rejected.
 *
 * `attempt` is the key, not the message: the server's login response is deliberately identical
 * for an unknown username and a wrong password, so two failures in a row produce the same string
 * and React would reconcile them into one unchanged node — no shake, no re-announcement of the
 * `role="alert"`. Keying on the counter gives every rejection its own element.
 *
 * The shake is six keyframes over 0.4s at a ±7px amplitude: enough to read as a refusal, small
 * enough that it is not a buzzer. Under `prefers-reduced-motion` the element still fades in, it
 * just arrives where it belongs — the message is the information, the movement is emphasis.
 */
export function AuthFormAlert({ message, attempt }: { message: string | null; attempt: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false} mode="wait">
      {message && (
        <motion.div
          key={attempt}
          initial={{ opacity: 0, y: -4 }}
          animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, x: [0, -7, 6, -4, 3, 0] }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ ...transition.base, x: { duration: 0.4, ease: easing.out } }}
        >
          <FormAlert>{message}</FormAlert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * "Caps Lock is on", under the field it applies to.
 *
 * The `<p>` is always mounted and always a live region. Announcing a message that only appears
 * when the region appears with it is unreliable across screen readers, and an empty paragraph with
 * no inline content generates no line box, so the reserved element costs no height until it has
 * something to say.
 */
export function CapsLockWarning({ show }: { show: boolean }) {
  return (
    <p aria-live="polite" className="text-xs">
      <AnimatePresence initial={false}>
        {show && (
          <motion.span
            key="caps"
            variants={fieldMessage}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="inline-flex items-center gap-1.5 font-medium text-trailmark-strong"
          >
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            Caps Lock is on
          </motion.span>
        )}
      </AnimatePresence>
    </p>
  );
}

/**
 * The positive half of the confirm-password feedback: the mismatch is the field's own error, and
 * this is what replaces it once the two agree. Same shape as the rule lines in the strength
 * checklist above it, so the form has one visual language for "requirement met".
 */
export function PasswordMatchLine({ matched }: { matched: boolean }) {
  return (
    <p aria-live="polite" className="text-xs">
      <AnimatePresence initial={false}>
        {matched && (
          <motion.span
            key="match"
            variants={fieldMessage}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="inline-flex items-center gap-1.5 text-summit-strong"
          >
            <Check className="size-3.5 shrink-0" aria-hidden="true" />
            Both passwords match
          </motion.span>
        )}
      </AnimatePresence>
    </p>
  );
}
