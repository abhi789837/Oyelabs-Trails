import { classify, type DecisionAnswers } from "../../../../shared/decision";
import { planBlueprintMix } from "../../../../shared/setup";

/**
 * TEST STAND-INS for the v4.1 personalised-assessment calls (`assessment_plan`,
 * `assessment_items`, `mcq_check`), used by `MockProvider` only — never in production, where the
 * mock is refused.
 *
 * Like `mockFixtures.ts`, these are deliberately *correct* rather than random: a plan that follows
 * the slider mix (so `enforceBlueprint` keeps it), items that pass `validateCandidate` (size limits,
 * the slot's time ceiling, `checkTask`, and coding tests the starter fails and the reference passes),
 * and a checker that agrees with the keys it was handed. They are also *description-aware*: themes
 * come from the admin's description and the stack, and every generated item quotes them, so an
 * end-to-end run can see personalisation happen without a credential.
 *
 * They prove the plumbing and the "in their context" wiring. They say nothing about whether a real
 * model writes good questions.
 */

// ---------------------------------------------------------------------------
// assessment_plan
// ---------------------------------------------------------------------------

interface PlanProfile {
  department?: string;
  format?: "coding" | "tasks";
  track?: string | null;
  stacks?: string[];
  level?: number | null;
  priorities?: { id: string; name: string; slider: number }[];
  basics?: { id: string; name: string }[];
  /** v4.3: prerequisite probes of the Critical/High goals. */
  probes?: { id: string; name: string }[];
  description?: string;
}

/** Filler a key phrase should not start with ("Handles 3 …", "weak on …", "building …"). */
const LEAD =
  /^(?:(?:handles?|handling|manages?|managing|weak|strong|good|bad|poor|on|at|in|is|are|was|a|an|the|very|quite|really|needs?|wants?|to|own|building|builds?|works?|working|joined|from|of|by|mostly|also|currently|struggles?|their|his|her|our|some|and|\d+)\s+)+/i;
const TRAIL = /\s+(?:and|or|the|a|an|to|of)$/i;

/** The description's key phrases: "overseas clients", "client calls", "Excel", "payment webhooks". */
export function descriptionThemes(description: string, stacks: readonly string[] = []): string[] {
  const out: string[] = [];
  const add = (raw: string) => {
    let phrase = raw.trim().replace(LEAD, "").replace(TRAIL, "").trim();
    const words = phrase.split(/\s+/).filter(Boolean);
    if (words.length > 4) phrase = words.slice(-3).join(" ").replace(LEAD, "").trim();
    if (phrase.length < 2 || phrase.length > 40) return;
    if (out.some((t) => t.toLowerCase() === phrase.toLowerCase())) return;
    out.push(phrase);
  };
  for (const chunk of description.split(/[,.;:!?\n()]|\s+(?:and|but|for|with|while)\s+/i)) add(chunk);
  for (const stack of stacks) {
    if (!out.some((t) => t.toLowerCase().includes(stack.toLowerCase().split("/").pop()!))) add(stack);
  }
  return out.slice(0, 8);
}

const CODE_LIKE = /php|laravel|eloquent|javascript|typescript|react|node|express|next|vue|angular|python|django|fastapi|java|kotlin|dart|flutter|sql/i;

/** Hands-on kinds a plan proposes for a skill, by what the skill is about. Empty = let the rules pick. */
function handsOnKinds(skillName: string, format: "coding" | "tasks", skillId = ""): string[] {
  if (format === "coding") return CODE_LIKE.test(skillName) ? ["code"] : [];
  // v4.2 process skills: classify requests, fill the CR form, and (meetings) a short client role-play.
  if (skillId === "pm-proc-meetings") return ["roleplay", "categorize", "form"];
  if (/-proc-/.test(skillId)) return /template/i.test(skillName) ? ["form", "categorize"] : ["categorize", "form"];
  if (/excel|spreadsheet/i.test(skillName)) return ["excel"];
  if (/email|writing/i.test(skillName)) return ["write"];
  if (/meeting|presenting/i.test(skillName)) return ["sim", "write", "scenario"];
  if (/client management/i.test(skillName)) return ["write", "scenario"];
  if (/tech terms|plain language|sdlc/i.test(skillName)) return ["write", "scenario"];
  if (/keka|timesheet/i.test(skillName)) return ["sim"];
  if (/resourc|capacity/i.test(skillName)) return ["scenario", "excel"];
  return ["scenario"];
}

export function fixturePlan(userJson: string) {
  const profile = JSON.parse(userJson) as PlanProfile;
  const format = profile.format ?? "coding";
  const description = (profile.description ?? "").trim();
  const priorities = profile.priorities ?? [];
  const themes = descriptionThemes(description, profile.stacks ?? []);

  const critical = priorities.filter((p) => p.slider === 5).map((p) => p.name);
  const high = priorities.filter((p) => p.slider === 4).map((p) => p.name);
  const clip = (text: string) => (text.length > 160 ? `${text.slice(0, 157)}...` : text);
  const intent = [
    ...(description ? [clip(`From the description: "${description.length > 110 ? `${description.slice(0, 107)}...` : description}"`)] : []),
    ...(critical.length ? [clip(`Critical for the admin: ${critical.join(", ")}`)] : high.length ? [clip(`High for the admin: ${high.join(", ")}`)] : []),
    ...(themes.length ? [clip(`Set questions in their own context: ${themes.slice(0, 4).join(", ")}`)] : []),
    ...(profile.basics?.length ? [clip(`Where they stand on the ${profile.track ?? profile.department ?? "role"} basics`)] : []),
  ].slice(0, 5);
  if (intent.length === 0) intent.push("Where they stand on the basics of their role");

  // The same mix the server computes, so every proposed slot survives `enforceBlueprint`.
  const mix = planBlueprintMix(
    priorities.map((p) => ({ skillId: p.id, skillName: p.name, slider: p.slider })),
    (profile.basics ?? []).map((b) => ({ skillId: b.id, skillName: b.name, slider: 0 })),
    (profile.probes ?? []).map((b) => ({ skillId: b.id, skillName: b.name, slider: 0 })),
  );
  const slots: { skillId: string; kind: "handsOn" | "mcq"; subtype: string; difficulty: number; hint: string }[] = [];
  const start = Math.min(4, Math.max(1, profile.level ?? 2));
  // Like the real model, lean toward what the description stresses: one extra hands-on proposal
  // for each skill whose name shares a word with it ("calls" reads as meetings).
  const said = new Set(
    description
      .toLowerCase()
      .replace(/calls?/g, "meetings calls")
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 5),
  );
  const stressed = (name: string) => name.toLowerCase().split(/[^a-z]+/).some((w) => w.length >= 5 && said.has(w));
  for (const line of mix.lines) {
    const kinds = handsOnKinds(line.skillName, format, line.skillId);
    const extra = stressed(line.skillName) && line.handsOn > 0 ? 1 : 0;
    const theme = themes[slots.length % Math.max(1, themes.length)] ?? "";
    const hint = clip(theme ? `${theme}: ${line.skillName}` : line.skillName);
    for (let i = 0; i < line.handsOn + extra && kinds.length; i += 1) {
      slots.push({ skillId: line.skillId, kind: "handsOn", subtype: kinds[i % kinds.length], difficulty: start, hint });
    }
    for (let i = 0; i < line.mcq; i += 1) {
      const subtype = format === "coding" && CODE_LIKE.test(line.skillName) && i % 2 === 0 ? "mcq-code" : "mcq-text";
      slots.push({ skillId: line.skillId, kind: "mcq", subtype, difficulty: start, hint });
    }
  }
  return { intent, themes, slots: slots.slice(0, 40) };
}

// ---------------------------------------------------------------------------
// assessment_items
// ---------------------------------------------------------------------------

interface ItemsRequest {
  context?: { department?: string; track?: string | null; stack?: string[]; themes?: string[]; about?: string };
  handbook?: { ref: string }[];
  slots?: {
    slot: number;
    skill: string;
    type: "coding" | "task" | "mcq";
    subtype: string;
    language?: string;
    /** v4.2 grounding: a process slot, its suggested handbook refs, and a role-play scenario. */
    grounded?: boolean;
    refs?: string[];
    scenarioId?: string;
    personaId?: string;
    /** v4.3: an outcome slot's case and its shortened capstone, the model to follow. */
    outcome?: { caseId?: string; title: string; model: Record<string, unknown> };
  }[];
}

interface Ctx {
  theme: string;
  other: string;
  stack: string;
  tags: string[];
  engineering: boolean;
}

const base = (slot: number, prompt: string, ctx: Ctx) => ({ slot, prompt, coding: null, mcq: null, task: null, answerIsOutput: false, tags: ctx.tags, handbookRefs: [] as string[], facts: null as Record<string, DecisionAnswers> | null });

const lead = (c: Ctx) => `You work with ${c.other}${c.engineering ? ` on ${c.stack}` : ""}, and your lead wants you stronger on ${c.theme}. Assume a normal week at a busy software agency. Read the situation and pick the best answer.`;

/** Drops the optional framing sentences of `lead` until the stem fits the 60-word limit (long themes). */
function fitWords(text: string, max = 60): string {
  let out = text;
  for (const optional of [" Assume a normal week at a busy software agency.", " Read the situation and pick the best answer."]) {
    if (out.split(/\s+/).length <= max) break;
    out = out.replace(optional, "");
  }
  return out;
}

/** The same stem is asked with differently ordered options on different slots, so key on both. */
const mcqKey = (question: string, options: readonly string[]) => JSON.stringify([question, options]);

/** Rotates `options` so the keyed answer is not always first; returns the new key. */
function rotate(options: string[], slot: number): { options: string[]; correctIndex: number } {
  const k = slot % options.length;
  return { options: [...options.slice(k), ...options.slice(0, k)], correctIndex: (options.length - k) % options.length };
}

const lines = (...rows: string[]) => rows.join("\n");
const NOTE = ['delivery results, e.g. ["failed", "ok"]', "Called once per batch of provider deliveries.", 'Only "failed" counts; "ok" and "retrying" do not.'];

// A tiny function-mode fix-the-bug item: the starter counts every status, the fix counts "failed".
const CODE: Record<string, { fn: string; starter: string; reference: string }> = {
  javascript: {
    fn: "countFailed",
    starter: lines("function countFailed(statuses) {", ...NOTE.map((n) => `  // ${n}`), "  return statuses.length;", "}"),
    reference: lines("function countFailed(statuses) {", ...NOTE.map((n) => `  // ${n}`), '  return statuses.filter((s) => s === "failed").length;', "}"),
  },
  typescript: {
    fn: "countFailed",
    starter: lines("function countFailed(statuses: string[]): number {", ...NOTE.map((n) => `  // ${n}`), "  return statuses.length;", "}"),
    reference: lines("function countFailed(statuses: string[]): number {", ...NOTE.map((n) => `  // ${n}`), '  return statuses.filter((s) => s === "failed").length;', "}"),
  },
  python: {
    fn: "count_failed",
    starter: lines("def count_failed(statuses):", ...NOTE.map((n) => `    # ${n}`), "    return len(statuses)"),
    reference: lines("def count_failed(statuses):", ...NOTE.map((n) => `    # ${n}`), '    return sum(1 for s in statuses if s == "failed")'),
  },
  php: {
    fn: "countFailed",
    starter: lines("<?php", "function countFailed(array $statuses): int {", ...NOTE.map((n) => `    // ${n}`), "    return count($statuses);", "}"),
    reference: lines("<?php", "function countFailed(array $statuses): int {", ...NOTE.map((n) => `    // ${n}`), '    return count(array_filter($statuses, fn($s) => $s === "failed"));', "}"),
  },
};

const SNIPPET: Record<string, string> = {
  javascript: lines("// one batch of provider deliveries", 'const statuses = ["failed", "ok", "failed"];', 'console.log(statuses.filter((s) => s === "failed").length);'),
  typescript: lines("// one batch of provider deliveries", 'const statuses: string[] = ["failed", "ok", "failed"];', 'console.log(statuses.filter((s) => s === "failed").length);'),
  python: lines("# one batch of provider deliveries", 'statuses = ["failed", "ok", "failed"]', 'print(sum(1 for s in statuses if s == "failed"))'),
  php: lines("<?php", "// one batch of provider deliveries", '$statuses = ["failed", "ok", "failed"];', 'echo count(array_filter($statuses, fn($s) => $s === "failed"));'),
};

function codingItem(slot: number, language: string, ctx: Ctx) {
  const spec = CODE[language];
  if (!spec) return null;
  return {
    ...base(slot, `${ctx.stack}, ${ctx.theme}: the handler for ${ctx.other} logs each delivery status, and the daily report needs the number of failures. Fix \`${spec.fn}\` so it returns how many statuses are "failed".`, ctx),
    coding: {
      language,
      mode: "function",
      functionName: spec.fn,
      starterCode: spec.starter,
      referenceSolution: spec.reference,
      sampleTests: [{ args: [["failed", "ok", "failed"]], expected: 2 }],
      hiddenTests: [
        { args: [[]], expected: 0 },
        { args: [["ok", "ok"]], expected: 0 },
        { args: [["failed"]], expected: 1 },
        { args: [["ok", "failed", "ok", "failed", "failed"]], expected: 3 },
      ],
    },
  };
}

function mcqCodeItem(slot: number, language: string, ctx: Ctx, keys: Map<string, number>) {
  const snippet = SNIPPET[language];
  if (!snippet) return null;
  const prompt = `You work with ${ctx.other} on ${ctx.stack}. This comes from your ${ctx.theme} log handler, which reports failed deliveries. What does this code print?`;
  const { options, correctIndex } = rotate(["2", "3", "1", "0"], slot);
  keys.set(mcqKey(prompt, options), correctIndex);
  return {
    ...base(slot, prompt, ctx),
    mcq: { options, correctIndex, explanation: 'Only the two "failed" entries are counted.', snippet, snippetLanguage: language },
  };
}

const MCQ_ENG = [
  (c: Ctx) => ({
    q: `${lead(c)} Your ${c.theme} endpoint receives the same provider event twice within a minute, because the provider retried after a slow response. What should the ${c.stack} handler do?`,
    a: ["Process it once, keyed on the provider's event id, and acknowledge both", "Process it twice, once for each delivery the provider sent", "Return a 500 error so the provider sends it once more", "Delete the earlier record and keep only the newest copy of it"],
    why: "Webhooks are delivered at least once, so handlers must be idempotent.",
  }),
  (c: Ctx) => ({
    q: `${lead(c)} The payment provider gives you a signing secret to verify each incoming request. Where should the ${c.stack} app for ${c.other} keep it?`,
    a: ["In an environment variable on the server, kept out of the git repository", "Hard-coded as a constant inside the controller class that checks it", "In a plain text file under the public web folder of the app", "In the client-side script, so the browser can check each signature"],
    why: "Secrets live in the environment, never in the repository or the browser.",
  }),
  (c: Ctx) => ({
    q: `${lead(c)} A ${c.theme} request now takes about 20 seconds, because a third-party call inside it is slow. What is the best fix?`,
    a: ["Move the slow call onto a queue and respond to the user straight away", "Raise the server timeout to 60 seconds for this one route", "Retry the third-party call in a tight loop until it finally answers", "Ask users in the interface to wait a little longer each time"],
    why: "Slow external work belongs on a queue so the request stays fast.",
  }),
];

const MCQ_PM = [
  (c: Ctx) => ({
    q: `${lead(c)} Your ${c.theme} contact is five hours ahead of the delivery team and has missed the last two update calls. When should the weekly call be?`,
    a: ["A fixed weekly slot inside both sides' working hours, agreed with the client", "Whenever it happens to suit our own delivery team that week", "Late evening for the client, after all of their own meetings", "Nowhere; stop the calls and send them long emails instead"],
    why: "Pick an overlap both sides can make, and keep it fixed.",
  }),
  (c: Ctx) => ({
    q: `${lead(c)} You send a weekly status email to ${c.theme}. The project is on track with one open risk. Which subject line works best?`,
    a: ["Project status, week 12: on track, one risk for you to review", "Update", "Hi, a few things from our side this week, please have a look", "Quick question?? Please read this when you can find some time"],
    why: "A subject that states the status lets a busy client triage it.",
  }),
  (c: Ctx) => ({
    q: `${lead(c)} Your Excel tracker lists clients in A2:A9 and billable hours in B2:B9. Which formula totals the hours only for rows where column A says "UK"?`,
    a: ['=SUMIF(A2:A9,"UK",B2:B9), which adds the hours of only the UK rows', "=SUM(B2:B9), which adds the hours of every row in the column", '=COUNTIF(A2:A9,"UK"), which counts how many UK rows the tracker has', "=AVERAGE(B2:B9), which gives the mean of all the hours listed"],
    why: "SUMIF adds the values whose criteria cell matches.",
  }),
];

function mcqTextItem(slot: number, skill: string, ctx: Ctx, keys: Map<string, number>) {
  const pool = ctx.engineering ? MCQ_ENG : MCQ_PM;
  const pick = ctx.engineering ? slot % pool.length : /excel|spreadsheet/i.test(skill) ? 2 : /email|writing/i.test(skill) ? 1 : /meeting|client/i.test(skill) ? 0 : slot % pool.length;
  const t = pool[pick](ctx);
  t.q = fitWords(t.q);
  const { options, correctIndex } = rotate(t.a, slot);
  keys.set(mcqKey(t.q, options), correctIndex);
  return { ...base(slot, t.q, ctx), mcq: { options, correctIndex, explanation: t.why, snippet: null, snippetLanguage: null } };
}

function writeItem(slot: number, skill: string, ctx: Ctx) {
  const email = /email|writing|client management|escalat/i.test(skill) || ctx.engineering;
  const rubric = (items: [string, string][]) => items.map(([id, label]) => ({ id, label, description: label, weight: 1 }));
  if (email) {
    return {
      ...base(slot, `Reply to your ${ctx.theme} contact by email. Own the slip, give the new date and one clear next step.`, ctx),
      task: {
        kind: "write",
        variant: "email",
        prompt: "Write the body of your reply.",
        context: `From: Sarah (${ctx.other})\nSubject: Release date?\nWe expected the build on Friday. What happened?`,
        wordLimit: 25,
        rubric: rubric([
          ["own", "Owns the delay without blame"],
          ["date", "Gives a specific new date"],
          ["next", "Ends with one clear next step"],
        ]),
        sampleAnswer: "Hi Sarah, the build slipped because payment testing found a bug. New date: Wednesday. I will send the test link Tuesday.",
      },
    };
  }
  return {
    ...base(slot, `In a client call with ${ctx.theme}, explain in plain words what an API is and why the release waits on one.`, ctx),
    task: {
      kind: "write",
      variant: "explain",
      prompt: "Write what you would say, no jargon.",
      context: `The client (${ctx.other}) asked: "Why does the app depend on someone else's API?"`,
      wordLimit: 25,
      rubric: rubric([
        ["correct", "Explains an API correctly"],
        ["simple", "Uses plain words, no jargon"],
        ["impact", "Links it to the release date"],
      ]),
      sampleAnswer: "An API is how our app asks another system for data, like a waiter taking orders. Their side changed, so we adapt before release.",
    },
  };
}

function excelItem(slot: number, ctx: Ctx) {
  const ifs = (r: number) => `=IF(B${r}>C${r},"Over","OK")`;
  return {
    ...base(slot, `Weekly hours tracker for your ${ctx.theme}, shared with ${ctx.other} every Friday. Total the hours in B6 with SUM, and fill each Status (D2:D6) with IF: "Over" when hours exceed the budget, else "OK".`, ctx),
    task: {
      kind: "excel",
      prompt: "Fill B6 and D2:D6 with formulas.",
      grid: [
        ["Client", "Hours", "Budget", "Status"],
        ["UK retainer", "12", "10", ""],
        ["US app", "8", "10", ""],
        ["AU website", "9", "9", ""],
        ["DE portal", "15", "12", ""],
        ["Total", "", "=SUM(C2:C5)", ""],
      ],
      editable: ["B6", "D2", "D3", "D4", "D5", "D6"],
      checks: [
        { cell: "B6", expected: 44, requireFormula: true, functions: ["SUM"] },
        { cell: "D2", expected: "Over", requireFormula: true, functions: ["IF"] },
        { cell: "D3", expected: "OK", requireFormula: true, functions: ["IF"] },
        { cell: "D4", expected: "OK", requireFormula: true, functions: ["IF"] },
        { cell: "D5", expected: "Over", requireFormula: true, functions: ["IF"] },
        { cell: "D6", expected: "Over", requireFormula: true, functions: ["IF"] },
      ],
      solution: { B6: "=SUM(B2:B5)", D2: ifs(2), D3: ifs(3), D4: ifs(4), D5: ifs(5), D6: ifs(6) },
      explanation: "SUM totals the column; IF compares hours with budget per row.",
    },
  };
}

function simItem(slot: number, skill: string, ctx: Ctx) {
  if (/keka|timesheet/i.test(skill)) {
    return {
      ...base(slot, `Approve this week's timesheets for the ${ctx.theme} projects before the invoice goes to ${ctx.other} on Monday. Flag every row you should not approve as it stands, then answer the questions.`, ctx),
      task: {
        kind: "sim",
        app: "keka-timesheets",
        prompt: "Flag rows you should not approve.",
        title: `Timesheet approvals: ${ctx.theme}`.slice(0, 120),
        columns: ["Employee", "Project", "Hours (week)", "Description"],
        rows: [
          { id: "r1", cells: ["Ann", "UK retainer", "38", "Payment page fixes"], issue: null },
          { id: "r2", cells: ["Bo", "UK retainer", "71", "Development"], issue: "71 h in a week is far over capacity." },
          { id: "r3", cells: ["Cy", "US app", "36", "Push notifications"], issue: null },
          { id: "r4", cells: ["Dee", "US app", "40", ""], issue: "No description of the work." },
          { id: "r5", cells: ["Eli", "AU website", "35", "Content updates"], issue: null },
          { id: "r6", cells: ["Fay", "DE portal", "40", "Checkout QA, regression run"], issue: null },
          { id: "r7", cells: ["Gus", "DE portal", "12", "Billed to UK retainer by mistake"], issue: "Logged against the wrong client project." },
          { id: "r8", cells: ["Hal", "US app", "37", "Sprint 9 stories, code review"], issue: null },
          { id: "r9", cells: ["Ivy", "UK retainer", "39", "Webhook retries, release prep"], issue: null },
          { id: "r10", cells: ["Jo", "AU website", "34", "Accessibility fixes"], issue: null },
        ],
        questions: [
          { id: "q1", question: "What do you do with Bo's row?", options: ["Send it back asking him to check the hours", "Approve it", "Delete it"], correctIndex: 0, explanation: "Query it; do not approve or delete." },
          { id: "q2", question: "Dee's row has no description. Why does it matter?", options: ["The client invoice needs to show the work done", "It does not matter", "Keka rejects it automatically"], correctIndex: 0, explanation: "Billable time needs a description the client can read." },
          { id: "q3", question: "When should timesheets be approved?", options: ["Before the invoice run, every week", "Once a quarter", "Only when someone complains"], correctIndex: 0, explanation: "Weekly approval keeps invoices accurate." },
        ],
      },
    };
  }
  return {
    ...base(slot, `This is the chat from your weekly update call about ${ctx.theme}, with ${ctx.other} and your dev lead. Flag every message where the PM got it wrong, then answer the questions below.`, ctx),
    task: {
      kind: "sim",
      app: "teams",
      prompt: "Flag the PM's mistakes.",
      title: `Weekly update: ${ctx.theme}`.slice(0, 120),
      columns: ["Speaker", "Time", "Message"],
      rows: [
        { id: "m1", cells: ["You (PM)", "10:00", "Agenda: progress, risks, next steps."], issue: null },
        { id: "m2", cells: ["Client", "10:04", "Can we add a new report page this sprint?"], issue: null },
        { id: "m3", cells: ["You (PM)", "10:05", "Sure, no problem, we will add it."], issue: "Agreed new scope without checking impact." },
        { id: "m4", cells: ["Dev lead", "10:08", "Login fix is in UAT, ready Thursday."], issue: null },
        { id: "m5", cells: ["You (PM)", "10:12", "I will send the minutes next week."], issue: "Minutes should go out the same day." },
        { id: "m6", cells: ["Client", "10:13", "Is the payment page still on track for launch?"], issue: null },
        { id: "m7", cells: ["Dev lead", "10:14", "Yes, pending the provider's sandbox keys."], issue: null },
        { id: "m8", cells: ["You (PM)", "10:15", "I will chase the keys today and confirm by 5 pm."], issue: null },
        { id: "m9", cells: ["Client", "10:16", "Great. Can you share the demo link before Friday?"], issue: null },
        { id: "m10", cells: ["You (PM)", "10:17", "We will see, no promises on that."], issue: "Vague reply: give a date or say what blocks it." },
      ],
      questions: [
        { id: "q1", question: "What should close every client update call?", options: ["Agreed actions with owners and dates", "A list of new ideas", "Nothing; the call is enough"], correctIndex: 0, explanation: "Actions, owners and dates make the call useful." },
        { id: "q2", question: "The client asked for new scope. What is the right reply?", options: ["We will assess it and confirm impact by tomorrow", "Yes, free of charge", "No, never"], correctIndex: 0, explanation: "Assess first, then agree in writing." },
        { id: "q3", question: "Who owns chasing the sandbox keys?", options: ["The PM, with a date agreed on the call", "Nobody; it will sort itself out", "The client's finance team"], correctIndex: 0, explanation: "Blockers get an owner and a date." },
      ],
    },
  };
}

function scenarioItem(slot: number, ctx: Ctx) {
  return {
    ...base(slot, `A client call with your ${ctx.theme} contact is drifting and the client sounds unhappy. Make the calls.`, ctx),
    task: {
      kind: "scenario",
      prompt: `Call with ${ctx.theme}: the release slipped and the client raises a new request.`,
      steps: [
        {
          id: "s1",
          question: "The client asks for a new feature mid-call. What do you do first?",
          options: ["Note it, and agree to assess the impact and cost after the call", "Promise it for this sprint so the client stays happy", "Ignore it and move on to the next agenda item"],
          correctIndex: 0,
          explanation: "Capture it, then assess before committing.",
        },
        {
          id: "s2",
          question: "The client is upset about the slip. What do you lead with?",
          options: ["Own it, give the new date and the plan to recover the time", "Explain that the developers caused the slip, not you", "Say that slips are normal in software and move on"],
          correctIndex: 0,
          explanation: "Ownership plus a concrete plan rebuilds trust.",
        },
        {
          id: "s3",
          question: "What goes out after the call, and when?",
          options: ["Minutes with decisions, owners and dates, sent the same day", "Nothing until the next weekly call comes round", "A full new project plan, some time next month"],
          correctIndex: 0,
          explanation: "Same-day minutes keep everyone aligned.",
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// v4.2: handbook-grounded process items (categorize with facts, the CR form, a mini role-play)
// ---------------------------------------------------------------------------

/** Client requests with their decision-tool facts; the key is always recomputed with `classify`. */
const REQUESTS: { id: string; text: string; facts: DecisionAnswers }[] = [
  { id: "r1", text: "Live app crashes at login, which the signed scope covers", facts: { worksAsSpecified: "no", inScope: "yes", warranty: "yes" } },
  { id: "r2", text: "Change the agreed two-step checkout into one step", facts: { worksAsSpecified: "yes", changeKind: "change" } },
  { id: "r3", text: "Make the working search return results faster", facts: { worksAsSpecified: "yes", changeKind: "improve" } },
  { id: "r4", text: "Add a loyalty-points module nobody specified", facts: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "yes" } },
  { id: "r5", text: "Asks why the report shows the previous day, as agreed", facts: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "no" } },
];

const CLASSIFY_LABELS: Record<string, string> = {
  "bug-warranty": "Bug under warranty",
  "change-request": "Change request",
  enhancement: "Enhancement",
  "new-feature": "New feature",
  clarification: "Clarification",
};

function categorizeItem(slot: number, ctx: Ctx) {
  const answer: Record<string, string> = {};
  const facts: Record<string, DecisionAnswers> = {};
  for (const r of REQUESTS) {
    answer[r.id] = classify(r.facts)!.classification;
    facts[r.id] = r.facts;
  }
  const used = [...new Set(Object.values(answer))];
  return {
    ...base(slot, `Requests from your ${ctx.theme} client this week. Classify each one as the handbook defines it.`, ctx),
    task: {
      kind: "categorize",
      prompt: "Put each request in its category.",
      mode: "classify-request",
      categories: used.map((id) => ({ id, label: CLASSIFY_LABELS[id] ?? id })),
      items: REQUESTS.map((r) => ({ id: r.id, text: r.text, explanation: "" })),
      answer,
    },
    facts,
  };
}

function formItem(slot: number, ctx: Ctx) {
  return {
    ...base(slot, `Your ${ctx.theme} client emailed a request. Start the change request form from it.`, ctx),
    task: {
      kind: "form",
      variant: "cr",
      prompt: "Fill in the two fields.",
      context: "From the client: We signed off the order screens last month. Please add a CSV export of all orders to the admin panel before launch. It should be quick, right?",
      templateId: null,
      fields: [
        { id: "type", label: "Request type", input: "select", options: ["Bug", "Enhancement", "Change request", "New feature"], required: true },
        { id: "impact", label: "Impact on time and cost", input: "textarea", required: true },
      ],
      checks: [{ fieldId: "type", expected: "Change request" }],
      rubric: [{ label: "States the impact on time and cost", points: 2, description: "Gives an estimate and says what it does to the date and the price." }],
      sampleAnswer: { type: "Change request", impact: "About 2 days of work at the rate card; launch moves 2 days unless we defer the export." },
    },
  };
}

function roleplayItem(slot: number, ctx: Ctx, scenarioId: string, personaId: string) {
  return {
    ...base(slot, `A short call with your ${ctx.theme} client. Handle it the way the handbook describes.`, ctx),
    task: {
      kind: "roleplay",
      prompt: "Reply as the PM.",
      scenarioId,
      personaId,
      maxTurns: 2,
      brief: "Acknowledge the client, name the process step that applies, and agree a clear next step.",
      rubric: [
        { label: "Uses the right process term", points: 2, description: "Names the request correctly, as the handbook defines it." },
        { label: "Agrees a next step", points: 2, description: "Ends with who does what, by when." },
      ],
      followUp: false,
    },
  };
}

/**
 * Items for the slots asked, in the person's context.
 *
 * Every third slot (index % 3 === 0) is left out the first time it is asked for, so the pipeline's
 * "not returned → regenerate" round runs; it is written when asked again. Subtypes these stand-ins
 * do not write (rank, calculate, spot, allocate; java/dart/sql code) are never returned, so the
 * "→ bank after failures" path runs too. `asked` remembers slots across calls (per provider).
 */
export function fixtureGeneratedItems(userJson: string, keys: Map<string, number>, asked: Set<string>): unknown[] {
  const request = JSON.parse(userJson) as ItemsRequest;
  const context = request.context ?? {};
  const themes = (context.themes ?? []).filter(Boolean);
  const stack = context.stack?.[0] ?? context.track ?? "your stack";
  const engineering = /engineer/i.test(context.department ?? "");
  const ctx: Ctx = {
    theme: themes[0] ?? "client",
    other: themes[1] ?? themes[0] ?? "the client",
    stack,
    engineering,
    tags: [...new Set([...themes.slice(0, 3), stack])].map((t) => t.slice(0, 40)).slice(0, 4),
  };
  const items: unknown[] = [];
  for (const slot of request.slots ?? []) {
    const id = JSON.stringify([context.about ?? "", slot.slot, slot.skill, slot.subtype]);
    const first = !asked.has(id);
    asked.add(id);
    if (first && slot.slot % 3 === 0) continue;
    const local: Ctx = { ...ctx, theme: themes[slot.slot % Math.max(1, themes.length)] ?? ctx.theme };
    const language = slot.language ?? "javascript";
    let item: unknown = null;
    // v4.3: an outcome slot follows its case's capstone (already shortened to fit the slot).
    if (slot.outcome?.model) item = { ...base(slot.slot, String(slot.outcome.model.prompt ?? slot.outcome.title), local), task: { ...slot.outcome.model } };
    else if (slot.type === "coding") item = codingItem(slot.slot, language, local);
    else if (slot.type === "mcq") item = slot.subtype === "mcq-code" ? (mcqCodeItem(slot.slot, language, local, keys) ?? mcqTextItem(slot.slot, slot.skill, local, keys)) : mcqTextItem(slot.slot, slot.skill, local, keys);
    else if (slot.subtype === "write") item = writeItem(slot.slot, slot.skill, local);
    else if (slot.subtype === "excel") item = excelItem(slot.slot, local);
    else if (slot.subtype === "sim") item = simItem(slot.slot, slot.skill, local);
    else if (slot.subtype === "scenario") item = scenarioItem(slot.slot, local);
    else if (slot.subtype === "categorize") item = categorizeItem(slot.slot, local);
    else if (slot.subtype === "form") item = formItem(slot.slot, local);
    else if (slot.subtype === "roleplay" && slot.scenarioId && slot.personaId) item = roleplayItem(slot.slot, local, slot.scenarioId, slot.personaId);
    // Grounded slots cite the handbook entries the request suggested (they are in its handbook list).
    if (item && slot.refs?.length) (item as { handbookRefs: string[] }).handbookRefs = slot.refs.slice(0, 3);
    if (item) items.push(item);
  }
  return items;
}

// ---------------------------------------------------------------------------
// mcq_check
// ---------------------------------------------------------------------------

/** Agrees with the keys this mock wrote; a question it did not write is answered 0. */
export function fixtureMcqCheck(userJson: string, keys: Map<string, number>) {
  const items = JSON.parse(userJson) as { slot: number; question: string; options: string[] }[];
  return { results: items.map((i) => ({ slot: i.slot, correctIndex: keys.get(mcqKey(i.question, i.options)) ?? 0, ambiguous: false })) };
}
