import { useCallback, useState, type KeyboardEvent } from "react";

/**
 * Caps Lock detection for one password field.
 *
 * There is no way to read the lock state until a key event arrives — `FocusEvent` has no
 * `getModifierState` — so the warning appears on the first keystroke rather than on focus. Both
 * `keydown` and `keyup` are watched because pressing Caps Lock itself is only reflected correctly
 * on one of the two depending on the platform: on Windows `keydown` already reports the new state,
 * on macOS it reports the old one and `keyup` corrects it.
 *
 * State is per field, not per page: three password inputs each get their own, so the warning shows
 * under the one being typed into instead of floating somewhere above the form.
 */
export interface CapsLockState {
  capsLock: boolean;
  /** Attach to both `onKeyDown` and `onKeyUp`. */
  onKeyEvent: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Attach to `onBlur`: the warning belongs to the field, and the field is no longer in use. */
  onBlur: () => void;
}

export function useCapsLock(): CapsLockState {
  const [capsLock, setCapsLock] = useState(false);

  const onKeyEvent = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    // Guard rather than assume: a synthetic event dispatched by a password manager or a test may
    // arrive without the method, and throwing inside a keystroke handler would eat the keystroke.
    if (typeof event.getModifierState !== "function") return;
    setCapsLock(event.getModifierState("CapsLock"));
  }, []);

  const onBlur = useCallback(() => setCapsLock(false), []);

  return { capsLock, onKeyEvent, onBlur };
}
