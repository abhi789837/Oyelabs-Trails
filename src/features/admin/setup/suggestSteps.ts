export type StepState = "waiting" | "working" | "done";

/** The ticks: steps before `current` are done, `current` is working, the rest wait. -1 = none started, length = all done. */
export function stepStates(count: number, current: number): StepState[] {
  return Array.from({ length: count }, (_, i) => (i < current ? "done" : i === current ? "working" : "waiting"));
}

/** Nothing for the first 10 seconds, then "Still working: 12 seconds so far". */
export function elapsedLabel(ms: number): string | null {
  if (ms < 10_000) return null;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `Still working: ${seconds} seconds so far`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `Still working: ${minutes} min ${rest} s so far`;
}
