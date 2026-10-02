import type { BankItem } from "../../../shared/bank";
import type { AssessmentMix, MixGroup } from "../../../shared/setup";

/**
 * Builds one assessment from the bank (v4 Phase 5). Pure and deterministic — no model call.
 *
 * Given the mix (how many hands-on and multiple-choice questions per skill, in asking order), it
 * picks bank items:
 *
 * - **own stack only:** an item tied to a stack is eligible only when the learner is on that stack;
 * - **never seen:** items from the learner's earlier sittings are used only when nothing else fits;
 * - **difficulty band:** levels 1–2 with no experience start easy (1→2→3), everyone else easy-medium
 *   (2→3→1→4); within a band the order is a seeded shuffle, so two learners with the same setup
 *   do not get the same paper but the same learner re-assembled gets the same one;
 * - **shortfall:** when a skill has too few items of one type it takes the other type, then hands
 *   the rest to the next skill in its group, then to basics, then to anything in the department.
 *   Every shortfall is reported so a gap-fill job can be queued once.
 */

export interface AssembleInput {
  /** `coding` departments serve coding items as hands-on; `tasks` departments serve tasks. */
  format: "coding" | "tasks";
  mix: AssessmentMix;
  pool: readonly BankItem[];
  stackIds: readonly string[];
  /** Skills the admin said never to test. Never served, even as filler. */
  skip: readonly string[];
  seen: ReadonlySet<string>;
  level: number | null;
  experienceBand: string | null;
  seed: string;
}

export interface AssembledItem {
  item: BankItem;
  skillId: string;
  group: MixGroup | "filler";
}

export interface Shortfall {
  skillId: string;
  type: BankItem["type"];
  missing: number;
}

export interface Assembled {
  items: AssembledItem[];
  shortfalls: Shortfall[];
}

export function difficultyOrder(level: number | null, experienceBand: string | null): number[] {
  const easy = (level ?? 3) <= 2 && (experienceBand === "0" || experienceBand == null);
  return easy ? [1, 2, 3, 4, 5] : [2, 3, 1, 4, 5];
}

/** FNV-1a, then mulberry32: tiny, seedable, and the same in every runtime. */
function rng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function assemble(input: AssembleInput): Assembled {
  const random = rng(input.seed);
  /* Engineering's hands-on is coding first, then a task (spot the bug in a Dockerfile, order the
     steps of a deploy) for skills that cannot be tested by running code. PM and BD: tasks only. */
  const handsOnTypes: BankItem["type"][] = input.format === "coding" ? ["coding", "task"] : ["task"];
  const handsOnType = handsOnTypes[0];
  const order = difficultyOrder(input.level, input.experienceBand);
  const skip = new Set(input.skip);
  const used = new Set<string>();

  const eligible = input.pool.filter(
    (item) => !skip.has(item.skillId) && (item.stackId == null || input.stackIds.includes(item.stackId)) && (item.type === "mcq" || handsOnTypes.includes(item.type)),
  );
  // One shuffle key per item, fixed for the whole run, so ties break the same way everywhere.
  const jitter = new Map(eligible.map((item) => [item.id, random()]));

  const rank = (item: BankItem) => {
    const band = order.indexOf(item.difficulty);
    return (input.seen.has(item.id) ? 100 : 0) + (band < 0 ? 50 : band) + jitter.get(item.id)!;
  };

  const take = (skillId: string | null, type: BankItem["type"], count: number): BankItem[] => {
    if (count <= 0) return [];
    const candidates = eligible
      .filter((item) => !used.has(item.id) && item.type === type && (skillId == null || item.skillId === skillId))
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, count);
    for (const item of candidates) used.add(item.id);
    return candidates;
  };

  const takeHandsOn = (skillId: string | null, count: number): BankItem[] => {
    const out: BankItem[] = [];
    for (const type of handsOnTypes) out.push(...take(skillId, type, count - out.length));
    return out;
  };

  const picked: AssembledItem[] = [];
  const shortfalls: Shortfall[] = [];
  let carryHandsOn = 0;
  let carryMcq = 0;

  const groups: MixGroup[] = ["focus", "other", "basics"];
  for (const group of groups) {
    const lines = input.mix.lines.filter((line) => line.group === group && !skip.has(line.skillId));
    for (const line of lines) {
      const wantHandsOn = line.handsOn + (carryHandsOn > 0 ? 1 : 0);
      const wantMcq = line.mcq + (carryMcq > 0 ? 1 : 0);
      if (carryHandsOn > 0) carryHandsOn -= 1;
      if (carryMcq > 0) carryMcq -= 1;

      const handsOn = takeHandsOn(line.skillId, wantHandsOn);
      const mcq = take(line.skillId, "mcq", wantMcq);
      // Short on one type: use the other type of the same skill before giving the question away.
      let missingHandsOn = wantHandsOn - handsOn.length;
      let missingMcq = wantMcq - mcq.length;
      const extraMcq = missingHandsOn > 0 ? take(line.skillId, "mcq", missingHandsOn) : [];
      missingHandsOn -= extraMcq.length;
      const extraHandsOn = missingMcq > 0 ? takeHandsOn(line.skillId, missingMcq) : [];
      missingMcq -= extraHandsOn.length;

      if (wantHandsOn - handsOn.length > 0) shortfalls.push({ skillId: line.skillId, type: handsOnType, missing: wantHandsOn - handsOn.length });
      if (wantMcq - mcq.length > 0) shortfalls.push({ skillId: line.skillId, type: "mcq", missing: wantMcq - mcq.length });

      for (const item of [...handsOn, ...extraHandsOn, ...mcq, ...extraMcq].sort((a, b) => a.difficulty - b.difficulty)) {
        picked.push({ item, skillId: line.skillId, group });
      }
      carryHandsOn += missingHandsOn;
      carryMcq += missingMcq;
    }
  }

  // Whatever is still owed comes from anywhere in the department, easiest first.
  const fillers = [...takeHandsOn(null, carryHandsOn), ...take(null, "mcq", carryMcq)];
  for (const item of fillers) picked.push({ item, skillId: item.skillId, group: "filler" });

  return { items: picked.slice(0, input.mix.total), shortfalls };
}
