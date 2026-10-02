import type { SeedSkill } from "./types";

/**
 * v4.2: the Agency PM Processes Academy — five courses, each a skill whose content is a set of
 * `pmp-*` camps on the PM trail. Processes come first for every PM: these four are Critical by
 * default and the templates course is High (the admin can move every slider).
 */
const D = "pm";
const ALL = ["pm-agile", "pm-technical", "pm-program"];
const range = (letter: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `pmp-${letter}${String(from + i).padStart(2, "0")}`);

export const PM_PROCESS_SKILLS: SeedSkill[] = [
  { id: "pm-proc-custom", departmentId: D, name: "Custom project lifecycle", area: "Oyelabs processes", aliases: ["project lifecycle", "bd handover", "kickoff", "discovery", "sprint 0", "uat", "go-live", "hypercare", "handover", "closure", "sow"], tags: ["process", "lifecycle", "custom"], levelMin: "beginner", levelMax: "expert", trackIds: ALL, prerequisites: [], stackIds: [], contentModules: range("a", 0, 15), defaultSlider: 5 },
  { id: "pm-proc-whitelabel", departmentId: D, name: "White-label project lifecycle", area: "Oyelabs processes", aliases: ["white-label", "white label", "rebranding", "gap analysis", "brand kit", "client accounts", "store submission", "app review", "core upgrade", "reseller"], tags: ["process", "lifecycle", "whitelabel"], levelMin: "beginner", levelMax: "expert", trackIds: ALL, prerequisites: [], stackIds: [], contentModules: range("b", 1, 12), defaultSlider: 5 },
  { id: "pm-proc-terms", departmentId: D, name: "Project terminology mastery", area: "Oyelabs processes", aliases: ["terminology", "cr vs enhancement", "change request", "enhancement", "bug", "warranty", "amc", "severity vs priority", "glossary"], tags: ["process", "terminology"], levelMin: "beginner", levelMax: "advanced", trackIds: ALL, prerequisites: [], stackIds: [], contentModules: range("c", 1, 8), defaultSlider: 5 },
  { id: "pm-proc-meetings", departmentId: D, name: "Handling every client meeting", area: "Oyelabs processes", aliases: ["client meetings", "kickoff meeting", "weekly status", "sprint demo", "cr negotiation", "bad news", "escalation", "uat walkthrough", "go/no-go", "qbr"], tags: ["process", "meetings", "client"], levelMin: "beginner", levelMax: "expert", trackIds: ALL, prerequisites: [], stackIds: [], contentModules: range("d", 1, 5), defaultSlider: 5 },
  { id: "pm-proc-templates", departmentId: D, name: "Process templates in practice", area: "Oyelabs processes", aliases: ["templates", "cr form", "mom", "status report", "raid log", "uat sign-off", "go-live checklist", "handover checklist", "closure report"], tags: ["process", "templates"], levelMin: "beginner", levelMax: "advanced", trackIds: ALL, prerequisites: [], stackIds: [], contentModules: range("e", 1, 3), defaultSlider: 4 },
];

/** v4.2 changes to v4.1 agency defaults: [skill id, v4.1 default, v4.2 default]. */
export const PM_DEFAULT_SLIDER_CHANGES: [string, number, number][] = [
  ["pm-client-management", 5, 4],
  ["pm-client-meetings", 5, 3],
  ["pm-email-etiquette", 5, 3],
];
/** AI for PMs had no default in v4.1; v4.2 makes it Medium. */
export const PM_NEW_DEFAULTS: [string, number][] = [["pm-ai-for-pms", 3]];
