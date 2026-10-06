import { Eye, EyeOff, Search, Users, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import type { Course, CourseAudience } from "@shared/courses";

import { adminApi } from "@/features/admin/api";
import { useCatalog } from "@/features/admin/catalog/useCatalog";
import { coursesApi } from "@/features/admin/courses/api";
import { Button, Card, Input, Skeleton, StatusLine, cn, v5Toast } from "@/v5/design";

import { plainMessage, useLoad } from "../../parts/common";
import { audienceLine, filterPeople, samePeople, type PickablePerson } from "../audience";
import { courseUpdate } from "./courseOps";

/**
 * "Who gets this course" (v5.0.1): everyone, or only the people picked. The audience is saved with
 * the course update and the people through PUT assignees, the same endpoints the older editor uses.
 * The line on top says who sees it right now; a draft says nobody does, and offers "Make it live".
 */
export function AudiencePanel({ course, onCourseChange, onMakeLive }: { course: Course; onCourseChange: (course: Course) => void; onMakeLive: (course: Course) => Promise<void> }) {
  const users = useLoad((signal) => adminApi.listUsers(signal));
  const assignees = useLoad(() => coursesApi.getAssignees(course.id), course.id);
  const { departmentName } = useCatalog();

  const [audience, setAudience] = useState<CourseAudience>(course.audience);
  const [picked, setPicked] = useState<string[]>([]);
  const [savedPicked, setSavedPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchId = useId();
  const listId = useId();

  useEffect(() => setAudience(course.audience), [course.audience]);
  useEffect(() => {
    if (!assignees.data) return;
    setPicked(assignees.data.userIds);
    setSavedPicked(assignees.data.userIds);
  }, [assignees.data]);

  const learners = useMemo<PickablePerson[]>(
    () =>
      (users.data?.users ?? [])
        .filter((u) => u.role === "learner" && (u.status !== "archived" || picked.includes(u.id)))
        .map((u) => ({ id: u.id, displayName: u.displayName, username: u.username, department: u.departmentId ? departmentName(u.departmentId) : null }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [users.data, departmentName, picked],
  );
  const byId = useMemo(() => new Map(learners.map((p) => [p.id, p])), [learners]);
  const shown = useMemo(() => filterPeople(learners, query), [learners, query]);

  const dirty = audience !== course.audience || (audience === "assigned" && !samePeople(picked, savedPicked));
  // What the line says is what learners see now, so it follows the saved state, not the form.
  const line = audienceLine(course.published, course.audience, savedPicked.length);
  const tone = !course.published ? "neutral" : course.audience === "assigned" && savedPicked.length === 0 ? "warning" : "success";

  const toggle = (id: string, on: boolean) => setPicked((cur) => (on ? (cur.includes(id) ? cur : [...cur, id]) : cur.filter((x) => x !== id)));

  /** Saves the form and returns the course as it now is (or null if it failed). */
  const save = async (): Promise<Course | null> => {
    setSaving(true);
    setError(null);
    try {
      // People first, so switching to "only people I pick" never hides it from them in between.
      if (audience === "assigned" && !samePeople(picked, savedPicked)) {
        await coursesApi.setAssignees(course.id, picked);
        setSavedPicked(picked);
      }
      let next = course;
      if (audience !== course.audience) {
        next = (await coursesApi.update(course.id, courseUpdate(course, { audience }))).course;
        onCourseChange(next);
      }
      v5Toast.success(audienceLine(next.published, next.audience, audience === "assigned" ? picked.length : 0));
      return next;
    } catch (err) {
      setError(plainMessage(err, "We couldn't save who gets it. Your choices are still here. Try again."));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const makeLive = async () => {
    const next = dirty ? await save() : course;
    if (next) await onMakeLive(next);
  };

  const loadError = users.error ?? assignees.error;

  return (
    <Card className="mb-(--v5-gap) flex flex-col gap-3" aria-labelledby={`${listId}-title`}>
      <h2 id={`${listId}-title`} className="font-display text-h4 font-semibold">
        Who gets this course
      </h2>
      <StatusLine
        tone={tone}
        icon={course.published ? <Eye /> : <EyeOff />}
        action={
          !course.published ? (
            <Button variant="primary" size="sm" loading={saving} onClick={() => void makeLive()}>
              Make it live
            </Button>
          ) : null
        }
      >
        {line}
        {!course.published ? " Learners see a course only after you make it live." : null}
      </StatusLine>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="sr-only">Who gets this course</legend>
        <label className="flex items-start gap-2 text-small">
          <input type="radio" name={`${listId}-audience`} className="mt-0.5 size-5 shrink-0 accent-[rgb(var(--v5-brand))]" checked={audience === "everyone"} onChange={() => setAudience("everyone")} />
          <span>
            <span className="font-medium text-fg-1">Everyone</span>
            <span className="block text-fg-2">It shows in every learner's Library.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-small">
          <input type="radio" name={`${listId}-audience`} className="mt-0.5 size-5 shrink-0 accent-[rgb(var(--v5-brand))]" checked={audience === "assigned"} onChange={() => setAudience("assigned")} />
          <span>
            <span className="font-medium text-fg-1">Only people I pick</span>
            <span className="block text-fg-2">Only they see it in their Library.</span>
          </span>
        </label>
      </fieldset>

      {audience === "assigned" ? (
        loadError && !(users.data && assignees.data) ? (
          <p role="alert" className="flex flex-wrap items-center gap-2 text-small text-fg-2">
            {plainMessage(loadError, "We couldn't load the people.")}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                users.reload();
                assignees.reload();
              }}
            >
              Try again
            </Button>
          </p>
        ) : !users.data || !assignees.data ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="flex flex-col gap-2">
            {picked.length ? (
              <ul aria-label="Picked" className="flex flex-wrap gap-1">
                {picked.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => toggle(id, false)}
                      aria-label={`Remove ${byId.get(id)?.displayName ?? "this person"}`}
                      className="inline-flex h-7 items-center gap-1 rounded-full bg-brand-soft px-2.5 text-caption font-medium text-brand-fg hover:bg-sunken"
                    >
                      {byId.get(id)?.displayName ?? "Someone who left"}
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-fg-2">Nobody picked yet.</p>
            )}
            <label htmlFor={searchId} className="text-small font-medium">
              Find people
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-2" aria-hidden="true" />
              <Input id={searchId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or department" aria-controls={listId} className="pl-8 text-small" />
            </div>
            <div id={listId} role="group" aria-label="Learners" className="flex max-h-56 flex-col overflow-y-auto rounded-control border border-line-1">
              {shown.map((p) => (
                <label key={p.id} className={cn("flex min-h-9 items-center gap-2 px-2.5 py-1 text-small hover:bg-sunken", picked.includes(p.id) && "bg-brand-soft")}>
                  <input type="checkbox" className="size-4 shrink-0 accent-[rgb(var(--v5-brand))]" checked={picked.includes(p.id)} onChange={(e) => toggle(p.id, e.target.checked)} />
                  <span className="min-w-0 flex-1 truncate text-fg-1">{p.displayName}</span>
                  <span className="shrink-0 truncate text-caption text-fg-2">{p.department ?? "No department"}</span>
                </label>
              ))}
              {shown.length === 0 ? <p className="px-2.5 py-2 text-small text-fg-2">{learners.length ? "Nobody matches that." : "No learners yet. Add people first."}</p> : null}
            </div>
            <p className="text-caption text-fg-2" aria-live="polite">
              <Users className="mr-1 inline size-3.5 align-text-bottom" aria-hidden="true" />
              {picked.length} picked, showing {shown.length} of {learners.length}
            </p>
          </div>
        )
      ) : null}

      {error ? (
        <p role="alert" className="text-small font-medium text-danger-fg">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={dirty ? "primary" : "secondary"} size="sm" loading={saving} disabled={!dirty} onClick={() => void save()}>
          {dirty ? "Save who gets it" : "Saved"}
        </Button>
        {dirty ? <span className="text-caption text-fg-2">Not saved yet.</span> : null}
      </div>
    </Card>
  );
}
