import { BookPlus, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { coursesApi } from "@/features/admin/courses/api";
import { Badge, Button, Dialog, Input, SkeletonLayout, v5Toast } from "@/v5/design";

import { v5AdminApi, type LibraryCourse } from "../api";
import { withAssignee } from "../library/audience";
import { plainMessage, useLoad } from "../parts/common";

/** What happens for the learner once they're on the course's list. */
function addedLine(c: LibraryCourse, name: string): string {
  if (c.status !== "live") return `Added ${name}. They'll see it once you make it live.`;
  if (c.audience === "everyone") return `Added ${name}. It's for everyone already, so it was in their Library.`;
  return `Added ${name}. It's in their Library now.`;
}

/**
 * The People sheet's "Add a course" (v5.0.1): pick one of the courses written here, and this person
 * joins the people who get it. Reads the current list first and only ever adds to it.
 */
export function AddCourse({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const lib = useLoad((signal) => (open ? v5AdminApi.library(signal) : Promise.resolve(null)), open);

  const courses = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return (lib.data?.courses ?? []).filter((c) => !c.generated && c.status !== "not-used").filter((c) => words.every((w) => c.title.toLowerCase().includes(w)));
  }, [lib.data, query]);

  const add = async (c: LibraryCourse) => {
    setBusy(c.id);
    try {
      const { userIds } = await coursesApi.getAssignees(c.id);
      const next = withAssignee(userIds, userId);
      if (next) await coursesApi.setAssignees(c.id, next);
      setAdded((cur) => new Set(cur).add(c.id));
      if (next) v5Toast.success(addedLine(c, name));
      else v5Toast.info(`${name} already has "${c.title}".`);
    } catch (error) {
      v5Toast.error("We couldn't add the course", plainMessage(error));
    } finally {
      setBusy(null);
    }
  };

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
        description="They join the people who get it. Nobody else loses it."
        footer={
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <Input type="search" aria-label="Find a course" placeholder="Find a course" value={query} onChange={(e) => setQuery(e.target.value)} className="text-small" />
          {lib.error && !lib.data ? (
            <p role="alert" className="flex flex-wrap items-center gap-2 text-small text-fg-2">
              {plainMessage(lib.error)}
              <Button variant="secondary" size="sm" onClick={lib.reload}>
                Try again
              </Button>
            </p>
          ) : !lib.data ? (
            <SkeletonLayout variant="list" rows={3} label="Loading courses" />
          ) : courses.length === 0 ? (
            <p className="text-small text-fg-2">
              {query ? "No course matches that." : "No courses written here yet."}{" "}
              <Link to="/admin/library?new=1" className="font-medium text-brand-fg underline">
                Create course
              </Link>
            </p>
          ) : (
            <ul className="flex max-h-72 flex-col divide-y divide-line-1 overflow-y-auto rounded-card border border-line-1" aria-label="Courses">
              {courses.map((c) => (
                <li key={c.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 text-small">
                    <span className="block truncate font-medium text-fg-1">{c.title}</span>
                    <span className="text-caption text-fg-2">
                      {c.lessons} {c.lessons === 1 ? "lesson" : "lessons"}, {c.audience === "everyone" ? "for everyone" : "for people you pick"}
                    </span>
                  </span>
                  {c.status !== "live" ? <Badge tone="outline">Draft</Badge> : null}
                  {added.has(c.id) ? (
                    <span className="inline-flex items-center gap-1 text-small font-medium text-success-fg">
                      <Check className="size-4" aria-hidden="true" />
                      Added
                    </span>
                  ) : (
                    <Button variant="secondary" size="sm" loading={busy === c.id} disabled={busy !== null && busy !== c.id} onClick={() => void add(c)} aria-label={`Add ${c.title}`}>
                      Add
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Dialog>
    </>
  );
}
