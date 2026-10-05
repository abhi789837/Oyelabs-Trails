import { z } from "zod";

/**
 * v4.2 Phase 4: the AI client role-play.
 *
 * A learner (a PM) holds a short conversation with an AI playing an agency client, then writes the
 * follow-up email, and a small model scores it against a fixed rubric. Everything a conversation is
 * built from lives here: the personas, the scenarios and the standard rubric.
 *
 * **Hidden concerns.** Each persona and scenario carries a `hiddenConcern` that only the model sees:
 * the client reveals it only when the PM asks good questions. The browser never imports
 * `ROLEPLAY_PERSONAS` or `ROLEPLAY_SCENARIOS` (it reads the public catalogue from
 * `GET /api/roleplay/catalog`), so the concerns stay out of the client bundle; the server strips
 * them with `publicPersona` / `publicScenario` before anything leaves it.
 *
 * The project contexts are anonymised agency projects: no real client, brand or person.
 */

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** The most PM messages one conversation allows. */
export const ROLEPLAY_MAX_TURNS = 8;
export const ROLEPLAY_MIN_TURNS = 2;
/** Practice sessions default to six PM messages. */
export const ROLEPLAY_DEFAULT_TURNS = 6;
/** One learner message, in characters. Short typed replies, as in a real chat. */
export const ROLEPLAY_MESSAGE_MAX = 600;
export const ROLEPLAY_EMAIL_MAX = 2500;
/** The client's reply, in words. The prompt asks for this; the server trims anything far over. */
export const ROLEPLAY_REPLY_WORDS = 70;

/** app_meta key for the monthly spend cap on `roleplay` + `roleplay_score`, in micro-dollars. */
export const ROLEPLAY_CAP_KEY = "roleplay.monthly_cap_micros";
/** $25 a month by default. */
export const ROLEPLAY_DEFAULT_CAP_MICROS = 25_000_000;

// ---------------------------------------------------------------------------
// Personas and scenarios
// ---------------------------------------------------------------------------

export interface RoleplayPersona {
  id: string;
  /** Fictional. */
  name: string;
  initials: string;
  role: string;
  /** How they talk. */
  style: string;
  /** What they want from the conversation. */
  goal: string;
  /** Only the model sees this. Revealed only when the PM asks good questions. */
  hiddenConcern: string;
}

export interface RoleplayScenario {
  id: string;
  title: string;
  /** One line for the picker. */
  summary: string;
  /** The anonymised project, as the PM knows it. */
  context: string;
  /** The client's first message. */
  opening: string;
  /** What the PM must achieve. */
  objective: string;
  /** What the client wants in this scenario (shown to the model, and to the learner as the ask). */
  clientAsk: string;
  /** A scenario-specific worry the model holds back, on top of the persona's. */
  hiddenConcern: string;
  /** Handbook term ids involved (docs/v4.2/TERM_IDS.md). */
  termIds: string[];
  defaultPersonaId: string;
  /**
   * The scripted client, used when no AI is configured: one line per PM turn after the opening.
   * The last line repeats if the conversation runs longer.
   */
  scripted: string[];
  /** Shown instead of a score in scripted mode: what a strong conversation does. */
  selfCheck: string[];
}

export const ROLEPLAY_PERSONAS: readonly RoleplayPersona[] = [
  {
    id: "startup-founder",
    name: "Rohan Malik",
    initials: "RM",
    role: "Founder and CEO of a seed-stage startup",
    style: "Fast, impatient, short sentences. Pushes for speed, says 'it's tiny' a lot, name-drops investors, sometimes types in fragments.",
    goal: "Get more shipped before the investor demo without paying more or moving the date.",
    hiddenConcern:
      "The investor demo is in three weeks and the runway is about four months. He is scared the demo will look thin next to a competitor that just raised, and he has not told his co-founder how tight the budget is.",
  },
  {
    id: "small-business-owner",
    name: "Grace Fernandes",
    initials: "GF",
    role: "Owner of a three-outlet bakery business",
    style: "Warm, chatty and anxious. Non-technical: jargon confuses and worries her, and she says so. Asks 'what does that mean for me?'.",
    goal: "An app that works for her customers, without surprise bills.",
    hiddenConcern:
      "She is paying for the app from her personal savings, and her nephew told her 'this sort of thing should be easy', so she is afraid of being overcharged and of looking foolish to her family.",
  },
  {
    id: "enterprise-stakeholder",
    name: "Daniel Okoro",
    initials: "DO",
    role: "Head of Digital at a regional logistics company",
    style: "Formal and measured. Process-minded: asks for things in writing, cites the SOW, procurement and governance. Never rude, but persistent.",
    goal: "Keep the programme on track and protect his standing with leadership.",
    hiddenConcern:
      "He has to brief the steering committee on Friday and already promised the current date to his CTO. A surprise in front of the committee is what he fears most, more than the slip itself.",
  },
  {
    id: "whitelabel-reseller",
    name: "Aisha Rahman",
    initials: "AR",
    role: "Managing director of a reseller agency that sells the white-label app under its own brand",
    style: "Commercial and busy, multitasking. Compares you with other vendors, wants answers in one line, pushes for workarounds.",
    goal: "Launch her end client's branded app fast and keep that client happy.",
    hiddenConcern:
      "Her end client has threatened to cancel, and she promised them a launch date (and a couple of features) before checking what the core product does.",
  },
];

export const ROLEPLAY_SCENARIOS: readonly RoleplayScenario[] = [
  {
    id: "scope-creep",
    title: "Just one more small thing",
    summary: "The client asks for a loyalty-points module mid-sprint and calls it small.",
    context:
      "A multi-vendor ordering app (customer app, vendor app, admin panel) on a fixed bid. The signed SOW and scope baseline cover ordering, payments and order tracking. You are in sprint 5 of 8; the next milestone invoice is due at the end of sprint 6.",
    opening:
      "Hey! Quick one. We need loyalty points in the app before the demo — earn on every order, redeem at checkout. It's tiny, the team can slot it in this sprint, right? Investors love retention stuff.",
    objective:
      "Acknowledge the idea, show it is outside the signed scope, offer a change request with an impact estimate (time and cost) or a trade-off, and commit to nothing for free.",
    clientAsk: "Add a loyalty-points module this sprint, inside the current price and date.",
    hiddenConcern: "He only needs a believable demo of loyalty points, not the full earn-and-redeem engine.",
    termIds: ["scope-creep", "change-request", "scope-baseline", "sow", "out-of-scope", "new-feature", "estimate", "fixed-bid", "phase-2"],
    defaultPersonaId: "startup-founder",
    scripted: [
      "Come on, it's points. Add a number to the user and subtract it at checkout. A day, maybe two?",
      "But we're paying a lot already. Other agencies throw in small things. Why is this a whole process?",
      "OK, what would a change request even look like? How long, how much?",
      "Hmm. What if we only need it to look real for the demo? Does that change anything?",
      "Fine. Send me something in writing and I'll look tonight.",
      "Got it. Thanks for not just saying no.",
      "Alright, talk soon.",
    ],
    selfCheck: [
      "Did you acknowledge why loyalty matters to them before talking about scope?",
      "Did you name it as outside the signed scope (SOW / scope baseline) without sounding defensive?",
      "Did you offer a change request with an impact on time and cost, or a trade-off (swap, Phase 2)?",
      "Did you ask what the demo actually needs?",
      "Did you avoid committing the team to anything for free?",
      "Did you end with a concrete next step and a date?",
    ],
  },
  {
    id: "delay-announcement",
    title: "Telling the client the release slips",
    summary: "You must tell the client the UAT release is a week late.",
    context:
      "A shipment-tracking portal for a logistics company. The UAT release was due this Friday. It will be a week late: the payment-gateway API keys arrived from the client six working days late (a client dependency logged in the RAID log), and a regression found in internal QA needs a fix and a retest.",
    opening:
      "Good afternoon. Your message said you needed to discuss the UAT release. I assume we are still on for Friday?",
    objective:
      "Announce the slip clearly and early in the conversation, give the reason honestly (both the client dependency and your own regression), the new date, the impact and the mitigation, and agree how it is communicated upward.",
    clientAsk: "Keep Friday, or at least avoid any surprise for his leadership.",
    hiddenConcern: "He would accept a partial UAT drop on Friday if he had something concrete to show.",
    termIds: ["milestone", "client-dependency", "dependency", "regression", "rag-status", "release", "risk", "raid-log", "uat"],
    defaultPersonaId: "enterprise-stakeholder",
    scripted: [
      "I see. That is disappointing. Can you explain precisely what caused the delay?",
      "The keys were late, yes, but a week seems a lot. What is your part in this?",
      "What is the new date, and how confident are you in it?",
      "Is there anything we could see on Friday regardless?",
      "Please put this in writing today, with the revised plan. I will need it for my own reporting.",
      "Understood. Thank you for being direct.",
      "Very well. I will wait for your email.",
    ],
    selfCheck: [
      "Did you say the release is late in your first or second message, not after small talk?",
      "Did you give both causes honestly: the late client dependency and your own regression?",
      "Did you give a new date with what it depends on?",
      "Did you offer a mitigation (a partial drop, a demo, extra checks)?",
      "Did you avoid blaming the client while still naming the dependency?",
      "Did you agree to put the revised plan in writing, with a time?",
    ],
  },
  {
    id: "cr-price-pushback",
    title: "The change request costs how much?",
    summary: "The client balks at the price of a change request you sent.",
    context:
      "An ordering app for a small bakery business, live for two months under a support retainer. The client asked for Hindi and Marathi language support. You sent a change request: 48 hours at the standard rate card (translation workflow, RTL-safe layouts checked, admin text management, QA). The client was not expecting a cost this high.",
    opening:
      "Hi, I got your change request thing. 48 hours?! It's just translating some words. My nephew says Google can do that for free. I'm a bit upset, honestly.",
    objective:
      "Stay calm and kind, explain in plain words what the hours cover, hold the rate card, and offer options (a smaller first phase, one language first, the client supplying translations) rather than a straight discount.",
    clientAsk: "A much lower price for the language support.",
    hiddenConcern: "She mostly needs the menu and the checkout in Hindi before a festival in five weeks; the rest can wait.",
    termIds: ["change-request", "estimate", "rate-card", "phase-2", "mvp", "nice-to-have", "retainer"],
    defaultPersonaId: "small-business-owner",
    scripted: [
      "But why so many hours? What are they actually doing all that time?",
      "I don't understand half of that, sorry. Can you say it simply?",
      "Is there any way to make it cheaper? I really can't spend that much right now.",
      "Oh. Doing just the menu first could work... what would that cost?",
      "OK. Can you send me that in an email so I can show my husband?",
      "Thank you, that's much clearer.",
      "Alright, bye for now.",
    ],
    selfCheck: [
      "Did you acknowledge her surprise before defending the number?",
      "Did you explain the hours in plain words, without jargon?",
      "Did you keep the rate card instead of discounting the same scope?",
      "Did you offer real options (phase it, one language first, she supplies translations)?",
      "Did you ask what she needs first and by when?",
      "Did you agree a clear next step (a revised CR, a date)?",
    ],
  },
  {
    id: "bug-or-cr",
    title: "This is a bug, not a CR",
    summary: "The client insists a missing feature is a bug you must fix for free.",
    context:
      "An appointment-booking app for a chain of fitness studios, in its 30-day warranty after go-live. The signed requirements and acceptance criteria cover email booking confirmations. The client now says SMS reminders 24 hours before a class are missing and calls it a bug. SMS was never in the requirements or the sign-off.",
    opening:
      "Members are missing classes because they get no SMS reminder. That's a bug and you're in warranty, so I expect it fixed this week at no cost. Any decent app sends reminders.",
    objective:
      "Stay respectful, check the signed scope and acceptance criteria with the client, explain the difference between a bug and an enhancement with evidence, classify this as a change request, and offer a fast, fair path.",
    clientAsk: "SMS reminders this week, free, under warranty.",
    hiddenConcern: "No-shows are costing real money and his studio managers are blaming the app in front of him.",
    termIds: ["bug", "enhancement", "change-request", "acceptance-criteria", "sign-off", "warranty", "requirement-freeze", "clarification"],
    defaultPersonaId: "startup-founder",
    scripted: [
      "Every booking app has reminders. Why would I have written that down?",
      "So you're saying it's my fault for not asking? That's not great.",
      "Fine, what is the actual difference between a bug and whatever you're calling this?",
      "OK. How fast could you do it if we went the CR route? People are missing classes now.",
      "Send me the CR today then. If it's quick I'll approve it.",
      "Fair enough. Thanks for explaining.",
      "Right, speak soon.",
    ],
    selfCheck: [
      "Did you show you understand the business problem (missed classes) before the process?",
      "Did you refer to the signed requirements / acceptance criteria as the evidence?",
      "Did you explain bug vs enhancement simply, without blaming the client?",
      "Did you avoid conceding a free fix while staying respectful?",
      "Did you offer a fast path (a quick CR, an interim workaround like the email reminder)?",
      "Did you agree a next step with a time?",
    ],
  },
  {
    id: "missing-store-account",
    title: "The store account is missing",
    summary: "A white-label launch is blocked: the end client has no Apple developer account.",
    context:
      "A white-label fitness-booking app, rebranded for the reseller's end client (a gym chain). Builds are ready and QA passed. Submission is blocked because the end client has not created its Apple Developer account or its Google Play Console, which must be client-owned. The reseller wants you to publish under your agency's account to save time.",
    opening:
      "Builds are done, great. My client still hasn't sorted the Apple account thing. Just publish it under your account for now and we'll move it later. We need to be live next week.",
    objective:
      "Explain why the store accounts must be owned by the end client (ownership, the bundle id, painful transfers, legal name on the listing), give the exact steps and realistic timelines, say what is blocked, and agree who does what by when.",
    clientAsk: "Publish under the agency's developer account now and transfer later.",
    hiddenConcern: "She promised her client a go-live date and a feature that is not in the core product.",
    termIds: ["client-owned-accounts", "apple-developer-account", "google-play-console", "bundle-id", "white-label", "client-dependency", "store-listing-assets", "privacy-policy-url"],
    defaultPersonaId: "whitelabel-reseller",
    scripted: [
      "Other vendors just do it. Why is this such a big deal?",
      "How long does the Apple account take, honestly? My client is not technical.",
      "What exactly do you need from them? Give me a list.",
      "If they start today, when could we realistically be live?",
      "OK, send me the checklist and I'll forward it. Can you join a call with them?",
      "Fine. That's clearer than I expected.",
      "Talk tomorrow.",
    ],
    selfCheck: [
      "Did you refuse to publish under the agency's account, and say why (ownership, transfer pain)?",
      "Did you explain it in terms the reseller can repeat to her client?",
      "Did you list exactly what the end client must do (accounts, D-U-N-S/legal name, store assets, privacy policy URL)?",
      "Did you give realistic timelines, including review time?",
      "Did you name what is blocked and what can continue meanwhile?",
      "Did you agree owners and dates for the next steps?",
    ],
  },
  {
    id: "uat-rejection",
    title: "The client rejected UAT",
    summary: "The client rejects the UAT build with a list of fourteen issues.",
    context:
      "A field-service scheduling web app for a facilities company. UAT ran for a week. The client sent a rejection with 14 items: 3 are real defects (one blocks invoicing), 6 are cosmetic, and 5 are new requests that were never in the acceptance criteria. Go-live is planned in two weeks.",
    opening:
      "We have completed UAT and I am afraid we cannot sign off. Fourteen issues are listed in the attached sheet. Frankly, this is not the quality we expected at this stage.",
    objective:
      "Take the feedback seriously, triage the list with the client (defects by severity, cosmetic items, new requests as change requests), agree the sign-off criteria and the fix and retest plan, and protect the go-live date where possible.",
    clientAsk: "All fourteen items fixed before sign-off.",
    hiddenConcern: "Only the invoicing blocker really worries him; the list was padded by a colleague who wants the vendor to look bad.",
    termIds: ["uat", "severity", "priority", "bug", "change-request", "acceptance-criteria", "sign-off", "known-issues", "go-live", "regression-test"],
    defaultPersonaId: "enterprise-stakeholder",
    scripted: [
      "I would like all fourteen addressed. Why should we accept anything less?",
      "Which of these do you consider defects, then? Please be specific.",
      "And the items you call new requests, what happens to those?",
      "What does this do to the go-live date?",
      "Please send the triaged list and the plan in writing by tomorrow.",
      "That is reasonable. Thank you.",
      "Very well.",
    ],
    selfCheck: [
      "Did you thank them and take the quality concern seriously, without being defensive?",
      "Did you propose triaging the list together rather than accepting or rejecting it whole?",
      "Did you separate defects (by severity) from cosmetic items and new requests (CRs)?",
      "Did you ask which item worries them most?",
      "Did you agree sign-off criteria (e.g. no open critical/high defects, known issues listed)?",
      "Did you give a fix-and-retest plan with dates and the effect on go-live?",
    ],
  },
];

export const ROLEPLAY_PERSONA_IDS = /* @__PURE__ */ ROLEPLAY_PERSONAS.map((p) => p.id);
export const ROLEPLAY_SCENARIO_IDS = /* @__PURE__ */ ROLEPLAY_SCENARIOS.map((s) => s.id);

export function findPersona(id: string): RoleplayPersona | undefined {
  return ROLEPLAY_PERSONAS.find((p) => p.id === id);
}

export function findScenario(id: string): RoleplayScenario | undefined {
  return ROLEPLAY_SCENARIOS.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// The standard rubric
// ---------------------------------------------------------------------------

export interface RoleplayRubricDimension {
  id: string;
  label: string;
  points: number;
  /** What full marks looks like. For the grader. */
  description: string;
}

export const ROLEPLAY_RUBRIC: readonly RoleplayRubricDimension[] = [
  { id: "clarity", label: "Clarity", points: 2, description: "Short, plain messages; the main point comes first; no jargon the client would not know." },
  {
    id: "process",
    label: "Correct use of process and terms",
    points: 3,
    description: "Names the right process (change request, warranty, UAT triage, client-owned accounts) and uses agency terms correctly, explained where needed.",
  },
  { id: "empathy", label: "Empathy", points: 2, description: "Acknowledges the client's situation and feelings; asks about the underlying need before defending a position." },
  {
    id: "scope",
    label: "A firm and fair scope position",
    points: 3,
    description: "Holds the signed scope and the rate card without conceding work for free, while offering fair options (phase it, trade off, a CR).",
  },
  { id: "next-step", label: "A clear next step", points: 2, description: "Ends with a concrete next step: who does what, by when." },
  {
    id: "follow-up",
    label: "The follow-up email",
    points: 3,
    description: "A short email that confirms what was agreed, the decision or options, the owners and dates, in a professional tone.",
  },
];

/** The rubric as a task carries it (labels and points). */
export function standardRubric(followUp: boolean): { label: string; points: number; description: string }[] {
  return ROLEPLAY_RUBRIC.filter((d) => followUp || d.id !== "follow-up").map(({ label, points, description }) => ({ label, points, description }));
}

/** Whether a rubric line is about the follow-up email (scored 0 when no email was written). */
export function isFollowUpDimension(label: string): boolean {
  return /follow[- ]?up/i.test(label);
}

// ---------------------------------------------------------------------------
// The wire
// ---------------------------------------------------------------------------

export type RoleplayContext = "practice" | "assessment";
export type RoleplayStatus = "active" | "finished" | "scored";
/** `ai`: a model plays the client. `scripted`: no AI is configured, so a scripted client does. */
export type RoleplayMode = "ai" | "scripted";

export interface RoleplayLine {
  role: "pm" | "client";
  text: string;
}

export interface RoleplayDimensionScore {
  label: string;
  points: number;
  score: number;
  /** A short quote from the learner's own messages or email; empty when there was nothing to quote. */
  evidence: string;
}

export interface RoleplayScore {
  dimensions: RoleplayDimensionScore[];
  total: number;
  max: number;
  /** 0..1 */
  pct: number;
  tips: string[];
  /** v4.4: the scorer's met / not-yet verdict, one-line reason and tip (absent on older scores). */
  met?: boolean;
  reason?: string;
  tip?: string;
}

export type PublicPersona = Omit<RoleplayPersona, "hiddenConcern">;
export type PublicScenario = Omit<RoleplayScenario, "hiddenConcern" | "scripted">;

export function publicPersona(p: RoleplayPersona): PublicPersona {
  const { hiddenConcern: _hidden, ...rest } = p;
  void _hidden;
  return rest;
}

export function publicScenario(s: RoleplayScenario): PublicScenario {
  const { hiddenConcern: _hidden, scripted: _scripted, ...rest } = s;
  void _hidden;
  void _scripted;
  return rest;
}

export interface RoleplayCatalog {
  personas: PublicPersona[];
  scenarios: PublicScenario[];
  rubric: { label: string; points: number; description: string }[];
  /** False when no AI is configured: sessions run with the scripted client. */
  aiAvailable: boolean;
  /** False when this month's role-play spend reached the cap (practice sessions are refused). */
  withinCap: boolean;
}

export interface RoleplaySessionView {
  id: string;
  scenarioId: string;
  personaId: string;
  context: RoleplayContext;
  assessmentId: string | null;
  itemId: string | null;
  mode: RoleplayMode;
  status: RoleplayStatus;
  transcript: RoleplayLine[];
  /** PM messages so far. */
  turns: number;
  maxTurns: number;
  followUpEmail: string | null;
  /** Practice: set once scored. Assessment: never sent to the learner. */
  score: RoleplayScore | null;
  /** Scripted mode: what to check yourself against, since there is no score. */
  selfCheck: string[];
  persona: PublicPersona;
  scenario: PublicScenario;
  createdAt: number;
  finishedAt: number | null;
  /** Practice: the conversation finished but scoring failed; Finish can be pressed again. */
  scoreError?: string;
}

export const startRoleplaySchema = z
  .object({
    scenarioId: z.string().min(1).max(60),
    personaId: z.string().min(1).max(60).optional(),
    maxTurns: z.number().int().min(ROLEPLAY_MIN_TURNS).max(ROLEPLAY_MAX_TURNS).optional(),
    context: z.enum(["practice", "assessment"]).default("practice"),
    assessmentId: z.string().min(1).max(64).optional(),
    itemId: z.string().min(1).max(64).optional(),
  })
  .refine((v) => v.context === "practice" || (v.assessmentId && v.itemId), { message: "An assessment session needs its assessment and item." });
export type StartRoleplayRequest = z.infer<typeof startRoleplaySchema>;

export const roleplayTurnSchema = z.object({ message: z.string().trim().min(1).max(ROLEPLAY_MESSAGE_MAX) });
export const finishRoleplaySchema = z.object({ followUpEmail: z.string().trim().max(ROLEPLAY_EMAIL_MAX).optional() });

export interface RoleplayUsage {
  monthStart: number;
  sessions: number;
  scored: number;
  costUsd: number;
  avgCostUsd: number;
  capUsd: number;
  /** 0..1+ */
  share: number;
  overCap: boolean;
}

export const roleplayCapSchema = z.object({ capUsd: z.number().min(0).max(10_000) });
