import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Archive, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  LEVEL_BANDS,
  LEVEL_BAND_LABELS,
  SANDBOX_LANGUAGES,
  type Catalog,
  type Department,
  type JobTrack,
  type LevelBand,
  type Skill,
  type StackOption,
} from "@shared/catalog";

import { ApiRequestError } from "@/api/client";
import { Field, FormAlert, TextField } from "@/components/form/Field";
import { useFormDialog } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { catalogApi, type CatalogTable } from "./api";
import { filterSkills, groupByArea, levelBandLabel, moveId, splitList } from "./helpers";
import { InfoTip } from "./InfoTip";
import { useCatalog } from "./useCatalog";

const TABS = [
  { id: "tracks", label: "Tracks" },
  { id: "stacks", label: "Stacks & tools" },
  { id: "skills", label: "Skills" },
  { id: "requests", label: "Requests" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const selectClass = "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm";

/**
 * Departments and what each one is made of: job tracks, stacks and tools, and the skill catalog.
 *
 * One department at a time, picked at the top, because nobody edits Engineering's skills and BD's
 * in the same breath. Only the superadmin changes anything; every other staff member reads it and
 * can ask for a missing skill, which lands under Requests.
 */
export default function AdminDepartmentsPage() {
  useDocumentTitle("Departments");
  const me = useCurrentUser();
  const isSuperadmin = me.role === "superadmin";
  const { catalog, error: loadError, refresh } = useCatalog();
  const formDialog = useFormDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tabParam = searchParams.get("tab");
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "tracks";

  const departments = (catalog?.departments ?? []).filter((d) => isSuperadmin || !d.archived);
  const deptParam = searchParams.get("dept");
  // The skill-request notification links to `?tab=requests` without a department, so land on the
  // first department that actually has something waiting.
  const withRequests =
    tab === "requests"
      ? departments.find((d) => catalog?.skills.some((s) => s.departmentId === d.id && s.status === "pending"))
      : undefined;
  const department =
    departments.find((d) => d.id === deptParam) ??
    withRequests ??
    departments.find((d) => !d.archived) ??
    departments[0] ??
    null;

  const setParam = (key: string, value: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  /** Every mutation goes through here: one busy flag, one error line, and a catalog refresh after. */
  const act = async (work: () => Promise<unknown>, success?: string): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await work();
      await refresh();
      if (success) notify.success(success);
      return true;
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That didn't work.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const reorder = (table: CatalogTable, ids: readonly string[], index: number, delta: number) => {
    const next = moveId(ids, index, delta);
    if (next) void act(() => catalogApi.reorder(table, next));
  };

  const editDepartment = async (existing?: Department) => {
    const saved = await formDialog({
      title: existing ? `Edit ${existing.name}` : "Add department",
      submitLabel: existing ? "Save" : "Add",
      body: ({ pending }) => <DepartmentFields department={existing} pending={pending} />,
      onSubmit: async (data) => {
        const body = {
          name: String(data.get("name") ?? "").trim(),
          assessmentFormat: data.get("assessmentFormat") === "coding" ? ("coding" as const) : ("tasks" as const),
          practiceNoun: String(data.get("practiceNoun") ?? "").trim() || "Task workspace",
        };
        const result = existing
          ? await catalogApi.updateDepartment(existing.id, body)
          : await catalogApi.createDepartment(body);
        await refresh();
        return result.department;
      },
    });
    if (!saved) return;
    notify.success(existing ? `Saved ${saved.name}.` : `Added ${saved.name}.`);
    if (!existing) setParam("dept", saved.id);
  };

  /* Archiving is reversible and nothing is lost, so it acts at once and offers Undo (v4.3 P6). */
  const archiveDepartment = async (target: Department) => {
    if (target.archived) {
      await act(() => catalogApi.archiveDepartment(target.id, false), "Restored.");
      return;
    }
    if (await act(() => catalogApi.archiveDepartment(target.id, true))) notify.undo(`${target.name} archived.`, { onUndo: () => void act(() => catalogApi.archiveDepartment(target.id, false), "Restored.") });
  };

  const requestSkill = async () => {
    if (!department) return;
    const skill = await formDialog({
      title: "Request a skill",
      description: isSuperadmin
        ? `Adds it to ${department.name} straight away, under the "Requested" area.`
        : `Asks the superadmin to add it to ${department.name}. You can prioritise it for a learner before it is approved.`,
      submitLabel: isSuperadmin ? "Add" : "Request",
      body: ({ pending }) => (
        <TextField name="name" label="Skill" required autoFocus disabled={pending} maxLength={80} placeholder="GraphQL federation" />
      ),
      onSubmit: async (data) => {
        const result = await catalogApi.requestSkill(department.id, String(data.get("name") ?? "").trim());
        await refresh();
        return result.skill;
      },
    });
    if (skill) notify.success(skill.status === "pending" ? `Requested "${skill.name}".` : `Added "${skill.name}".`);
  };

  const pending = (catalog?.skills ?? []).filter((s) => s.departmentId === department?.id && s.status === "pending");

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Departments</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            The tracks, stacks and skills each department's learners are set up and assessed against.
            {!isSuperadmin && " Only the superadmin can change them."}
          </p>
        </div>
        {department && (
          <Button variant={isSuperadmin ? "outline" : "default"} onClick={() => void requestSkill()}>
            <Plus aria-hidden="true" />
            {isSuperadmin ? "Add a skill by name" : "Request a skill"}
          </Button>
        )}
      </div>

      {(error ?? loadError) && (
        <div className="mt-6">
          <FormAlert>{error ?? loadError}</FormAlert>
        </div>
      )}

      {catalog === null ? (
        !loadError && (
          <p className="mt-10 text-sm text-muted-foreground" role="status">
            Loading…
          </p>
        )
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Department" className="flex flex-wrap gap-1 rounded-md border p-1">
              {departments.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={d.id === department?.id}
                  onClick={() => setParam("dept", d.id)}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
                    d.id === department?.id ? "bg-surface-sunken font-medium" : "text-muted-foreground hover:bg-surface-sunken/60",
                    d.archived && "line-through decoration-muted-foreground/60",
                  )}
                >
                  {d.name}
                  {d.archived && <span className="sr-only"> (archived)</span>}
                </button>
              ))}
            </div>
            {isSuperadmin && (
              <Button variant="ghost" size="sm" onClick={() => void editDepartment()}>
                <Plus aria-hidden="true" />
                Add department
              </Button>
            )}
          </div>

          {department && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                <span>
                  Assessed with{" "}
                  <span className="font-medium text-foreground">
                    {department.assessmentFormat === "coding" ? "coding problems" : "work tasks"}
                  </span>
                  ; practice is called <span className="font-medium text-foreground">{department.practiceNoun}</span>.
                </span>
                {department.archived && <Badge variant="outline">archived</Badge>}
                {isSuperadmin && (
                  <span className="flex items-center gap-0.5">
                    <IconButton
                      label={`Move ${department.name} earlier`}
                      disabled={busy || departments[0]?.id === department.id}
                      onClick={() => reorder("departments", departments.map((d) => d.id), departments.indexOf(department), -1)}
                    >
                      <ChevronLeft aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label={`Move ${department.name} later`}
                      disabled={busy || departments.at(-1)?.id === department.id}
                      onClick={() => reorder("departments", departments.map((d) => d.id), departments.indexOf(department), 1)}
                    >
                      <ChevronRight aria-hidden="true" />
                    </IconButton>
                    <IconButton label={`Edit ${department.name}`} onClick={() => void editDepartment(department)}>
                      <Pencil aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label={department.archived ? `Restore ${department.name}` : `Archive ${department.name}`}
                      disabled={busy}
                      onClick={() => void archiveDepartment(department)}
                    >
                      {department.archived ? <RotateCcw aria-hidden="true" /> : <Archive aria-hidden="true" />}
                    </IconButton>
                  </span>
                )}
              </div>

              <Tabs active={tab} onChange={(id) => setParam("tab", id)} requestCount={pending.length} />

              <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
                {tab === "tracks" && (
                  <TracksPanel catalog={catalog} department={department} canEdit={isSuperadmin} busy={busy} act={act} refresh={refresh} reorder={reorder} />
                )}
                {tab === "stacks" && (
                  <StacksPanel catalog={catalog} department={department} canEdit={isSuperadmin} busy={busy} act={act} refresh={refresh} reorder={reorder} />
                )}
                {tab === "skills" && (
                  <SkillsPanel catalog={catalog} department={department} canEdit={isSuperadmin} busy={busy} act={act} refresh={refresh} reorder={reorder} />
                )}
                {tab === "requests" && (
                  <RequestsPanel
                    skills={pending}
                    canEdit={isSuperadmin}
                    busy={busy}
                    act={act}
                    onRequest={() => void requestSkill()}
                  />
                )}
              </div>
            </>
          )}

          {departments.length === 0 && (
            <p className="mt-10 text-sm text-muted-foreground">No departments yet.</p>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function Tabs({ active, onChange, requestCount }: { active: TabId; onChange: (id: TabId) => void; requestCount: number }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    onChange(TABS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label="Catalog" className="mt-6 flex gap-1 overflow-x-auto border-b">
      {TABS.map((t, index) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[index] = el;
          }}
          id={`tab-${t.id}`}
          role="tab"
          type="button"
          aria-selected={active === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
          className={cn(
            "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
            active === t.id ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
          {t.id === "requests" && requestCount > 0 && <Badge variant="progress">{requestCount}</Badge>}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------

interface PanelProps {
  catalog: Catalog;
  department: Department;
  canEdit: boolean;
  busy: boolean;
  act: (work: () => Promise<unknown>, success?: string) => Promise<boolean>;
  /** Re-reads the catalog after a dialog has saved. */
  refresh: () => Promise<void>;
  reorder: (table: CatalogTable, ids: readonly string[], index: number, delta: number) => void;
}

function TracksPanel({ catalog, department, canEdit, busy, act, refresh, reorder }: PanelProps) {
  const formDialog = useFormDialog();
  const [showArchived, setShowArchived] = useState(false);
  const all = catalog.tracks.filter((t) => t.departmentId === department.id);
  const rows = all.filter((t) => showArchived || !t.archived);
  const archivedCount = all.length - all.filter((t) => !t.archived).length;

  const edit = async (existing?: JobTrack) => {
    await formDialog({
      title: existing ? `Edit ${existing.name}` : `Add a track to ${department.name}`,
      submitLabel: existing ? "Save" : "Add",
      body: ({ pending }) => (
        <div className="space-y-4">
          <TextField name="name" label="Name" required autoFocus disabled={pending} defaultValue={existing?.name} maxLength={60} placeholder="Backend" />
          <TextField name="description" label="One line" disabled={pending} defaultValue={existing?.description} maxLength={240} />
        </div>
      ),
      onSubmit: async (data) => {
        const name = String(data.get("name") ?? "").trim();
        const description = String(data.get("description") ?? "").trim();
        await (existing
          ? catalogApi.updateTrack(existing.id, { name, description })
          : catalogApi.createTrack({ departmentId: department.id, name, description }));
        await refresh();
        notify.success(existing ? "Saved." : `Added ${name}.`);
        return true;
      },
    });
  };

  const archive = async (track: JobTrack) => {
    const ok = await act(() => catalogApi.archiveTrack(track.id, !track.archived));
    if (ok && !track.archived) notify.undo(`${track.name} archived.`, { onUndo: () => void act(() => catalogApi.archiveTrack(track.id, false), "Restored.") });
  };

  const ids = rows.map((t) => t.id);
  return (
    <section>
      <PanelToolbar
        help="A track is the job a learner is training for, like Backend or Account Executive. It decides which skills are suggested first."
        archivedCount={archivedCount}
        showArchived={showArchived}
        onShowArchived={setShowArchived}
        action={canEdit ? { label: "Add track", onClick: () => void edit() } : null}
      />
      {rows.length === 0 ? (
        <Empty>No tracks in {department.name} yet.</Empty>
      ) : (
        <ul className="divide-y rounded-lg border">
          {rows.map((track, index) => (
            <Row
              key={track.id}
              title={track.name}
              subtitle={track.description}
              archived={track.archived}
              canEdit={canEdit}
              busy={busy}
              first={index === 0}
              last={index === rows.length - 1}
              onMove={(delta) => reorder("tracks", ids, index, delta)}
              onEdit={() => void edit(track)}
              onArchive={() => void archive(track)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function StacksPanel({ catalog, department, canEdit, busy, act, refresh, reorder }: PanelProps) {
  const formDialog = useFormDialog();
  const [showArchived, setShowArchived] = useState(false);
  const all = catalog.stacks.filter((s) => s.departmentId === department.id);
  const rows = all.filter((s) => showArchived || !s.archived);
  const archivedCount = all.filter((s) => s.archived).length;

  const edit = async (existing?: StackOption) => {
    await formDialog({
      title: existing ? `Edit ${existing.name}` : `Add a stack or tool to ${department.name}`,
      submitLabel: existing ? "Save" : "Add",
      body: ({ pending }) => (
        <div className="space-y-4">
          <TextField name="name" label="Name" required autoFocus disabled={pending} defaultValue={existing?.name} maxLength={60} placeholder="Node.js" />
          <Field label="Kind" hint="A stack is what someone builds in; a tool is what they use alongside it.">
            {({ id, describedBy }) => (
              <select id={id} name="kind" aria-describedby={describedBy} defaultValue={existing?.kind ?? "stack"} disabled={pending} className={selectClass}>
                <option value="stack">Stack</option>
                <option value="tool">Tool</option>
              </select>
            )}
          </Field>
          <Field label="Sandbox language" hint="The language its coding problems run in, if any.">
            {({ id, describedBy }) => (
              <select id={id} name="language" aria-describedby={describedBy} defaultValue={existing?.language ?? ""} disabled={pending} className={selectClass}>
                <option value="">None</option>
                {SANDBOX_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <TextField
            name="aliases"
            label="Also known as"
            hint="Comma separated."
            disabled={pending}
            defaultValue={existing?.aliases.join(", ")}
            placeholder="node, nodejs"
          />
        </div>
      ),
      onSubmit: async (data) => {
        const language = String(data.get("language") ?? "");
        const body = {
          name: String(data.get("name") ?? "").trim(),
          kind: data.get("kind") === "tool" ? ("tool" as const) : ("stack" as const),
          language: (SANDBOX_LANGUAGES as readonly string[]).includes(language)
            ? (language as (typeof SANDBOX_LANGUAGES)[number])
            : null,
          aliases: splitList(String(data.get("aliases") ?? "")),
        };
        await (existing ? catalogApi.updateStack(existing.id, body) : catalogApi.createStack({ departmentId: department.id, ...body }));
        await refresh();
        notify.success(existing ? "Saved." : `Added ${body.name}.`);
        return true;
      },
    });
  };

  const archive = async (stack: StackOption) => {
    const ok = await act(() => catalogApi.archiveStack(stack.id, !stack.archived));
    if (ok && !stack.archived) notify.undo(`${stack.name} archived.`, { onUndo: () => void act(() => catalogApi.archiveStack(stack.id, false), "Restored.") });
  };

  const ids = rows.map((s) => s.id);
  return (
    <section>
      <PanelToolbar
        help="What a learner says they work with. Stacks with a sandbox language decide which language their coding problems are written in."
        archivedCount={archivedCount}
        showArchived={showArchived}
        onShowArchived={setShowArchived}
        action={canEdit ? { label: "Add stack or tool", onClick: () => void edit() } : null}
      />
      {rows.length === 0 ? (
        <Empty>No stacks or tools in {department.name} yet.</Empty>
      ) : (
        <ul className="divide-y rounded-lg border">
          {rows.map((stack, index) => (
            <Row
              key={stack.id}
              title={stack.name}
              chips={
                <>
                  <Badge variant="outline">{stack.kind}</Badge>
                  {stack.language && <Badge variant="default">{stack.language}</Badge>}
                </>
              }
              subtitle={stack.aliases.length > 0 ? `also: ${stack.aliases.join(", ")}` : undefined}
              archived={stack.archived}
              canEdit={canEdit}
              busy={busy}
              first={index === 0}
              last={index === rows.length - 1}
              onMove={(delta) => reorder("stacks", ids, index, delta)}
              onEdit={() => void edit(stack)}
              onArchive={() => void archive(stack)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function SkillsPanel({ catalog, department, canEdit, busy, act, refresh, reorder }: PanelProps) {
  const formDialog = useFormDialog();
  const [query, setQuery] = useState("");
  const [trackId, setTrackId] = useState<string | null>(null);
  const [status, setStatus] = useState<"active" | "archived">("active");

  const tracks = catalog.tracks.filter((t) => t.departmentId === department.id && !t.archived);
  const trackName = (id: string) => catalog.tracks.find((t) => t.id === id)?.name ?? id;
  const deptSkills = catalog.skills.filter((s) => s.departmentId === department.id);
  // Reordering acts on the department's catalog order, which only matches what is on screen when
  // nothing is narrowing it.
  const canReorder = canEdit && query.trim() === "" && trackId === null && status === "active";
  const orderIds = deptSkills.map((s) => s.id);
  const visible = filterSkills(deptSkills, { query, trackId: tracks.some((t) => t.id === trackId) ? trackId : null, status });
  const groups = groupByArea(visible);

  const edit = async (existing?: Skill) => {
    await formDialog({
      title: existing ? `Edit ${existing.name}` : `Add a skill to ${department.name}`,
      submitLabel: existing ? "Save" : "Add",
      body: ({ pending }) => <SkillFields skill={existing} tracks={tracks} pending={pending} />,
      onSubmit: async (data) => {
        const band = (key: string, fallback: LevelBand): LevelBand => {
          const value = String(data.get(key) ?? "");
          return (LEVEL_BANDS as readonly string[]).includes(value) ? (value as LevelBand) : fallback;
        };
        let levelMin = band("levelMin", "beginner");
        let levelMax = band("levelMax", "expert");
        if (LEVEL_BANDS.indexOf(levelMin) > LEVEL_BANDS.indexOf(levelMax)) [levelMin, levelMax] = [levelMax, levelMin];
        const body = {
          name: String(data.get("name") ?? "").trim(),
          area: String(data.get("area") ?? "").trim() || "General",
          levelMin,
          levelMax,
          trackIds: data.getAll("trackIds").map(String),
          aliases: splitList(String(data.get("aliases") ?? "")),
          isAiSkill: data.get("isAiSkill") === "on",
        };
        await (existing ? catalogApi.updateSkill(existing.id, body) : catalogApi.createSkill({ departmentId: department.id, ...body }));
        await refresh();
        notify.success(existing ? "Saved." : `Added ${body.name}.`);
        return true;
      },
    });
  };

  const archive = async (skill: Skill) => {
    const restoring = skill.status === "archived";
    const ok = await act(() => catalogApi.setSkillStatus(skill.id, restoring ? "active" : "archived"));
    // Undo puts back an active skill; a pending one is re-requested from the picker instead.
    if (ok && !restoring && skill.status === "active") notify.undo(`${skill.name} archived.`, { onUndo: () => void act(() => catalogApi.setSkillStatus(skill.id, "active"), "Restored.") });
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
          leading={<Search aria-hidden="true" />}
          placeholder="Search skills"
          aria-label="Search skills"
          containerClassName="w-full sm:max-w-xs"
        />
        <select
          aria-label="Filter by track"
          value={trackId ?? ""}
          onChange={(event) => setTrackId(event.target.value || null)}
          className={cn(selectClass, "w-auto")}
        >
          <option value="">Any track</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <div role="group" aria-label="Status" className="flex gap-1 rounded-md border p-1">
          {(["active", "archived"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
              className={cn(
                "rounded px-2.5 py-1 text-xs capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
                status === value ? "bg-surface-sunken font-medium" : "text-muted-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <InfoTip label="About skills">
          The skills learners in this department can be set up for and assessed on. The level band is the range a
          skill is meaningful at; tracks are where it is suggested first.
        </InfoTip>
        <span className="text-xs text-muted-foreground sm:ml-auto" aria-live="polite">
          {visible.length} skill{visible.length === 1 ? "" : "s"}
        </span>
        {canEdit && (
          <Button size="sm" onClick={() => void edit()}>
            <Plus aria-hidden="true" />
            Add skill
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <Empty>{deptSkills.length === 0 ? `No skills in ${department.name} yet.` : "No skill matches those filters."}</Empty>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.area}>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {group.area} <span className="font-mono text-xs">{group.skills.length}</span>
              </h3>
              <ul className="divide-y rounded-lg border">
                {group.skills.map((skill, index) => {
                  const at = orderIds.indexOf(skill.id);
                  return (
                    <Row
                      key={skill.id}
                      title={skill.name}
                      chips={
                        <>
                          <Badge variant="outline">{levelBandLabel(skill)}</Badge>
                          {skill.isAiSkill && <Badge variant="brand">AI</Badge>}
                          {skill.trackIds.map((id) => (
                            <Badge key={id} variant="default">
                              {trackName(id)}
                            </Badge>
                          ))}
                        </>
                      }
                      subtitle={skill.aliases.length > 0 ? `also: ${skill.aliases.join(", ")}` : undefined}
                      archived={skill.status === "archived"}
                      canEdit={canEdit}
                      canReorder={canReorder}
                      busy={busy}
                      first={index === 0}
                      last={index === group.skills.length - 1}
                      onMove={(delta) => {
                        // Swap with the neighbour in this area, wherever it sits in the full order.
                        const neighbour = group.skills[index + delta];
                        const to = neighbour ? orderIds.indexOf(neighbour.id) : -1;
                        if (to >= 0) reorder("skills", orderIds, at, to - at);
                      }}
                      onEdit={() => void edit(skill)}
                      onArchive={() => void archive(skill)}
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RequestsPanel({
  skills,
  canEdit,
  busy,
  act,
  onRequest,
}: {
  skills: Skill[];
  canEdit: boolean;
  busy: boolean;
  act: PanelProps["act"];
  onRequest: () => void;
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {canEdit ? "Skills staff asked for. Approve to add them to the catalog." : "Skills waiting for the superadmin."}
        </p>
        <InfoTip label="About requests">
          A requested skill can already be prioritised for a learner. Approving it makes it a normal catalog skill;
          archiving it hides it from pickers without touching anyone who already targets it.
        </InfoTip>
        <Button size="sm" variant="outline" className="sm:ml-auto" onClick={onRequest}>
          <Plus aria-hidden="true" />
          Request a skill
        </Button>
      </div>
      {skills.length === 0 ? (
        <Empty>Nothing waiting.</Empty>
      ) : (
        <ul className="divide-y rounded-lg border">
          {skills.map((skill) => (
            <li key={skill.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1 font-medium">{skill.name}</span>
              <Badge variant="progress">pending</Badge>
              {canEdit && (
                <span className="flex gap-1.5">
                  <Button size="sm" disabled={busy} onClick={() => void act(() => catalogApi.setSkillStatus(skill.id, "active"), `Approved "${skill.name}".`)}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void act(() => catalogApi.setSkillStatus(skill.id, "archived"), `Archived "${skill.name}".`)}
                  >
                    Archive
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Form bodies
// ---------------------------------------------------------------------------

function DepartmentFields({ department, pending }: { department?: Department; pending: boolean }) {
  return (
    <div className="space-y-4">
      <TextField name="name" label="Name" required autoFocus disabled={pending} defaultValue={department?.name} maxLength={60} placeholder="Design" />
      <Field label="Assessed with" hint="Coding problems, or written work tasks.">
        {({ id, describedBy }) => (
          <select
            id={id}
            name="assessmentFormat"
            aria-describedby={describedBy}
            defaultValue={department?.assessmentFormat ?? "tasks"}
            disabled={pending}
            className={selectClass}
          >
            <option value="coding">Coding problems</option>
            <option value="tasks">Work tasks</option>
          </select>
        )}
      </Field>
      <TextField
        name="practiceNoun"
        label="What practice is called"
        hint="Shown to learners, e.g. Code or Task workspace."
        disabled={pending}
        defaultValue={department?.practiceNoun ?? "Task workspace"}
        maxLength={40}
      />
    </div>
  );
}

function SkillFields({ skill, tracks, pending }: { skill?: Skill; tracks: JobTrack[]; pending: boolean }) {
  return (
    <div className="space-y-4">
      <TextField name="name" label="Name" required autoFocus disabled={pending} defaultValue={skill?.name} maxLength={80} placeholder="React Server Components" />
      <TextField name="area" label="Area" hint="Skills are grouped by this." disabled={pending} defaultValue={skill?.area ?? "General"} maxLength={60} />
      <div className="grid grid-cols-2 gap-3">
        {(["levelMin", "levelMax"] as const).map((key) => (
          <Field key={key} label={key === "levelMin" ? "From level" : "To level"}>
            {({ id }) => (
              <select
                id={id}
                name={key}
                defaultValue={skill?.[key] ?? (key === "levelMin" ? "beginner" : "expert")}
                disabled={pending}
                className={selectClass}
              >
                {LEVEL_BANDS.map((band) => (
                  <option key={band} value={band}>
                    {LEVEL_BAND_LABELS[band]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ))}
      </div>
      {tracks.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium">Tracks</legend>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-2">
            {tracks.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="trackIds" value={t.id} defaultChecked={skill?.trackIds.includes(t.id)} disabled={pending} />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <TextField name="aliases" label="Also known as" hint="Comma separated." disabled={pending} defaultValue={skill?.aliases.join(", ")} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isAiSkill" defaultChecked={skill?.isAiSkill} disabled={pending} />
        An AI skill
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

function PanelToolbar({
  help,
  archivedCount,
  showArchived,
  onShowArchived,
  action,
}: {
  help: string;
  archivedCount: number;
  showArchived: boolean;
  onShowArchived: (value: boolean) => void;
  action: { label: string; onClick: () => void } | null;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <InfoTip label="What this is">{help}</InfoTip>
      {archivedCount > 0 && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={showArchived} onChange={(event) => onShowArchived(event.target.checked)} />
          Show archived ({archivedCount})
        </label>
      )}
      {action && (
        <Button size="sm" className="ml-auto" onClick={action.onClick}>
          <Plus aria-hidden="true" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

function Row({
  title,
  subtitle,
  chips,
  archived,
  canEdit,
  canReorder = canEdit,
  busy,
  first,
  last,
  onMove,
  onEdit,
  onArchive,
}: {
  title: string;
  subtitle?: string;
  chips?: ReactNode;
  archived: boolean;
  canEdit: boolean;
  canReorder?: boolean;
  busy: boolean;
  first: boolean;
  last: boolean;
  onMove: (delta: number) => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <li className={cn("flex flex-wrap items-start gap-x-3 gap-y-2 px-4 py-3", archived && "bg-surface-sunken/40")}>
      <div className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className={cn("font-medium", archived && "text-muted-foreground")}>{title}</span>
          {archived && <Badge variant="outline">archived</Badge>}
          {chips}
        </span>
        {subtitle && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {canEdit && (
        <span className="flex shrink-0 items-center gap-0.5">
          {/* Buttons rather than drag-and-drop, as in the course editor: they work with a keyboard
              and on a phone without extra code. */}
          {canReorder && !archived && (
            <>
              <IconButton label={`Move ${title} up`} disabled={first || busy} onClick={() => onMove(-1)}>
                <ChevronUp aria-hidden="true" />
              </IconButton>
              <IconButton label={`Move ${title} down`} disabled={last || busy} onClick={() => onMove(1)}>
                <ChevronDown aria-hidden="true" />
              </IconButton>
            </>
          )}
          <IconButton label={`Edit ${title}`} onClick={onEdit}>
            <Pencil aria-hidden="true" />
          </IconButton>
          <IconButton label={archived ? `Restore ${title}` : `Archive ${title}`} disabled={busy} onClick={onArchive}>
            {archived ? <RotateCcw aria-hidden="true" /> : <Archive aria-hidden="true" />}
          </IconButton>
        </span>
      )}
    </li>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button variant="ghost" size="icon-sm" disabled={disabled} onClick={onClick}>
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}
