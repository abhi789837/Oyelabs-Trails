/**
 * Where a learner is allowed to type, copy and paste without being accused of anything.
 *
 * ## The problem this exists to fix
 *
 * Proctoring blocked `copy`, `cut` and `paste` on the whole document, code items explicitly
 * included — the comment in `browserSignals.ts` said so, and it was a defensible rule when the
 * answer box was a textarea somebody typed a function into.
 *
 * It stops being defensible the moment there is a real editor on the page. Moving a block of code
 * three lines up is cut-and-paste. So is duplicating a line, pulling a helper out, or undoing by
 * reselecting and retyping. Every one of those fired a **hard** warning, and three hard warnings
 * end the assessment — so a learner doing ordinary editing in the hands-on section could be
 * terminated for it, and the more fluently they worked the faster it happened.
 *
 * ## What replaces it
 *
 * A marked region. Anything inside an element carrying `data-proctor-editor` is the learner's own
 * workspace: typing, selecting, copying, cutting, undo and redo are ordinary work there and are
 * never reported.
 *
 * **Paste is the one that still needs judgement**, because "paste" covers both moving your own code
 * around and dropping in an answer from another window. So the two are told apart by what is on the
 * clipboard: text that was copied *from inside this page* is recognised and allowed, and anything
 * else is still flagged. That is the actual distinction the rule was always trying to draw, and it
 * is now drawn on the thing that distinguishes them rather than on where the caret happens to be.
 *
 * The recogniser is a hash rather than the text itself. What a learner copies is their own work and
 * there is no reason to keep a copy of it in memory for the length of a sitting.
 */

/** Put this on the editor's outermost element. */
export const EDITOR_SCOPE_ATTRIBUTE = "data-proctor-editor";

/** Spread onto a JSX element: `<div {...editorScopeProps()}>`. */
export function editorScopeProps(): Record<string, string> {
  return { [EDITOR_SCOPE_ATTRIBUTE]: "true" };
}

/**
 * The scope root an event happened in, or null outside every scope.
 *
 * Monaco types into a hidden `<textarea>` that lives inside its own DOM, which lives inside the
 * wrapper carrying the attribute — so its keyboard and clipboard events resolve here like any other
 * element. A text node (a selection inside rendered lines) is walked up to its parent first.
 */
export function scopeRootOf(target: EventTarget | null): Element | null {
  if (typeof Element === "undefined" || !target) return null;
  const element = target instanceof Element ? target : ((target as Node).parentElement ?? null);
  return element?.closest(`[${EDITOR_SCOPE_ATTRIBUTE}]`) ?? null;
}

/** Is this event happening inside the learner's own editor? */
export function isInsideEditor(target: EventTarget | null): boolean {
  return scopeRootOf(target) !== null;
}

// ---------------------------------------------------------------------------
// What was copied — read from the editor, not from `document.getSelection()`
// ---------------------------------------------------------------------------

/**
 * Per-scope readers for "what is selected right now".
 *
 * `document.getSelection()` is the wrong question for an editor: Firefox returns "" for a selection
 * inside a textarea, and Monaco's real selection lives in its model while the DOM selection sits in
 * a hidden textarea holding a few characters around the caret. So an editor registers how to read
 * its own selection (Monaco: `model.getValueInRange(selection)`), and the copy handler asks it.
 */
const copySources = new Map<Element, () => string>();

/** Registers a selection reader for one scope root. Returns the unregister function. */
export function registerCopySource(root: Element, read: () => string): () => void {
  copySources.set(root, read);
  return () => {
    if (copySources.get(root) === read) copySources.delete(root);
  };
}

/**
 * Every candidate for "the text this copy put on the clipboard", most reliable first: the scope's
 * registered reader, what the clipboard event already carries (Monaco writes it before the event
 * bubbles to the document), a text field's own selection range, and the document selection last.
 * Each one is remembered — a fingerprint is cheap and a false "not from this page" is a hard warning.
 */
export function copiedTextCandidates(target: EventTarget | null, clipboardText = ""): string[] {
  const out: string[] = [];
  const root = scopeRootOf(target);
  const reader = root ? copySources.get(root) : undefined;
  if (reader) {
    try {
      out.push(reader());
    } catch {
      // An editor torn down mid-event. The other candidates still apply.
    }
  }
  out.push(clipboardText);
  if (typeof HTMLTextAreaElement !== "undefined" && (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
    const { selectionStart, selectionEnd, value } = target;
    if (selectionStart != null && selectionEnd != null) out.push(value.slice(selectionStart, selectionEnd));
  }
  if (typeof document !== "undefined") out.push(String(document.getSelection() ?? ""));
  return out.filter((text) => text.trim() !== "");
}

// ---------------------------------------------------------------------------
// The whitelist, as a pure decision
// ---------------------------------------------------------------------------

export type ScopedEventType =
  | "copy"
  | "cut"
  | "paste"
  | "selectstart"
  | "contextmenu"
  | "click"
  | "pointerdown"
  | "focusin"
  | "focusout"
  | "keydown"
  | "input";

export interface ScopedEvent {
  type: ScopedEventType;
  /** Inside a `data-proctor-editor` scope (Monaco, the task inputs). */
  inScope: boolean;
  /** A plain input/textarea/contenteditable outside any scope. */
  inTextField?: boolean;
  /** `[data-proctor-allow-select]`. */
  allowSelect?: boolean;
  /** Paste: the clipboard's text/plain. */
  clipboardText?: string;
  /** Copy/cut: the candidates from `copiedTextCandidates`. */
  copiedTexts?: string[];
}

export interface ScopedVerdict {
  /** The signal to report, or null for ordinary work. */
  signal: "copy_cut_attempt" | "paste_attempt" | "context_menu_attempt" | "text_selection_attempt" | null;
  /** Whether the browser's default action is stopped. */
  prevent: boolean;
}

const ALLOW: ScopedVerdict = { signal: null, prevent: false };

/**
 * What the proctoring engine does with one DOM event. `browserSignals.ts` calls this for every
 * clipboard, selection and context-menu event, so the rules live here, testable without a DOM.
 *
 * - copy/cut inside a scope: allowed, and the copied text is fingerprinted. Anywhere else: blocked
 *   and flagged.
 * - paste: allowed only inside a scope AND when the text was copied from this page. Text from
 *   another window is blocked and flagged, editor or not.
 * - selection: allowed in a scope, a text field or an allow-select region.
 * - context menu: the native menu is always suppressed; inside a scope that is not reported (a
 *   right-click in your own code is not an attempt at anything).
 * - clicks (Run, Submit), focus moving between the question and the editor, typing, undo: never
 *   a signal. They are listed so a test can hold that down.
 */
export function judgeScopedEvent(event: ScopedEvent): ScopedVerdict {
  switch (event.type) {
    case "copy":
    case "cut":
      if (event.inScope) {
        for (const text of event.copiedTexts ?? []) rememberCopiedText(text);
        return ALLOW;
      }
      return { signal: "copy_cut_attempt", prevent: true };
    case "paste":
      if (event.inScope && wasCopiedFromPage(event.clipboardText ?? "")) return ALLOW;
      return { signal: "paste_attempt", prevent: true };
    case "selectstart":
      if (event.inScope || event.inTextField || event.allowSelect) return ALLOW;
      return { signal: "text_selection_attempt", prevent: true };
    case "contextmenu":
      return { signal: event.inScope ? null : "context_menu_attempt", prevent: true };
    default:
      return ALLOW;
  }
}

/**
 * The fingerprints of what has been copied from inside this page during this sitting.
 *
 * Bounded, because an unbounded set of every clipboard operation in a 45-minute sitting is a leak
 * with extra steps. Sixteen is far more than anybody moves around in one question, and the oldest
 * falls out first.
 */
const MAX_REMEMBERED = 16;
const copiedFromPage: string[] = [];

/**
 * A cheap, non-reversible fingerprint.
 *
 * FNV-1a over the normalised text. It is not cryptographic and does not need to be: it is only ever
 * compared against itself, and the reason it is a hash at all is so that a learner's code is not
 * sitting in a module-level array for the length of their assessment.
 */
export function fingerprint(text: string): string {
  const normalised = text.replace(/\r\n/g, "\n").trim();
  if (normalised === "") return "";

  let hash = 0x811c9dc5;
  for (let i = 0; i < normalised.length; i++) {
    hash ^= normalised.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${(hash >>> 0).toString(36)}:${normalised.length}`;
}

/** Called when a copy or cut happens inside the editor. */
export function rememberCopiedText(text: string): void {
  const mark = fingerprint(text);
  if (mark === "") return;
  if (copiedFromPage.includes(mark)) return;
  copiedFromPage.push(mark);
  if (copiedFromPage.length > MAX_REMEMBERED) copiedFromPage.shift();
}

/** Did this text come off this page? */
export function wasCopiedFromPage(text: string): boolean {
  const mark = fingerprint(text);
  return mark !== "" && copiedFromPage.includes(mark);
}

/**
 * Forgets everything.
 *
 * Called when the sitting ends. Nothing here outlives an assessment, and a second sitting in the
 * same tab should not inherit the first one's clipboard history.
 */
export function resetCopiedText(): void {
  copiedFromPage.length = 0;
}

/** For the tests, and for anything that wants to assert the bound holds. */
export function rememberedCount(): number {
  return copiedFromPage.length;
}
