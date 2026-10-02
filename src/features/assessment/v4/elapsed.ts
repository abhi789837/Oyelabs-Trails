/**
 * Time actually spent per question (v4.1 §1c): runs only while one item is on screen and the tab is
 * visible and focused. The sheet tells it which item is showing (or null when paused); every draft
 * save `take`s what has built up for that item and sends it as `elapsedMs`.
 *
 * The server accepts at most `MAX_ELAPSED_PER_SAVE` per call, so `take` hands over at most that
 * and keeps the rest for the next save. A failed save `give`s its share back.
 */
export const MAX_ELAPSED_PER_SAVE = 120_000;

export class ElapsedClock {
  private running: { itemId: string; since: number } | null = null;
  private readonly banked = new Map<string, number>();

  /** The item now being worked on, or null when the learner is away (tab hidden, window blurred). */
  focus(itemId: string | null, now: number): void {
    if (this.running?.itemId === itemId) return;
    this.fold(now);
    this.running = itemId ? { itemId, since: now } : null;
  }

  /** What has built up for an item, without taking it. */
  peek(itemId: string, now: number): number {
    const live = this.running?.itemId === itemId ? Math.max(0, now - this.running.since) : 0;
    return (this.banked.get(itemId) ?? 0) + live;
  }

  /** Takes up to `cap` ms for an item (whole ms), leaving the rest banked. */
  take(itemId: string, now: number, cap = MAX_ELAPSED_PER_SAVE): number {
    if (this.running?.itemId === itemId) this.fold(now, true);
    const total = this.banked.get(itemId) ?? 0;
    const out = Math.max(0, Math.min(Math.floor(total), cap));
    const rest = total - out;
    if (rest > 0) this.banked.set(itemId, rest);
    else this.banked.delete(itemId);
    return out;
  }

  /** Puts time back after a save that did not land. */
  give(itemId: string, ms: number): void {
    if (ms > 0) this.banked.set(itemId, (this.banked.get(itemId) ?? 0) + ms);
  }

  /** Items with time waiting to be sent. */
  pending(now: number): string[] {
    const ids = new Set(this.banked.keys());
    if (this.running && now > this.running.since) ids.add(this.running.itemId);
    return [...ids];
  }

  /** Banks the running stretch; with `keepRunning` the clock carries on from `now`. */
  private fold(now: number, keepRunning = false): void {
    if (!this.running) return;
    const spent = Math.max(0, now - this.running.since);
    if (spent > 0) this.banked.set(this.running.itemId, (this.banked.get(this.running.itemId) ?? 0) + spent);
    if (keepRunning) this.running = { itemId: this.running.itemId, since: now };
    else this.running = null;
  }
}
