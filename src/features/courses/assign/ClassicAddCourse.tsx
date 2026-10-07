import { BookPlus, Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  ASSIGNMENT_PRIORITIES,
  ASSIGNMENT_PRIORITY_LABELS,
  OYELABS_BADGE,
  type AssignmentPriority,
  type CourseSearchHit,
  type LearnerCoursesView,
  type PickedCourse,
} from "@shared/oyelabsCourses";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";

import { assignErrorMessage, assignRequest, courseAssignApi, courseSizeLine, type AddTarget } from "./courseAssign";

/**
 * "Add a course" in the previous design: the old learner page header and the onboarding summary
 * card. Built only from `src/components/ui` (the old design's shadcn), never from `@/v5/design`,
 * so `?ui=old` never loads the v5 tokens. The v5 People sheet has its own `AddCourse`; both share
 * the API and the pure parts in `./courseAssign`.
 *
 * With `onPick`, nothing is saved: the course is handed back (onboarding, before the account exists).
 */

export interface ClassicAddCourseProps {
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
  label?: string;
}

/** Waits for a pause in typing before searching. */
function useDebounced<T>(value: T, ms: number): T {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setOut(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return out;
}

interface Load<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
}

/** Fetch when `key` changes, abort the previous request, keep the last data while reloading. */
function useFetch<T>(load: (signal: AbortSignal) => Promise<T>, key: string, tick: number): Load<T> {
  const [state, setState] = useState<Load<T>>({ data: null, error: null, loading: true });
  // `load` is rebuilt every render; `key` and `tick` say when it means something new.
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const controller = new AbortController();
    setState((cur) => ({ ...cur, loading: true }));
    loadRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ data, error: null, loading: false });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState((cur) => ({ data: cur.data, error, loading: false }));
      },
    );
    return () => controller.abort();
  }, [key, tick]);
  return state;
}

const radio = "mt-0.5 size-4 shrink-0 accent-[var(--color-trailmark,currentColor)]";

function PickerBody({ userId, name, departmentId: knownDept, departmentName: knownDeptName, onPick, picked, onDone }: ClassicAddCourseProps & { onDone: (message: string, ok: boolean) => void }) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const q = useDebounced(query, 250);
  const [priority, setPriority] = useState<AssignmentPriority>("important");
  const [target, setTarget] = useState<AddTarget>("learner");
  const [required, setRequired] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set(picked ?? []));
  const [tick, setTick] = useState(0);

  const learner = useFetch<LearnerCoursesView | null>((signal) => (userId && !onPick ? courseAssignApi.learner(userId, signal) : Promise.resolve(null)), userId ?? "", 0);
  const departmentId = knownDept ?? learner.data?.departmentId ?? undefined;
  const departmentName = knownDeptName ?? learner.data?.departmentName ?? "their department";
  const hits = useFetch(
    (signal) => courseAssignApi.search({ q, userId: onPick ? undefined : userId, departmentId: onPick ? knownDept : undefined }, signal),
    `${q}|${userId ?? ""}|${knownDept ?? ""}`,
    tick,
  );

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
      onDone(assignErrorMessage(error), false);
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
        <legend className="mb-1 text-sm font-medium text-foreground">How important is it?</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {ASSIGNMENT_PRIORITIES.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm">
              <input type="radio" name={`${uid}-priority`} className={radio} checked={priority === p} onChange={() => setPriority(p)} />
              {ASSIGNMENT_PRIORITY_LABELS[p]}
            </label>
          ))}
        </div>
      </fieldset>

      {!onPick && userId ? (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-sm font-medium text-foreground">Who gets it?</legend>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name={`${uid}-target`} className={radio} checked={target === "learner"} onChange={() => setTarget("learner")} />
            <span>{name}</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name={`${uid}-target`} className={radio} disabled={!departmentId} checked={target === "department"} onChange={() => setTarget("department")} />
            <span>
              Everyone in {departmentName} now
              <span className="block text-muted-foreground">People who join later won't get it.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name={`${uid}-target`} className={radio} disabled={!departmentId} checked={target === "department_everyone"} onChange={() => setTarget("department_everyone")} />
            <span>
              Everyone in {departmentName}, including new people
              <span className="block text-muted-foreground">New people get it on their first day.</span>
            </span>
          </label>
          {target === "department_everyone" ? (
            <label className="ml-7 flex items-start gap-2 text-sm">
              <input type="checkbox" className={radio} checked={required} onChange={(e) => setRequired(e.target.checked)} />
              <span>
                Required for everyone in this department
                <span className="block text-muted-foreground">It goes in Do it now in their first two weeks, after anything it builds on.</span>
              </span>
            </label>
          ) : null}
        </fieldset>
      ) : null}

      <Input type="search" aria-label="Find a course" placeholder="Find a course" value={query} onChange={(e) => setQuery(e.target.value)} />

      {hits.error && !hits.data ? (
        <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {assignErrorMessage(hits.error)}
          <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => setTick((t) => t + 1)}>
            Try again
          </Button>
        </p>
      ) : !hits.data ? (
        <p className="text-sm text-muted-foreground">Loading courses…</p>
      ) : hits.data.courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {q ? "No course matches that." : "No courses written here yet."}{" "}
          <Link to="/admin/library" className="font-medium text-foreground underline">
            Go to the library
          </Link>
        </p>
      ) : (
        <ul className="flex max-h-72 flex-col divide-y overflow-y-auto rounded-md border" aria-label="Courses" aria-busy={hits.loading}>
          {hits.data.courses.map((hit) => {
            const line = status(hit);
            return (
              <li key={hit.courseId} className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1 text-sm">
                  <span className="flex flex-wrap items-center gap-1.5 font-medium text-foreground">
                    <span className="truncate">{hit.title}</span>
                    {hit.oyelabs ? <Badge variant="brand">{OYELABS_BADGE}</Badge> : null}
                    {hit.published === false ? <Badge variant="outline">Draft</Badge> : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {courseSizeLine(hit)}
                    {line && line !== "Added" ? ` · ${line}` : ""}
                  </span>
                </span>
                {line === "Added" ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-summit">
                    <Check className="size-4" aria-hidden="true" />
                    Added
                  </span>
                ) : (
                  <Button type="button" variant="outline" size="sm" className="min-w-[3.5rem]" disabled={busy !== null} onClick={() => void add(hit)} aria-label={`Add ${hit.title}`}>
                    {busy === hit.courseId ? "Adding…" : hit.assigned ? "Update" : "Add"}
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

/** The button and dialog in the previous design. */
export function ClassicAddCourse(props: ClassicAddCourseProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <BookPlus className="size-4" aria-hidden="true" />
        {props.label ?? "Add a course"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="font-display text-base font-semibold">{props.onPick ? "Add a course to the plan" : `Add a course for ${props.name}`}</DialogTitle>
          <DialogDescription className="mb-3 text-sm text-muted-foreground">
            {props.onPick ? `${props.name} gets it once you send the test.` : "Oyelabs courses come first. Nobody loses a course they already have."}
          </DialogDescription>
          <PickerBody {...props} onDone={(message, ok) => (ok ? notify.success(message) : notify.error(`We couldn't add the course. ${message}`))} />
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
