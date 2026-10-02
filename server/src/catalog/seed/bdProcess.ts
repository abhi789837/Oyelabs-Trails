import type { SeedSkill } from "./types";

/**
 * v4.2: optional BD courses built from the PM process academy. BD sells white-label projects and
 * writes the SOWs delivery then runs, so the white-label lifecycle and the project terminology
 * camps (`pmp-b*`, `pmp-c*` on the PM trail) are offered to BD too. No default slider: an admin
 * adds them to a BD learner's plan when they are wanted.
 */
const D = "bd";
const ALL = ["bd-agency", "bd-outbound", "bd-account"];
const range = (letter: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `pmp-${letter}${String(from + i).padStart(2, "0")}`);

export const BD_PROCESS_SKILLS: SeedSkill[] = [
  { id: "bd-proc-whitelabel", departmentId: D, name: "White-label projects (for BD)", area: "Delivery language for BD", aliases: ["white-label lifecycle", "white label delivery", "gap analysis", "brand kit", "client-owned accounts", "store submission", "core upgrade"], tags: ["process", "whitelabel", "delivery"], levelMin: "beginner", levelMax: "expert", trackIds: ALL, prerequisites: [], stackIds: [], contentModules: range("b", 1, 12) },
  { id: "bd-proc-terms", departmentId: D, name: "Project terminology (for BD)", area: "Delivery language for BD", aliases: ["project terminology", "cr vs enhancement", "change request", "sow", "warranty", "amc", "msa", "glossary"], tags: ["process", "terminology", "delivery"], levelMin: "beginner", levelMax: "advanced", trackIds: ALL, prerequisites: [], stackIds: [], contentModules: range("c", 1, 8) },
];
