/** The server's bounds for "minimum time before Finish": whole minutes, at most 45. */
export const MAX_MIN_FINISH_MINUTES = 45;

/**
 * The field's text as the value to save. Empty or 0 means off (null). Anything that is not a whole
 * number from 0 to 45 is an error message instead.
 */
export function parseMinFinish(raw: string): { value: number | null } | { error: string } {
  const text = raw.trim();
  if (text === "") return { value: null };
  if (!/^\d+$/.test(text)) return { error: "Whole minutes only." };
  const minutes = Number(text);
  if (minutes > MAX_MIN_FINISH_MINUTES) return { error: `At most ${MAX_MIN_FINISH_MINUTES} minutes.` };
  return { value: minutes === 0 ? null : minutes };
}

/** The saved value as the field's text: off is an empty field. */
export function formatMinFinish(value: number | null): string {
  return value ? String(value) : "";
}
