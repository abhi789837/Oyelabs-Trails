import type { ModuleDocInput, ModuleVideoInput, NotesDoc, OyelabsCourseView, OyelabsDraftData, OyelabsLevel } from "@shared/oyelabsCourses";

/**
 * v4.5 Phase 1: the Oyelabs editor's state, as pure functions so they are tested without a browser.
 *
 * The page holds one `OyelabsDraftData` (the same loose shape the autosave stores). Every change
 * goes through `applyEdit`, which never mutates. Modules carry a `key` (their id once saved, a
 * random key before) for React lists and drag and drop.
 */

export type EditorModule = OyelabsDraftData["modules"][number];

export type EditorEdit =
  | { type: "title"; value: string }
  | { type: "description"; value: string }
  | { type: "level"; value: OyelabsLevel }
  | { type: "toggleDepartment"; id: string }
  | { type: "allDepartments" }
  | { type: "addSkill"; id: string }
  | { type: "removeSkill"; id: string }
  | { type: "addModule"; key: string }
  | { type: "removeModule"; key: string }
  | { type: "moveModule"; from: number; to: number }
  | { type: "moduleTitle"; key: string; value: string }
  | { type: "moduleVideos"; key: string; value: ModuleVideoInput[] }
  | { type: "moduleDocs"; key: string; value: ModuleDocInput[] }
  | { type: "moduleNotes"; key: string; value: NotesDoc | null };

export const MAX_MODULES = 30;
export const MAX_SKILLS = 20;

export function emptyModule(key: string): EditorModule {
  return { key, title: "", videos: [], docs: [], notes: null };
}

/** A new course starts with one empty module, so the page shows what to fill in. */
export function emptyDraft(key: string): OyelabsDraftData {
  return { title: "", description: "", level: null, departmentIds: [], skillIds: [], modules: [emptyModule(key)] };
}

export function moduleKey(m: EditorModule, index: number): string {
  return m.key ?? m.id ?? `m${index}`;
}

/** Every module has a key (drafts written before keys existed get their id or position). */
export function withKeys(data: OyelabsDraftData): OyelabsDraftData {
  return { ...data, modules: data.modules.map((m, i) => (m.key ? m : { ...m, key: moduleKey(m, i) })) };
}

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function applyEdit(state: OyelabsDraftData, edit: EditorEdit): OyelabsDraftData {
  const mapModule = (key: string, fn: (m: EditorModule) => EditorModule) => ({
    ...state,
    modules: state.modules.map((m, i) => (moduleKey(m, i) === key ? fn(m) : m)),
  });
  switch (edit.type) {
    case "title":
      return { ...state, title: edit.value.slice(0, 120) };
    case "description":
      return { ...state, description: edit.value.slice(0, 400) };
    case "level":
      return { ...state, level: edit.value };
    case "toggleDepartment": {
      const has = state.departmentIds.includes(edit.id);
      return { ...state, departmentIds: has ? state.departmentIds.filter((d) => d !== edit.id) : [...state.departmentIds, edit.id] };
    }
    case "allDepartments":
      return { ...state, departmentIds: [] };
    case "addSkill":
      if (state.skillIds.includes(edit.id) || state.skillIds.length >= MAX_SKILLS) return state;
      return { ...state, skillIds: [...state.skillIds, edit.id] };
    case "removeSkill":
      return { ...state, skillIds: state.skillIds.filter((s) => s !== edit.id) };
    case "addModule":
      if (state.modules.length >= MAX_MODULES) return state;
      return { ...state, modules: [...state.modules, emptyModule(edit.key)] };
    case "removeModule":
      return { ...state, modules: state.modules.filter((m, i) => moduleKey(m, i) !== edit.key) };
    case "moveModule":
      return { ...state, modules: moveItem(state.modules, edit.from, edit.to) };
    case "moduleTitle":
      return mapModule(edit.key, (m) => ({ ...m, title: edit.value.slice(0, 120) }));
    case "moduleVideos":
      return mapModule(edit.key, (m) => ({ ...m, videos: edit.value.slice(0, 40) }));
    case "moduleDocs":
      return mapModule(edit.key, (m) => ({ ...m, docs: edit.value.slice(0, 40) }));
    case "moduleNotes":
      return mapModule(edit.key, (m) => ({ ...m, notes: edit.value }));
  }
}

/** Compared on content only: keys are page bookkeeping, not something the admin changed. */
export function comparableDraft(data: OyelabsDraftData): string {
  return JSON.stringify({ ...data, modules: data.modules.map(({ key: _key, ...m }) => m) });
}

export function isDirty(current: OyelabsDraftData, baseline: OyelabsDraftData | null): boolean {
  if (!baseline) return true;
  return comparableDraft(current) !== comparableDraft(baseline);
}

/** "You have unsaved changes from 10:42": an autosave newer than the saved course. */
export function newerDraftOf(view: Pick<OyelabsCourseView, "draft" | "updatedAt">): { id: string; updatedAt: number } | null {
  return view.draft && view.draft.updatedAt > view.updatedAt ? view.draft : null;
}

/** Removing a saved module removes its lesson and the progress on it. Only those need a warning. */
export function removalNeedsConfirm(m: EditorModule): boolean {
  return Boolean(m.id);
}

/** The autosave line in the footer. */
export function autosaveLine(state: { saving: boolean; failed: boolean; savedAt: number | null; dirty: boolean }, time: (ts: number) => string): string {
  if (state.failed) return "We couldn't keep your last change. We'll try again in a moment.";
  if (state.saving) return "Saving…";
  if (state.savedAt) return `Saved ${time(state.savedAt)}`;
  return state.dirty ? "Not saved yet" : "No changes yet";
}
