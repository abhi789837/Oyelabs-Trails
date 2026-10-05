import { BD_DEPARTMENT, BD_SKILLS, BD_STACKS, BD_TRACKS } from "./bd";
import { BD_PROCESS_SKILLS } from "./bdProcess";
import { ENGINEERING_DEPARTMENT, ENGINEERING_SKILLS, ENGINEERING_STACKS, ENGINEERING_TRACKS } from "./engineering";
import { PM_DEPARTMENT, PM_SKILLS, PM_STACKS, PM_TRACKS } from "./pm";
import { PM_AGENCY_SKILLS } from "./pmAgency";
import { PM_PROCESS_SKILLS } from "./pmProcess";
import { SOFT_DEPARTMENT, SOFT_SKILLS, SOFT_TRACKS } from "./softSkills";
import type { SeedDepartment, SeedSkill, SeedStack, SeedTrack } from "./types";

export type * from "./types";

export const SEED_DEPARTMENTS: SeedDepartment[] = [ENGINEERING_DEPARTMENT, PM_DEPARTMENT, BD_DEPARTMENT, SOFT_DEPARTMENT];
export const SEED_TRACKS: SeedTrack[] = [...ENGINEERING_TRACKS, ...PM_TRACKS, ...BD_TRACKS, ...SOFT_TRACKS];
export const SEED_STACKS: SeedStack[] = [...ENGINEERING_STACKS, ...PM_STACKS, ...BD_STACKS];
// Agency PM skills come before the generic PM theory, so the picker and the defaults lead with them.
export const SEED_SKILLS: SeedSkill[] = [...ENGINEERING_SKILLS, ...PM_PROCESS_SKILLS, ...PM_AGENCY_SKILLS, ...PM_SKILLS, ...BD_SKILLS, ...BD_PROCESS_SKILLS, ...SOFT_SKILLS];
// v4.4: the Soft skills area (`kind: "area"`) has no stacks; its skills are usable by every department.
