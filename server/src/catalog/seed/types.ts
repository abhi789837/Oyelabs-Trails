export type DepartmentId = string; // "engineering" | "pm" | "bd" for the seed
export type SkillLevelBand = "beginner" | "intermediate" | "advanced" | "expert";
export type AssessmentFormat = "coding" | "tasks";
export type SandboxLanguage = "javascript" | "typescript" | "python" | "php" | "sql" | "java" | "dart" | "html";

export interface SeedDepartment {
  id: string;
  name: string;
  slug: string;
  icon: string; // lucide icon name
  colour: string; // hex
  assessmentFormat: AssessmentFormat;
  position: number;
  practiceNoun: string; // "Code" | "Task workspace"
  /**
   * v4.4: "area" = never a learner's own department, but its skills are usable by learners in every
   * department (the soft-skills area). Omitted = "role".
   */
  kind?: "role" | "area";
}

export interface SeedTrack {
  id: string;
  departmentId: string;
  name: string;
  description: string;
  position: number;
}

export interface SeedStack {
  id: string;
  departmentId: string;
  name: string;
  kind: "stack" | "tool";
  language?: SandboxLanguage;
  aliases: string[];
  position: number;
}

export interface SeedSkill {
  id: string; // kebab-case, globally unique, prefixed: "eng-", "pm-", "bd-"
  departmentId: string;
  name: string;
  area: string;
  aliases: string[];
  tags: string[];
  levelMin: SkillLevelBand;
  levelMax: SkillLevelBand;
  trackIds: string[];
  prerequisites: string[];
  stackIds: string[]; // [] = stack-agnostic
  language?: SandboxLanguage;
  contentModules: string[];
  isAiSkill?: boolean;
  /** v4.1: slider the Setup screen pre-selects for a new learner in this department (1-5). */
  defaultSlider?: 1 | 2 | 3 | 4 | 5;
}
