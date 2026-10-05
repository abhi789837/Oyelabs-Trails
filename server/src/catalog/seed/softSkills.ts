import type { SeedDepartment, SeedSkill, SeedTrack } from "./types";

/**
 * v4.4: the Soft skills area. An *area* department (`kind: "area"`): nobody is hired into it, so it
 * never appears as a learner's own department, but its skills are usable by learners in every
 * department (`skillUsableBy` in shared/catalog.ts) — as goals, in the test, on the path and as
 * courses.
 *
 * The ten skill ids are fixed by docs/v4.4/PLAN.md. Areas are plain words. No skill has a default
 * slider: soft skills arrive through goals ("improve the soft skills" → bundle `soft-skills-*`),
 * not as a pre-ticked priority on Setup.
 *
 * Levels follow behaviour, not years (Engineering Ladders: learns, applies, coaches, shapes), so
 * every skill spans beginner → expert. Spoken English maps target levels to English levels in
 * shared/softSkills.ts (`englishLevelFor`).
 *
 * Each skill's course is one camp on the `soft` content trail (src/content/soft/soft-*.ts).
 */
export const SOFT_DEPARTMENT: SeedDepartment = {
  id: "soft",
  name: "Soft skills",
  slug: "soft",
  icon: "MessagesSquare",
  colour: "#9333EA",
  assessmentFormat: "tasks",
  position: 3,
  practiceNoun: "Task workspace",
  kind: "area",
};

const D = "soft";

/**
 * The catalog requires every skill to sit on at least one track of its own department. The area has
 * a single track, "Every role"; it is never offered in a picker because the department itself is not.
 */
export const SOFT_TRACKS: SeedTrack[] = [
  { id: "soft-every-role", departmentId: D, name: "Every role", description: "Communication and working-together skills every engineer, PM and BD person uses daily.", position: 0 },
];

const ALL = ["soft-every-role"];
const base: Pick<SeedSkill, "departmentId" | "levelMin" | "levelMax" | "trackIds" | "stackIds" | "isAiSkill"> = { departmentId: D, levelMin: "beginner", levelMax: "expert", trackIds: ALL, stackIds: [], isAiSkill: false };

export const SOFT_SKILLS: SeedSkill[] = [
  {
    ...base,
    id: "ss-spoken-english",
    name: "Spoken English at work",
    area: "Speaking",
    aliases: ["english", "spoken english", "speaking english", "english speaking", "fluency", "english fluency", "business english", "speaking skills", "verbal communication"],
    tags: ["english", "speaking", "communication"],
    prerequisites: [],
    contentModules: ["soft-spoken-english"],
  },
  {
    ...base,
    id: "ss-workplace-writing",
    name: "Workplace writing (email, chat, docs)",
    area: "Writing",
    aliases: ["email writing", "business writing", "written communication", "writing emails", "slack messages", "chat etiquette", "documentation writing", "plain language"],
    tags: ["writing", "email", "communication"],
    prerequisites: [],
    contentModules: ["soft-workplace-writing"],
  },
  {
    ...base,
    id: "ss-explain-simply",
    name: "Explaining technical work simply",
    area: "Speaking",
    aliases: ["explain to non-technical", "explaining technical concepts", "explain simply", "non-technical audience", "jargon-free", "explain to a client"],
    tags: ["explaining", "communication", "client"],
    prerequisites: [],
    contentModules: ["soft-explain-simply"],
  },
  {
    ...base,
    id: "ss-standup-updates",
    name: "Stand-ups and status updates",
    area: "Speaking",
    aliases: ["standup", "stand-up", "daily standup", "daily scrum", "status update", "progress update", "status updates"],
    tags: ["standup", "status", "communication"],
    prerequisites: ["ss-spoken-english"],
    contentModules: ["soft-standup-updates"],
  },
  {
    ...base,
    id: "ss-client-team-communication",
    name: "Client and team communication",
    area: "Working with people",
    aliases: ["communication", "communication skills", "client communication", "team communication", "difficult conversations", "stakeholder communication", "client calls"],
    tags: ["communication", "client", "team"],
    prerequisites: ["ss-spoken-english"],
    contentModules: ["soft-client-team-communication"],
  },
  {
    ...base,
    id: "ss-listening-questions",
    name: "Listening and asking good questions",
    area: "Working with people",
    aliases: ["listening", "active listening", "asking questions", "clarifying questions", "requirement questions", "follow-up questions"],
    tags: ["listening", "questions", "communication"],
    prerequisites: [],
    contentModules: ["soft-listening-questions"],
  },
  {
    ...base,
    id: "ss-presenting-demoing",
    name: "Presenting and demoing",
    area: "Speaking",
    aliases: ["presenting", "presentation skills", "public speaking", "demo", "demoing", "sprint demo", "sprint review", "showcase"],
    tags: ["presenting", "demo", "speaking"],
    prerequisites: ["ss-spoken-english"],
    contentModules: ["soft-presenting-demoing"],
  },
  {
    ...base,
    id: "ss-ownership-time",
    name: "Ownership and time management",
    area: "Ownership",
    aliases: ["ownership", "accountability", "time management", "prioritisation", "prioritization", "deadlines", "dependability", "reliability"],
    tags: ["ownership", "time", "planning"],
    prerequisites: [],
    contentModules: ["soft-ownership-time"],
  },
  {
    ...base,
    id: "ss-feedback",
    name: "Giving and receiving feedback",
    area: "Working with people",
    aliases: ["feedback", "giving feedback", "receiving feedback", "sbi", "constructive feedback", "pr review comments", "code review feedback"],
    tags: ["feedback", "communication", "team"],
    prerequisites: [],
    contentModules: ["soft-feedback"],
  },
  {
    ...base,
    id: "ss-teamwork",
    name: "Teamwork and collaboration",
    area: "Working with people",
    aliases: ["teamwork", "collaboration", "team player", "psychological safety", "working agreements", "people skills", "interpersonal skills"],
    tags: ["teamwork", "collaboration", "team"],
    prerequisites: [],
    contentModules: ["soft-teamwork"],
  },
];
