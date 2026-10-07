import { BookOpen, ExternalLink, Link2Off, Loader2, Pencil, Plus, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { OYELABS_BADGE } from "@shared/oyelabsCourses";

import { coursesApi } from "@/features/admin/courses/api";
import { Badge, Button, Card, Dialog, EmptyState, ErrorState, Field, Input, StatusLine, v5Toast } from "@/v5/design";

import { v5AdminApi, type LibraryCourse, type LibraryStatus } from "../api";
import { formatDate, Page, PageHeader, plainMessage, Segmented, useLoad, useSlow } from "../parts/common";
import { LibrarySkeleton } from "../parts/Skeletons";

const STATUS: Record<LibraryStatus, { label: string; tone: "success" | "info" | "warning" | "neutral" | "outline" }> = {
  live: { label: "Live", tone: "success" },
  creating: { label: "Being created", tone: "info" },
  "needs-look": { label: "Needs a look", tone: "warning" },
  draft: { label: "Draft", tone: "outline" },
  "not-used": { label: "Not used", tone: "neutral" },
};

type Filter = "all" | "needs-look" | "live" | "draft";

/** v4.5: the server marks Oyelabs courses (`oyelabs`); `src/v5/admin/api.ts` is another phase's file. */
type Course = LibraryCourse & { oyelabs?: boolean };

/** Where Edit goes: Oyelabs courses have their own one-page editor. */
export function editHref(c: Course): string {
  return c.oyelabs ? `/admin/library/${c.id}/oyelabs` : `/admin/library/${c.id}/edit`;
}

/** One line about the links a course cites. */
export function sourceLine(s: LibraryCourse["sources"]): { text: string; broken: boolean } | null {
  if (s.total === 0) return null;
  const checked = s.lastVerifiedAt ? `last checked ${formatDate(s.lastVerifiedAt)}` : "not checked yet";
  if (s.broken > 0) return { text: `${s.broken} of ${s.total} links don't open any more · ${checked}`, broken: true };
  return { text: `${s.total} ${s.total === 1 ? "link" : "links"}, all working · ${checked}`, broken: false };
}

/** `/admin/library`: every course with its status, link health and the way to edit or preview it. */
export default function LibraryAdminPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const lib = useLoad((signal) => v5AdminApi.library(signal));
  const slow = useSlow(lib.loading && !lib.data);
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(params.get("new") === "1");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") setCreating(true);
  }, [params]);

  const courses = useMemo(() => {
    const all = lib.data?.courses ?? [];
    if (filter === "all") return all;
    if (filter === "draft") return all.filter((c) => c.status === "draft" || c.status === "creating");
    return all.filter((c) => c.status === filter);
  }, [lib.data, filter]);
  const needsLook = lib.data?.courses.filter((c) => c.status === "needs-look").length ?? 0;

  const create = async () => {
    if (title.trim().length < 2) {
      setError("Give it a name of at least 2 letters.");
      return;
    }
    setBusy("create");
    setError(null);
    try {
      const r = await coursesApi.create({ title: title.trim(), summary: "", accent: "glacier", audience: "everyone", published: false });
      const withPart = await coursesApi.addSection(r.course.id, { title: "Part 1", summary: "" });
      await coursesApi.addTopic(withPart.course.sections[0]!.id, { title: "First lesson", body: "", links: [], estMinutes: 10 });
      navigate(`/admin/library/${r.course.id}/edit`);
    } catch (err) {
      setError(plainMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const fix = async (c: LibraryCourse) => {
    setBusy(c.id);
    try {
      await v5AdminApi.fixCourse(c.id);
      v5Toast.success("Fixing it now. It comes back to the inbox if it still needs a look.");
      lib.reload();
    } catch (err) {
      v5Toast.error("That didn't work", plainMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page wide>
      <PageHeader
        title="Library"
        description="Every course people can learn from: written here, or made by our course writer."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/admin/library/oyelabs/new">
                <Plus aria-hidden="true" />
                Add Oyelabs course
              </Link>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" />
              Create course
            </Button>
          </div>
        }
      />

      {lib.data?.creating ? (
        <StatusLine tone="info" icon={<Loader2 className="motion-safe:animate-spin" />} className="mb-4">
          {lib.data.creating} new {lib.data.creating === 1 ? "course is" : "courses are"} being written. They appear here when they're ready.
        </StatusLine>
      ) : null}

      <Segmented<Filter>
        className="mb-4"
        label="Show"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All" },
          { value: "needs-look", label: `Needs a look${needsLook ? ` (${needsLook})` : ""}` },
          { value: "live", label: "Live" },
          { value: "draft", label: "Drafts" },
        ]}
      />

      {lib.error && !lib.data ? (
        <ErrorState body={plainMessage(lib.error)} onRetry={lib.reload} />
      ) : !lib.data ? (
        slow ? <LibrarySkeleton /> : null
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={filter === "all" ? "No courses yet" : "Nothing here"}
          body={filter === "all" ? "Start with Create course: give it a name, add lessons with your own videos, pick who gets it, then make it live." : "Try another tab."}
          action={
            filter === "all" ? (
              <Button variant="primary" onClick={() => setCreating(true)}>
                Create course
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-(--v5-gap) md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c: Course) => {
            const status = STATUS[c.status];
            const src = sourceLine(c.sources);
            return (
              <li key={c.id}>
                <Card className="flex h-full flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <h2 className="min-w-0 flex-1 font-display text-h4 font-semibold">{c.title}</h2>
                    {c.oyelabs ? <Badge tone="brand">{OYELABS_BADGE}</Badge> : null}
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  {c.reason ? <p className="text-small text-warning-fg">{c.reason}</p> : c.summary ? <p className="line-clamp-2 text-small text-fg-2">{c.summary}</p> : null}
                  <p className="text-caption text-fg-2">
                    {c.lessons} {c.lessons === 1 ? "lesson" : "lessons"}
                    {c.generated ? (
                      <>
                        {" · "}
                        <Sparkles className="inline size-3 align-baseline" aria-hidden="true" /> made by the course writer
                      </>
                    ) : null}
                    {c.versions ? ` · ${c.versions} saved ${c.versions === 1 ? "version" : "versions"}` : ""}
                  </p>
                  {src ? (
                    <p className={src.broken ? "flex items-center gap-1 text-caption text-warning-fg" : "text-caption text-fg-2"}>
                      {src.broken ? <Link2Off className="size-3.5" aria-hidden="true" /> : null}
                      {src.text}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {c.status === "needs-look" ? (
                      <Button variant="primary" size="sm" loading={busy === c.id} onClick={() => void fix(c)}>
                        <Wand2 aria-hidden="true" />
                        Fix automatically
                      </Button>
                    ) : null}
                    <Button variant={c.status === "needs-look" ? "secondary" : "primary"} size="sm" asChild>
                      <Link to={editHref(c)} aria-label={`Edit ${c.title}`}>
                        <Pencil aria-hidden="true" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/learn/library/${c.id}?preview=1`} target="_blank" rel="noopener" aria-label={`Preview ${c.title} as a learner (opens a new tab)`}>
                        <ExternalLink aria-hidden="true" />
                        Preview as learner
                      </Link>
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={creating}
        onOpenChange={(o) => {
          setCreating(o);
          if (!o && params.get("new")) setParams({}, { replace: true });
        }}
        title="Create a course"
        description="Give it a name. You'll write the lessons next; it stays a draft until you make it live."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Not now
            </Button>
            <Button variant="primary" loading={busy === "create"} onClick={() => void create()}>
              Create and start writing
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <Field label="Course name" error={error ?? undefined}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How we run a release" autoFocus />
          </Field>
        </form>
      </Dialog>
    </Page>
  );
}
