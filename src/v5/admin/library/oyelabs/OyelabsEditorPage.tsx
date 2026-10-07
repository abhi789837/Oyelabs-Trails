import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { ArrowLeft, Check, ExternalLink, History, Loader2, Plus, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import type { Skill } from "@shared/catalog";
import {
  draftFromCourseView,
  draftToCourseInput,
  OYELABS_BADGE,
  OYELABS_LEVEL_LABELS,
  OYELABS_LEVELS,
  type OyelabsCourseView,
  type OyelabsDocView,
  type OyelabsDraftData,
  type OyelabsSaveProblem,
  type OyelabsVideoView,
  type SuggestSkillsResponse,
} from "@shared/oyelabsCourses";

import { ApiRequestError } from "@/api/client";
import { useCatalog } from "@/features/admin/catalog/useCatalog";
import { SkillPicker } from "@/features/admin/setup/SkillPicker";
import { Badge, Button, Card, Dialog, ErrorState, Field, Input, Textarea, cn, v5Toast } from "@/v5/design";

import { v5AdminApi, type VersionMeta } from "../../api";
import { formatDateTime, Page, PageHeader, plainMessage } from "../../parts/common";
import { EditorSkeleton } from "../../parts/Skeletons";
import { oyelabsApi } from "./api";
import { applyEdit, autosaveLine, emptyDraft, isDirty, MAX_MODULES, moduleKey, newerDraftOf, removalNeedsConfirm, withKeys, type EditorEdit } from "./editorState";
import { ModuleCard } from "./ModuleCard";

/**
 * v4.5 Phase 1: "+ Add Oyelabs course" (`/admin/library/oyelabs/new`) and editing one
 * (`/admin/library/:courseId/oyelabs`). One page, no wizard: departments, title and level, skills,
 * then modules. Every change is autosaved as a draft 1.5 s after typing stops; the live course
 * changes only on "Save & publish" or "Save as draft".
 */

const AUTOSAVE_MS = 1500;
const RETRY_MS = 5000;

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k${Math.random().toString(36).slice(2)}`);
const clock = (ts: number) => new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

type Offer = { id: string; updatedAt: number; title?: string };

function Chip({ pressed, onClick, children, disabled }: { pressed: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-small font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60",
        pressed ? "border-brand bg-brand-soft text-brand-fg" : "border-line-2 bg-surface-1 text-fg-1 hover:bg-sunken",
      )}
    >
      {pressed ? <Check className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export default function OyelabsEditorPage() {
  const { courseId } = useParams<{ courseId?: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { catalog } = useCatalog();
  const ids = { depts: useId(), level: useId(), skills: useId(), modules: useId(), problems: useId() };

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<unknown>(null);
  const [view, setView] = useState<OyelabsCourseView | null>(null);
  const [data, setData] = useState<OyelabsDraftData | null>(null);
  /** What the server holds for this page (the draft, or the course when there is no draft). */
  const [baseline, setBaseline] = useState<OyelabsDraftData | null>(null);
  const draftIdRef = useRef<string | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [autosaving, setAutosaving] = useState(false);
  const [autosaveFailed, setAutosaveFailed] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const [saving, setSaving] = useState<"publish" | "draft" | null>(null);
  const [problems, setProblems] = useState<OyelabsSaveProblem[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestSkillsResponse["skills"] | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const problemsRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  const startFrom = useCallback((next: OyelabsDraftData, draftId: string | null) => {
    const keyed = withKeys(next);
    setData(keyed);
    setBaseline(keyed);
    draftIdRef.current = draftId;
    setProblems([]);
    setSaveError(null);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setStatus("loading");
    setOffer(null);
    (async () => {
      try {
        if (courseId) {
          const v = await oyelabsApi.course(courseId, signal);
          setView(v);
          startFrom(draftFromCourseView(v), null);
          setOffer(newerDraftOf(v));
        } else {
          setView(null);
          const draftParam = params.get("draft");
          const draft = draftParam ? await oyelabsApi.getDraft(draftParam, signal).catch(() => null) : null;
          if (draft) startFrom(draft.data, draft.id);
          else {
            startFrom(emptyDraft(newKey()), null);
            const mine = await oyelabsApi.myNewDrafts(signal).catch(() => ({ drafts: [] }));
            const latest = mine.drafts[0];
            if (latest) setOffer({ id: latest.id, updatedAt: latest.updatedAt, title: latest.title });
          }
        }
        if (!signal.aborted) setStatus("ready");
      } catch (error) {
        if (signal.aborted) return;
        setLoadError(error);
        setStatus("error");
      }
    })();
    return () => controller.abort();
    // `params` is read once per load on purpose: writing ?draft= must not reload the page.
  }, [courseId, reloadTick, startFrom]);

  const keepOffer = async () => {
    if (!offer) return;
    try {
      const draft = await oyelabsApi.getDraft(offer.id);
      startFrom(draft.data, draft.id);
      setSavedAt(draft.updatedAt);
      if (!courseId) setParams({ draft: draft.id }, { replace: true });
    } catch (error) {
      v5Toast.error("We couldn't open those changes", plainMessage(error));
    }
    setOffer(null);
  };
  const discardOffer = async () => {
    if (!offer) return;
    setOffer(null);
    await oyelabsApi.deleteDraft(offer.id).catch(() => undefined);
  };

  // -------------------------------------------------------------------------
  // Autosave
  // -------------------------------------------------------------------------

  const dirty = data !== null && isDirty(data, baseline);
  const persistRef = useRef<() => Promise<void>>(async () => undefined);
  persistRef.current = async () => {
    if (!data || !isDirty(data, baseline)) return;
    const snapshot = data;
    setAutosaving(true);
    try {
      if (!draftIdRef.current) {
        const created = await oyelabsApi.createDraft(courseId ?? null);
        draftIdRef.current = created.id;
        if (!courseId) setParams({ draft: created.id }, { replace: true });
      }
      try {
        await oyelabsApi.putDraft(draftIdRef.current, courseId ?? null, snapshot);
      } catch (error) {
        // The draft was saved or thrown away elsewhere: start a fresh one.
        if (!(error instanceof ApiRequestError && error.status === 404)) throw error;
        const created = await oyelabsApi.createDraft(courseId ?? null);
        draftIdRef.current = created.id;
        await oyelabsApi.putDraft(created.id, courseId ?? null, snapshot);
      }
      setBaseline(snapshot);
      setSavedAt(Date.now());
      setAutosaveFailed(false);
    } catch {
      setAutosaveFailed(true);
      window.setTimeout(() => setRetryTick((t) => t + 1), RETRY_MS);
    } finally {
      setAutosaving(false);
    }
  };

  useEffect(() => {
    if (!dirty || saving || offer || status !== "ready") return;
    const timer = window.setTimeout(() => void persistRef.current(), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [data, dirty, saving, offer, status, retryTick]);

  // Leaving with changes not yet autosaved asks first.
  useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  const edit = useCallback((e: EditorEdit) => setData((cur) => (cur ? applyEdit(cur, e) : cur)), []);

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  const save = async (action: "publish" | "draft") => {
    if (!data || saving) return;
    const mapped = draftToCourseInput(data);
    if (!mapped.ok) {
      setProblems(mapped.problems);
      setSaveError(null);
      requestAnimationFrame(() => problemsRef.current?.focus());
      return;
    }
    setProblems([]);
    setSaveError(null);
    setSaving(action);
    try {
      const body = { course: mapped.input, action, ...(draftIdRef.current ? { draftId: draftIdRef.current } : {}) };
      const r = courseId ? await oyelabsApi.update(courseId, body) : await oyelabsApi.create(body);
      draftIdRef.current = null;
      setSavedAt(null);
      if (action === "publish") {
        v5Toast.success(
          r.regenerating.length ? "Published. We're writing the module questions now." : "Published. Learners in the chosen departments can see it.",
        );
      } else v5Toast.success("Saved as a draft. Learners can't see it yet.");
      if (!courseId) navigate(`/admin/library/${encodeURIComponent(r.courseId)}/oyelabs`, { replace: true });
      else {
        const v = await oyelabsApi.course(courseId);
        setView(v);
        startFrom(draftFromCourseView(v), null);
      }
    } catch (error) {
      setSaveError(plainMessage(error, "We couldn't save. Your changes are still here. Try again."));
      if (error instanceof ApiRequestError && error.fields) {
        setProblems(Object.entries(error.fields).map(([path, message]) => ({ path, message })));
      }
    } finally {
      setSaving(null);
    }
  };

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const departments = useMemo(() => (catalog?.departments ?? []).filter((d) => !d.archived).sort((a, b) => a.position - b.position), [catalog]);
  const areaIds = useMemo(() => new Set(departments.filter((d) => d.kind === "area").map((d) => d.id)), [departments]);
  const pickable = useMemo<Skill[]>(() => {
    const chosen = new Set(data?.departmentIds ?? []);
    return (catalog?.skills ?? []).filter((s) => s.status === "active" && (chosen.size === 0 || chosen.has(s.departmentId) || areaIds.has(s.departmentId)));
  }, [catalog, data?.departmentIds, areaIds]);
  const skillName = useCallback((id: string) => catalog?.skills.find((s) => s.id === id)?.name ?? id, [catalog]);
  const savedVideos = useMemo(() => Object.fromEntries((view?.modules ?? []).flatMap((m) => m.videos.map((v) => [v.id, v]))) as Record<string, OyelabsVideoView>, [view]);
  const savedDocs = useMemo(() => Object.fromEntries((view?.modules ?? []).flatMap((m) => m.docs.map((d) => [d.id, d]))) as Record<string, OyelabsDocView>, [view]);
  const problemAt = (path: string) => problems.find((p) => p.path === path)?.message;
  const moduleProblems = (i: number) => ({
    title: problemAt(`modules.${i}.title`),
    videos: problems.find((p) => p.path.startsWith(`modules.${i}.videos`))?.message,
    docs: problems.find((p) => p.path.startsWith(`modules.${i}.docs`))?.message,
  });

  const suggest = async () => {
    if (!data) return;
    setSuggesting(true);
    try {
      const r = await oyelabsApi.suggestSkills({ title: data.title, description: data.description, moduleTitles: data.modules.map((m) => m.title).filter(Boolean), departmentIds: data.departmentIds });
      setSuggestions(r.skills);
    } catch (error) {
      v5Toast.error("We couldn't suggest skills", plainMessage(error));
    } finally {
      setSuggesting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const back = (
    <Link to="/admin/library" className="mb-2 inline-flex min-h-6 items-center gap-1 rounded-sm text-small font-medium text-brand-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
      <ArrowLeft className="size-4" aria-hidden="true" /> Library
    </Link>
  );

  if (status === "error") {
    const missing = loadError instanceof ApiRequestError && loadError.status === 404;
    return (
      <Page>
        {back}
        <ErrorState title={missing ? "We couldn't find that course" : "We couldn't open the editor"} body={plainMessage(loadError)} onRetry={missing ? undefined : () => setReloadTick((t) => t + 1)} />
      </Page>
    );
  }
  if (status === "loading" || !data) {
    return (
      <Page>
        {back}
        <EditorSkeleton />
      </Page>
    );
  }

  const busy = saving !== null;
  const live = view?.published ?? false;
  const removingModule = removing ? data.modules.find((m, i) => moduleKey(m, i) === removing) : undefined;

  return (
    <Page className="pb-40">
      {back}
      <PageHeader
        title={courseId ? `Edit ${view?.title || "Oyelabs course"}` : "Add an Oyelabs course"}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone="brand">{OYELABS_BADGE}</Badge>
            {courseId ? (live ? <Badge tone="success">Live</Badge> : <Badge tone="outline">Draft</Badge>) : null}
            <span>Your company's own course: modules with videos, documents and notes. We write the questions for each module when you publish.</span>
          </span>
        }
        actions={
          courseId ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
                <History aria-hidden="true" />
                Versions
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/learn/library/${encodeURIComponent(courseId)}?preview=1`} target="_blank" rel="noopener" aria-label="Preview as a learner (opens a new tab)">
                  <ExternalLink aria-hidden="true" />
                  Preview as learner
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      />

      {offer ? (
        <Card className="mb-4 flex flex-col gap-3 border-info/40 bg-info-soft sm:flex-row sm:items-center" role="region" aria-label="Unsaved changes">
          <p className="flex-1 text-small text-fg-1">
            {courseId
              ? `You have unsaved changes from ${clock(offer.updatedAt)}.`
              : `You started a course${offer.title ? ` called “${offer.title}”` : ""} at ${formatDateTime(offer.updatedAt)} and didn't save it.`}
          </p>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => void keepOffer()}>
              {courseId ? "Keep them" : "Continue it"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void discardOffer()}>
              {courseId ? "Discard them" : "Start a new one"}
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-(--v5-gap)">
        {/* 1. Departments */}
        <Card className="flex flex-col gap-3">
          <h2 id={ids.depts} className="font-display text-h4 font-semibold">
            Who it's for
          </h2>
          <p className="-mt-2 text-small text-fg-2">It shows in the library of the departments you pick.</p>
          <div role="group" aria-labelledby={ids.depts} className="flex flex-wrap gap-2">
            <Chip pressed={data.departmentIds.length === 0} disabled={busy} onClick={() => edit({ type: "allDepartments" })}>
              All departments
            </Chip>
            {departments.map((d) => (
              <Chip key={d.id} pressed={data.departmentIds.includes(d.id)} disabled={busy} onClick={() => edit({ type: "toggleDepartment", id: d.id })}>
                {d.name}
              </Chip>
            ))}
          </div>
        </Card>

        {/* 2. Title, description, level */}
        <Card className="flex flex-col gap-4">
          <h2 className="font-display text-h4 font-semibold">About the course</h2>
          <Field label="Title" error={problemAt("title")}>
            <Input value={data.title} maxLength={120} placeholder="White-label delivery" disabled={busy} onChange={(e) => edit({ type: "title", value: e.target.value })} />
          </Field>
          <Field label="Short description" hint="One or two sentences. Learners read it on the course card." optional error={problemAt("description")}>
            <Textarea value={data.description} maxLength={400} rows={3} disabled={busy} onChange={(e) => edit({ type: "description", value: e.target.value })} />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend id={ids.level} className="mb-1 text-small font-medium text-fg-1">
              Level
            </legend>
            <div className="flex flex-wrap gap-2">
              {OYELABS_LEVELS.map((level) => (
                <label
                  key={level}
                  className={cn(
                    "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-small font-medium has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                    data.level === level ? "border-brand bg-brand-soft text-brand-fg" : "border-line-2 bg-surface-1 text-fg-1 hover:bg-sunken",
                  )}
                >
                  <input type="radio" name="oyelabs-level" className="size-4 accent-[var(--v5-brand,currentColor)]" value={level} checked={data.level === level} disabled={busy} onChange={() => edit({ type: "level", value: level })} />
                  {OYELABS_LEVEL_LABELS[level]}
                </label>
              ))}
            </div>
            {problemAt("level") ? (
              <p role="alert" className="text-small font-medium text-danger-fg">
                {problemAt("level")}
              </p>
            ) : null}
          </fieldset>
        </Card>

        {/* 3. Skills */}
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={ids.skills} className="flex-1 font-display text-h4 font-semibold">
              Skills <span className="text-small font-normal text-fg-2">(optional)</span>
            </h2>
            <Button variant="secondary" size="sm" loading={suggesting} disabled={busy || data.title.trim().length < 2} onClick={() => void suggest()}>
              <Sparkles aria-hidden="true" />
              Suggest skills
            </Button>
          </div>
          <p className="-mt-2 text-small text-fg-2">Skills help us add this course to the right people's plans.</p>
          {data.skillIds.length ? (
            <ul aria-labelledby={ids.skills} className="flex flex-wrap gap-1.5">
              {data.skillIds.map((id) => (
                <li key={id}>
                  <span className="inline-flex min-h-7 items-center gap-1 rounded-full border border-line-1 bg-sunken pl-2.5 pr-1 text-small">
                    {skillName(id)}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => edit({ type: "removeSkill", id })}
                      className="inline-flex size-6 items-center justify-center rounded-full text-fg-2 hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Remove {skillName(id)}</span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="max-w-md">
            <SkillPicker
              skills={pickable}
              track={null}
              selectedIds={data.skillIds}
              otherIds={[]}
              otherLabel=""
              triggerLabel="Add a skill"
              disabled={busy}
              onPick={(skill) => edit({ type: "addSkill", id: skill.id })}
              onRequest={() => v5Toast.info("Add the skill on the Departments page first, then pick it here.")}
            />
          </div>
          {suggestions ? (
            <div className="rounded-control border border-line-1 bg-surface-1 p-3" role="region" aria-label="Suggested skills" data-testid="skill-suggestions">
              {suggestions.length === 0 ? (
                <p className="text-small text-fg-2">We didn't find a clear match. Add skills from the list instead.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {suggestions.map((s) => {
                    const added = data.skillIds.includes(s.skillId);
                    return (
                      <li key={s.skillId} className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 flex-1 text-small">
                          <span className="font-medium text-fg-1">{s.name}</span>
                          <span className="text-fg-2"> — {s.reason}</span>
                        </span>
                        <Button variant={added ? "ghost" : "secondary"} size="sm" disabled={added || busy} onClick={() => edit({ type: "addSkill", id: s.skillId })} aria-label={added ? `${s.name} added` : `Add ${s.name}`}>
                          {added ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
                          {added ? "Added" : "Add"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </Card>

        {/* 4. Modules */}
        <section aria-labelledby={ids.modules} className="flex flex-col gap-3">
          <h2 id={ids.modules} className="font-display text-h3 font-semibold">
            Modules
          </h2>
          {problemAt("modules") ? (
            <p role="alert" className="text-small font-medium text-danger-fg">
              {problemAt("modules")}
            </p>
          ) : null}
          <DragDropProvider
            onDragEnd={(event) => {
              if (event.canceled) return;
              const { source } = event.operation;
              if (source && isSortable(source) && source.initialIndex !== source.index) edit({ type: "moveModule", from: source.initialIndex, to: source.index });
            }}
          >
            <ol className="flex flex-col gap-(--v5-gap)">
              {data.modules.map((m, i) => {
                const key = moduleKey(m, i);
                return (
                  <ModuleCard
                    key={key}
                    module={m}
                    moduleKey={key}
                    index={i}
                    count={data.modules.length}
                    savedVideos={savedVideos}
                    savedDocs={savedDocs}
                    problems={moduleProblems(i)}
                    disabled={busy}
                    onEdit={edit}
                    onMove={(from, to) => edit({ type: "moveModule", from, to })}
                    onRemove={() => (removalNeedsConfirm(m) ? setRemoving(key) : edit({ type: "removeModule", key }))}
                  />
                );
              })}
            </ol>
          </DragDropProvider>
          <div>
            <Button variant="secondary" disabled={busy || data.modules.length >= MAX_MODULES} onClick={() => edit({ type: "addModule", key: newKey() })}>
              <Plus aria-hidden="true" />
              Add module
            </Button>
          </div>
        </section>
      </div>

      {/* 5. Sticky footer */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 @3xl/shell:bottom-0 border-t border-line-1 bg-surface-2 px-4 py-3 sm:-mx-6 sm:px-6" data-testid="oyelabs-footer">
        {problems.length || saveError ? (
          <div ref={problemsRef} tabIndex={-1} id={ids.problems} role="alert" className="mb-2 rounded-control bg-danger-soft px-3 py-2 text-small text-danger-fg outline-none">
            {saveError ? <p className="font-medium">{saveError}</p> : <p className="font-medium">Fix these first:</p>}
            {problems.length ? (
              <ul className="mt-1 list-disc pl-5">
                {problems.slice(0, 6).map((p) => (
                  <li key={p.path + p.message}>{p.message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto inline-flex items-center gap-1.5 text-small text-fg-2" aria-live="polite" data-testid="autosave-status">
            {autosaving ? <Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden="true" /> : null}
            {autosaveLine({ saving: autosaving, failed: autosaveFailed, savedAt, dirty }, clock)}
          </p>
          <Button variant="secondary" loading={saving === "draft"} disabled={busy} onClick={() => void save("draft")}>
            Save as draft
          </Button>
          <Button variant="primary" loading={saving === "publish"} disabled={busy} onClick={() => void save("publish")}>
            Save &amp; publish
          </Button>
        </div>
        {live ? <p className="mt-1 text-caption text-fg-2">Save as draft hides the course from learners until you publish again. Their progress stays.</p> : null}
      </div>

      <Dialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removingModule?.title.trim() || "this module"}?`}
        description="When you save, people lose their progress and test results on this module. Other modules are not affected."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (removing) edit({ type: "removeModule", key: removing });
                setRemoving(null);
              }}
            >
              Remove module
            </Button>
          </>
        }
      />

      {courseId ? (
        <VersionsDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          courseId={courseId}
          onOpened={(draftId) => {
            setHistoryOpen(false);
            void oyelabsApi.getDraft(draftId).then((d) => {
              startFrom(d.data, d.id);
              setSavedAt(d.updatedAt);
              v5Toast.success("That version is open as a draft. Save it to make it the current one.");
            });
          }}
        />
      ) : null}
    </Page>
  );
}

function VersionsDialog({ open, onOpenChange, courseId, onOpened }: { open: boolean; onOpenChange: (o: boolean) => void; courseId: string; onOpened: (draftId: string) => void }) {
  const [versions, setVersions] = useState<VersionMeta[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    v5AdminApi
      .versions(courseId, controller.signal)
      .then((r) => setVersions(r.versions))
      .catch(() => setVersions([]));
    return () => controller.abort();
  }, [open, courseId]);
  const openVersion = async (version: number) => {
    setBusy(version);
    try {
      const r = await oyelabsApi.restore(courseId, version);
      if (r.draftId) onOpened(r.draftId);
    } catch (error) {
      v5Toast.error("We couldn't open that version", plainMessage(error));
    } finally {
      setBusy(null);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Versions" description="Every save keeps a version. Opening one puts it in the editor as a draft; nothing changes for learners until you save.">
      {versions === null ? (
        <p className="text-small text-fg-2">Loading…</p>
      ) : versions.length === 0 ? (
        <p className="text-small text-fg-2">No saved versions yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {versions.map((v, i) => (
            <li key={v.version} className="flex flex-wrap items-center gap-2 rounded-control border border-line-1 px-3 py-2">
              <span className="min-w-0 flex-1 text-small">
                <span className="font-medium">Version {v.version}</span>
                <span className="text-fg-2">
                  {" "}
                  · {formatDateTime(v.createdAt)}
                  {v.createdByName ? ` · ${v.createdByName}` : ""}
                  {v.note ? ` · ${v.note}` : ""}
                </span>
              </span>
              {i === 0 ? (
                <Badge tone="outline">Current</Badge>
              ) : (
                <Button variant="secondary" size="sm" loading={busy === v.version} onClick={() => void openVersion(v.version)}>
                  Open as draft
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
