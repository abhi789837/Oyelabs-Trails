import { BookPlus, Check } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";

import {
  ASSIGNMENT_PRIORITIES,
  ASSIGNMENT_PRIORITY_LABELS,
  OYELABS_BADGE,
  type AssignmentPriority,
  type CourseSearchHit,
  type PickedCourse,
} from "@shared/oyelabsCourses";

import { Badge, Button, Dialog, Input, SkeletonLayout, v5Toast } from "@/v5/design";

import { plainMessage, useLoad } from "../parts/common";
import { assignRequest, courseAssignApi, courseSizeLine, type AddTarget } from "@/features/courses/assign/courseAssign";

/**
 * "Add a course" (v5.0.1; v4.5 Phase 4): search every course written here, Oyelabs courses first
 * (with the badge), pick how important it is, and who gets it:
 *   - this person;
 *   - everyone in their department now;
 *   - everyone in their department, including people who join later (optionally "Required for
 *     everyone in this department": Do it now in their first weeks).
 * Adding never removes anyone; adding again changes the priority.
 *
 * This is the v5 People sheet's picker. The old UI (learner page, onboarding card) has its own
 * `ClassicAddCourse` in `src/features/courses/assign/`, built from the old design only, so `?ui=old`
 * never loads `@/v5/design`. Both share the API and pure parts in `courseAssign.ts`.
 */

interface PickerProps {
  /** The learner, once they exist. Absent on the onboarding card. */
  userId?: string;
  name: string;
  /** Known up front on the onboarding card; read from the learner otherwise. */
  departmentId?: string;
  departmentName?: string;
  /** Onboarding: hand the choice back instead of saving it. */
  onPick?: (pick: PickedCourse) => void;
  /** Onboarding: courses already picked, shown as added. */
  picked?: readonly string[];
}

const css = {
  muted: "text-fg-2",
  strong: "text-fg-1",
  small: "text-small",
  caption: "text-caption",
  list: "flex max-h-72 flex-col divide-y divide-line-1 overflow-y-auto rounded-card border border-line-1",
  radio: "mt-0.5 size-5 shrink-0 accent-[rgb(var(--v5-brand))]",
  added: "text-success-fg",
  link: "text-brand-fg",
} as const;

/** Waits for a pause in typing before searching. */
function useDebounced<T>(value: T, ms: number): T {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setOut(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return out;
}

function PickerBody({ userId, name, departmentId: knownDept, departmentName: knownDeptName, onPick, picked, onDone }: PickerProps & { onDone: (message: string, ok: boolean) => void }) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const q = useDebounced(query, 250);
  const [priority, setPriority] = useState<AssignmentPriority>("important");
  const [target, setTarget] = useState<AddTarget>("learner");
  const [required, setRequired] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set(picked ?? []));

  const learner = useLoad((signal) => (userId && !onPick ? courseAssignApi.learner(userId, signal) : Promise.resolve(null)), userId ?? null);
  const departmentId = knownDept ?? learner.data?.departmentId;
  const departmentName = knownDeptName ?? learner.data?.departmentName ?? "their department";
  const hits = useLoad((signal) => courseAssignApi.search({ q, userId: onPick ? undefined : userId, departmentId: onPick ? knownDept : undefined }, signal), `${q}|${userId ?? ""}|${knownDept ?? ""}`);

  const add = async (hit: CourseSearchHit) => {
    if (onPick) {
      onPick({ courseId: hit.courseId, title: hit.title, oyelabs: hit.oyelabs, priority, reason: null });
      setAdded((cur) => new Set(cur).add(hit.courseId));
      return;
    }
    if (!userId) return;
    if (target !== "learner" && !departmentId) return;
    setBusy(hit.courseId);
    try {
      const res = await courseAssignApi.assign(assignRequest(hit.courseId, priority, target, { userId, departmentId: departmentId ?? "" }, required));
      setAdded((cur) => new Set(cur).add(hit.courseId));
      onDone(res.message, true);
    } catch (error) {
      onDone(plainMessage(error), false);
    } finally {
      setBusy(null);
    }
  };

  const status = (hit: CourseSearchHit) => {
    if (added.has(hit.courseId)) return "Added";
    if (hit.assigned) return hit.assigned.priority ? `Has it: ${ASSIGNMENT_PRIORITY_LABELS[hit.assigned.priority]}` : "Has it";
    return null;
  };

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-1.5">
        <legend className={`mb-1 font-medium ${css.small} ${css.strong}`}>How important is it?</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {ASSIGNMENT_PRIORITIES.map((p) => (
            <label key={p} className={`flex items-center gap-2 ${css.small}`}>
              <input type="radio" name={`${uid}-priority`} className={css.radio} checked={priority === p} onChange={() => setPriority(p)} />
              {ASSIGNMENT_PRIORITY_LABELS[p]}
            </label>
          ))}
        </div>
      </fieldset>

      {!onPick && userId ? (
        <fieldset className="flex flex-col gap-1.5">
          <legend className={`mb-1 font-medium ${css.small} ${css.strong}`}>Who gets it?</legend>
          <label className={`flex items-start gap-2 ${css.small}`}>
            <input type="radio" name={`${uid}-target`} className={css.radio} checked={target === "learner"} onChange={() => setTarget("learner")} />
            <span>{name}</span>
          </label>
          <label className={`flex items-start gap-2 ${css.small}`}>
            <input type="radio" name={`${uid}-target`} className={css.radio} disabled={!departmentId} checked={target === "department"} onChange={() => setTarget("department")} />
            <span>
              Everyone in {departmentName} now
              <span className={`block ${css.muted}`}>People who join later won't get it.</span>
            </span>
          </label>
          <label className={`flex items-start gap-2 ${css.small}`}>
            <input type="radio" name={`${uid}-target`} className={css.radio} disabled={!departmentId} checked={target === "department_everyone"} onChange={() => setTarget("department_everyone")} />
            <span>
              Everyone in {departmentName}, including new people
              <span className={`block ${css.muted}`}>New people get it on their first day.</span>
            </span>
          </label>
          {target === "department_everyone" ? (
            <label className={`ml-7 flex items-start gap-2 ${css.small}`}>
              <input type="checkbox" className={css.radio} checked={required} onChange={(e) => setRequired(e.target.checked)} />
              <span>
                Required for everyone in this department
                <span className={`block ${css.muted}`}>It goes in Do it now in their first two weeks, after anything it builds on.</span>
              </span>
            </label>
          ) : null}
        </fieldset>
      ) : null}

            <Input type="search" aria-label="Find a course" placeholder="Find a course" value={query} onChange={(e) => setQuery(e.target.value)} className="text-small" />

      {hits.error && !hits.data ? (
        <p role="alert" className={`flex flex-wrap items-center gap-2 ${css.small} ${css.muted}`}>
          {plainMessage(hits.error)}
          <button type="button" className={`font-medium underline ${css.link}`} onClick={hits.reload}>
            Try again
          </button>
        </p>
      ) : !hits.data ? (
        <SkeletonLayout variant="list" rows={3} label="Loading courses" />
      ) : hits.data.courses.length === 0 ? (
        <p className={`${css.small} ${css.muted}`}>
          {q ? "No course matches that." : "No courses written here yet."}{" "}
          <Link to="/admin/library" className={`font-medium underline ${css.link}`}>
            Go to the library
          </Link>
        </p>
      ) : (
        <ul className={css.list} aria-label="Courses" aria-busy={hits.loading}>
          {hits.data.courses.map((hit) => {
            const line = status(hit);
            return (
              <li key={hit.courseId} className="flex items-center gap-2 px-3 py-2">
                <span className={`min-w-0 flex-1 ${css.small}`}>
                  <span className={`flex flex-wrap items-center gap-1.5 font-medium ${css.strong}`}>
                    <span className="truncate">{hit.title}</span>
                    {hit.oyelabs ? <Badge tone="brand">{OYELABS_BADGE}</Badge> : null}
                    {hit.published === false ? <Badge tone="outline">Draft</Badge> : null}
                  </span>
                  <span className={`${css.caption} ${css.muted}`}>
                    {courseSizeLine(hit)}
                    {line && line !== "Added" ? ` · ${line}` : ""}
                  </span>
                </span>
                {line === "Added" ? (
                  <span className={`inline-flex items-center gap-1 font-medium ${css.small} ${css.added}`}>
                    <Check className="size-4" aria-hidden="true" />
                    Added
                  </span>
                ) : (
                  <Button variant="secondary" size="sm" loading={busy === hit.courseId} disabled={busy !== null && busy !== hit.courseId} onClick={() => void add(hit)} aria-label={`Add ${hit.title}`}>
                    {hit.assigned ? "Update" : "Add"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** The v5 People sheet's button and dialog. */
export function AddCourse({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <BookPlus aria-hidden="true" />
        Add a course
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Add a course for ${name}`}
        description="Oyelabs courses come first. Nobody loses a course they already have."
        footer={
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Done
          </Button>
        }
      >
        {open ? <PickerBody userId={userId} name={name} onDone={(message, ok) => (ok ? v5Toast.success(message) : v5Toast.error("We couldn't add the course", message))} /> : null}
      </Dialog>
    </>
  );
}
