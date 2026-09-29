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

/** Is this event happening inside the learner's own editor? */
export function isInsideEditor(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    // A text node, or a selection inside a shadow root. Walk up to something we can ask.
    const node = target as Node | null;
    const element = node?.parentElement ?? null;
    return element !== null && element.closest(`[${EDITOR_SCOPE_ATTRIBUTE}]`) !== null;
  }
  return target.closest(`[${EDITOR_SCOPE_ATTRIBUTE}]`) !== null;
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
