import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";

import type { SkillBundle } from "@shared/bundles";
import { TARGET_LEVEL_LABELS } from "@shared/goals";

import { ApiRequestError } from "@/api/client";
import { FormAlert, TextField } from "@/components/form/Field";
import { useConfirm } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { useCatalog } from "../catalog/useCatalog";
import { SkillPicker } from "../setup/SkillPicker";
import { groupsApi } from "./api";
import { draftFrom, draftProblem, emptyDraft, groupSkills, scopeLine, toInput, withDepartment, type GroupDraft } from "./helpers";

const selectClass = "h-10 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong";
const message = (err: unknown, fallback: string) => (err instanceof ApiRequestError ? err.message : fallback);

/**
 * v4.4 skill groups: what a broad phrase in a description stands for. "Move to the full stack" for
 * a frontend developer means the backend skills; "improve the soft skills" means the ten soft
 * skills. Suggest uses these when it reads a description; editing one changes what the next
 * Suggest picks, not anyone already set up.
 */
export default function AdminSkillGroupsPage() {
  useDocumentTitle("Skill groups");
  const confirm = useConfirm();
  const { catalog, error: catalogError } = useCatalog();
  const [groups, setGroups] = useState<SkillBundle[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<GroupDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setGroups((await groupsApi.list(signal)).bundles);
      setLoadError(null);
    } catch (err) {
      if (!signal?.aborted) setLoadError(message(err, "Could not load the skill groups."));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const departments = useMemo(() => (catalog?.departments ?? []).filter((d) => !d.archived && d.kind !== "area"), [catalog]);
  const skillName = useMemo(() => new Map((catalog?.skills ?? []).map((s) => [s.id, s.name])), [catalog]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const problem = draftProblem(draft);
    if (problem) {
      setFormError(problem);
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const res = draft.id ? await groupsApi.update(draft.id, toInput(draft)) : await groupsApi.create(toInput(draft));
      setGroups(res.bundles);
      notify.success(`Saved "${res.bundle.name}".`);
      setDraft(null);
    } catch (err) {
      setFormError(message(err, "That didn't save. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (group: SkillBundle) => {
    const ok = await confirm({
      title: `Delete "${group.name}"?`,
      body: "Suggest stops using it for new descriptions. People already set up keep their goals.",
      confirmLabel: "Delete group",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setGroups((await groupsApi.remove(group.id)).bundles);
      if (draft?.id === group.id) setDraft(null);
    } catch (err) {
      notify.error(message(err, "Could not delete that group."));
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold">Skill groups</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          When a description says a few words like &ldquo;move to the full stack&rdquo; or &ldquo;improve the soft skills&rdquo;, Suggest uses the group with those words and gives the
          person all of its skills.
        </p>
      </header>

      {(loadError || catalogError) && <FormAlert>{loadError ?? catalogError}</FormAlert>}

      {!draft && (
        <Button type="button" onClick={() => setDraft(emptyDraft(departments[0]?.id ?? null))}>
          <Plus aria-hidden="true" />
          New skill group
        </Button>
      )}

      {draft && (
        <GroupEditor
          draft={draft}
          onChange={setDraft}
          departments={departments.map((d) => ({ id: d.id, name: d.name }))}
          catalog={catalog}
          busy={busy}
          error={formError}
          onSubmit={save}
          onCancel={() => {
            setDraft(null);
            setFormError(null);
          }}
        />
      )}

      {groups && groups.length === 0 && <p className="text-sm text-muted-foreground">No skill groups yet.</p>}
      {groups && groups.length > 0 && (
        <ul className="divide-y rounded-lg border bg-surface" aria-label="Skill groups">
          {groups.map((group) => (
            <li key={group.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">
                  {group.name}
                  {!group.active && <span className="ml-2 text-xs font-normal text-muted-foreground">(turned off)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{scopeLine(group, catalog)}</p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Words: </span>
                  {group.phrases.map((p) => `"${p}"`).join(", ")}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Skills: </span>
                  {group.skillIds.map((id) => skillName.get(id) ?? id).join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setDraft(draftFrom(group))}>
                  Edit
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => void remove(group)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GroupEditor({
  draft,
  onChange,
  departments,
  catalog,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  draft: GroupDraft;
  onChange: (draft: GroupDraft) => void;
  departments: { id: string; name: string }[];
  catalog: ReturnType<typeof useCatalog>["catalog"];
  busy: boolean;
  error: string | null;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const ids = { department: `${uid}-department`, level: `${uid}-level`, phrases: `${uid}-phrases`, roles: `${uid}-roles`, skills: `${uid}-skills` };
  const skills = useMemo(() => groupSkills(catalog, draft.departmentId), [catalog, draft.departmentId]);
  const name = (id: string) => catalog?.skills.find((s) => s.id === id)?.name ?? id;
  const tracks = (catalog?.tracks ?? []).filter((t) => !t.archived && t.departmentId === draft.departmentId);
  const set = (patch: Partial<GroupDraft>) => onChange({ ...draft, ...patch });

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-5 rounded-lg border bg-surface px-4 py-5 sm:px-5" aria-label={draft.id ? "Edit skill group" : "New skill group"}>
      {error && <FormAlert>{error}</FormAlert>}
      <TextField label="Name" required value={draft.name} disabled={busy} placeholder="Full-stack developer" onChange={(e) => set({ name: e.target.value })} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.department} className="mb-1.5 block text-sm font-medium">
            Department
          </label>
          <select id={ids.department} className={selectClass} value={draft.departmentId ?? ""} disabled={busy} onChange={(e) => onChange(withDepartment(draft, catalog, e.target.value || null))}>
            <option value="">Any department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={ids.level} className="mb-1.5 block text-sm font-medium">
            Level to reach
          </label>
          <select id={ids.level} className={selectClass} value={draft.targetLevel} disabled={busy} onChange={(e) => set({ targetLevel: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {TARGET_LEVEL_LABELS[n]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {draft.departmentId && tracks.length > 0 && (
        <fieldset>
          <legend id={ids.roles} className="mb-1.5 text-sm font-medium">
            Applies when their current role is
          </legend>
          <p className="mb-2 text-xs text-muted-foreground">Tick none to use it for every role.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {tracks.map((t) => (
              <label key={t.id} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[rgb(var(--primary))]"
                  checked={draft.fromTrackIds.includes(t.id)}
                  disabled={busy}
                  onChange={(e) => set({ fromTrackIds: e.target.checked ? [...draft.fromTrackIds, t.id] : draft.fromTrackIds.filter((id) => id !== t.id) })}
                />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor={ids.phrases} className="mb-1.5 block text-sm font-medium">
          Words that mean this group
        </label>
        <TagInput id={ids.phrases} value={draft.phrases} onChange={(phrases) => set({ phrases })} placeholder="full stack, full-stack" max={20} disabled={busy} />
        <p className="mt-1 text-xs text-muted-foreground">Whole words, any case. Press Enter after each one.</p>
      </div>

      <div>
        <p id={ids.skills} className="mb-1.5 text-sm font-medium">
          Skills ({draft.skillIds.length} of 12)
        </p>
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-labelledby={ids.skills}>
          {draft.skillIds.map((id) => (
            <li key={id}>
              <span className="inline-flex h-7 items-center gap-1 rounded-md border bg-surface-sunken/60 pl-2.5 pr-1 text-sm">
                {name(id)}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => set({ skillIds: draft.skillIds.filter((s) => s !== id) })}
                  className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong"
                >
                  <X className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">Remove {name(id)}</span>
                </button>
              </span>
            </li>
          ))}
        </ul>
        <SkillPicker
          skills={skills}
          track={null}
          selectedIds={draft.skillIds}
          otherIds={[]}
          otherLabel=""
          triggerLabel="Add a skill"
          disabled={busy || draft.skillIds.length >= 12}
          onPick={(skill) => !draft.skillIds.includes(skill.id) && draft.skillIds.length < 12 && set({ skillIds: [...draft.skillIds, skill.id] })}
          onRequest={() => notify.error("Add the skill on the Departments page first, then pick it here.")}
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-[rgb(var(--primary))]" checked={draft.active} disabled={busy} onChange={(e) => set({ active: e.target.checked })} />
        Turned on (Suggest uses it)
      </label>

      <div className="flex gap-3">
        <Button type="submit" loading={busy}>
          Save group
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
