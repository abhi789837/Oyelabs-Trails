import { useMemo } from "react";
import { ArrowLeft, Check, CircleDashed, Clock, Eye, Film, ShieldCheck, Text } from "lucide-react";
import { m } from "motion/react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import type { Course } from "@shared/courses";
import { isStaffRole } from "@shared/uiFlag";

import { ApiRequestError } from "@/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/v5/design/components/Button";
import { Card } from "@/v5/design/components/Card";
import { Badge } from "@/v5/design/components/Primitives";
import { EmptyState, ErrorState } from "@/v5/design/components/States";
import { transitions } from "@/v5/design/motion";
import type { CourseDetail } from "@shared/me";

import { CourseSkeleton } from "../skeletons";
import { PageFrame, V5Screen, formatMinutes, useApiData, useDelayed } from "../me/page";
import { previewCourseDetail } from "./coursePreview";
import { FormatChip, LessonsDone, OyelabsBadge, RecommendedBadge } from "./LibraryPage";
import { LEVEL_LABELS } from "./libraryLogic";

/**
 * `/learn/library/:courseId`: outcomes first, then skills, what to learn first (ticked when you
 * already have it), the syllabus, time, when the sources were last checked, and Start/Continue
 * into the lesson player.
 */
export default function CoursePage() {
  return (
    <V5Screen>
      <CourseScreen />
    </V5Screen>
  );
}

function CourseScreen() {
  const { courseId = "" } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  // "Preview as learner" from the admin editor: staff only, read from the admin copy, saves nothing.
  const preview = params.get("preview") === "1" && Boolean(user && isStaffRole(user.role));
  const learnerData = useApiData<{ course: CourseDetail }>(courseId && !preview ? `/api/v5/me/library/${encodeURIComponent(courseId)}` : null);
  const adminData = useApiData<{ course: Course }>(courseId && preview ? `/api/admin/courses/${encodeURIComponent(courseId)}` : null);
  const previewDetail = useMemo(() => (adminData.data ? { course: previewCourseDetail(adminData.data.course) } : null), [adminData.data]);
  const { error, loading, reload } = preview ? adminData : learnerData;
  const data = preview ? previewDetail : learnerData.data;
  const showSkeleton = useDelayed(loading && !data);
  const back = (
    <Link to="/learn/library" className="inline-flex min-h-6 items-center gap-1 rounded-sm text-small font-medium text-brand-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
      <ArrowLeft className="size-4" aria-hidden="true" /> Library
    </Link>
  );

  if (error && !data) {
    const missing = error instanceof ApiRequestError && error.status === 404;
    return (
      <PageFrame title={missing ? "We couldn't find that course" : "Course"} back={back}>
        {missing ? (
          <EmptyState title="This course isn't in your library" body="It may have been removed, or it isn't shared with your team. The library has everything you can open." />
        ) : (
          <ErrorState title="We couldn't load this course" onRetry={() => void reload()} retrying={loading} />
        )}
      </PageFrame>
    );
  }
  if (!data) {
    return (
      <PageFrame title={<span className="sr-only">Loading the course</span>} back={back}>
        {showSkeleton ? <CourseSkeleton /> : null}
      </PageFrame>
    );
  }

  const c = data.course;
  const started = c.doneCount > 0;
  const finished = c.lessonCount > 0 && c.doneCount >= c.lessonCount;
  const lessons = c.syllabus.flatMap((s) => s.lessons);
  // Principle 3 (small and finishable): once started, say how much is left, not only the total.
  const minutesLeftIn = lessons.filter((l) => !l.done).reduce((sum, l) => sum + l.minutes, 0);
  // "You are here": the lesson "Continue" opens (else the first open one) gets the mark's amber dot.
  const hereId = started && !finished ? ((lessons.find((l) => !l.done && l.href === c.nextLessonHref) ?? lessons.find((l) => !l.done))?.id ?? null) : null;

  return (
    <PageFrame title={c.title} lead={c.summary || undefined} back={back}>
      {preview ? (
        <div role="status" className="flex flex-wrap items-center gap-2 rounded-card border border-info/30 bg-info-soft px-4 py-2 text-small text-fg-1" data-testid="preview-banner">
          <Eye className="size-4 shrink-0" aria-hidden="true" />
          <span className="font-semibold">Preview.</span> This is what learners see. Nothing you do here is saved.
          <Link to={`/admin/library/${encodeURIComponent(c.id)}/${c.oyelabs ? "oyelabs" : "edit"}`} className="ml-auto font-medium text-brand-fg underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            Back to the editor
          </Link>
        </div>
      ) : null}
      {c.oyelabs ? (
        <p className="flex flex-wrap items-center gap-2 text-small text-fg-2">
          <OyelabsBadge />
          Made by Oyelabs for your team.
        </p>
      ) : null}
      <m.div className="grid gap-(--v5-gap) lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={transitions.calm}>
        <div className="flex min-w-0 flex-col gap-(--v5-gap) lg:gap-6">
          {c.outcomes.length ? (
            <Card>
              <h2 className="font-display text-h4 font-semibold">You'll be able to</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {c.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-body">
                    <Check className="mt-1 size-4 shrink-0 text-success-fg" aria-hidden="true" />
                    {o}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {c.skills.length || c.prerequisites.length ? (
            <Card className="flex flex-col gap-4">
              {c.skills.length ? (
                <section>
                  <h2 className="font-display text-h4 font-semibold">Skills</h2>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {c.skills.map((s) => (
                      <li key={s.id}>
                        <Badge tone="neutral">{s.name}</Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {c.prerequisites.length ? (
                <section>
                  <h2 className="font-display text-h4 font-semibold">Learn first</h2>
                  <p className="mt-1 text-small text-fg-2">Skills this course builds on. A tick means you already have it.</p>
                  <ul className="mt-2 flex flex-col gap-1.5" data-testid="course-prerequisites">
                    {c.prerequisites.map((p) => (
                      <li key={p.skillId} className="flex items-center gap-2 text-body">
                        {p.have ? <Check className="size-4 text-success-fg" aria-hidden="true" /> : <CircleDashed className="size-4 text-fg-3" aria-hidden="true" />}
                        <span>{p.name}</span>
                        <span className="text-small text-fg-2">{p.have ? `You have it (level ${p.level} of 5)` : p.level === null ? "Not checked yet" : `Level ${p.level} of 5`}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </Card>
          ) : null}

          <section aria-labelledby="syllabus-heading">
            <h2 id="syllabus-heading" className="font-display text-h3 font-semibold">
              What's inside
            </h2>
            <div className="mt-3 flex flex-col gap-4">
              {c.syllabus.map((section) => (
                <div key={section.id}>
                  {c.syllabus.length > 1 ? <h3 className="mb-2 font-display text-h4 font-semibold">{section.title}</h3> : null}
                  <ol className="flex flex-col gap-1.5">
                    {section.lessons.map((l) => (
                      <li key={l.id}>
                        <Link
                          to={l.href}
                          className="flex min-h-(--v5-row-h) items-center gap-3 rounded-control border border-line-1 bg-surface-1 px-3 py-2 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        >
                          {l.done ? (
                            <>
                              <Check className="size-4 shrink-0 text-success-fg" aria-hidden="true" />
                              <span className="sr-only">Done: </span>
                            </>
                          ) : l.id === hereId ? (
                            <>
                              <span className="grid size-4 shrink-0 place-items-center" aria-hidden="true">
                                <span className="size-2.5 rounded-full bg-progress" />
                              </span>
                              <span className="sr-only">You are here: </span>
                            </>
                          ) : (
                            <CircleDashed className="size-4 shrink-0 text-fg-3" aria-hidden="true" />
                          )}
                          <span className="min-w-0 flex-1 text-body">{l.title}</span>
                          {l.hasVideo ? <Film className="size-4 shrink-0 text-fg-3" aria-hidden="true" /> : <Text className="size-4 shrink-0 text-fg-3" aria-hidden="true" />}
                          <span className="sr-only">{l.hasVideo ? "Video lesson," : "Reading lesson,"}</span>
                          <span className="shrink-0 text-small tabular-nums text-fg-2">{formatMinutes(l.minutes)}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-(--v5-gap) lg:sticky lg:top-6 lg:self-start">
          <Card className="flex flex-col gap-3">
            {c.recommended ? (
              <div className="flex flex-col gap-1">
                <RecommendedBadge why={c.recommendedWhy} />
                {c.recommendedWhy ? <p className="text-small text-brand-fg">{c.recommendedWhy}</p> : null}
              </div>
            ) : null}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-small">
              <dt className="text-fg-2">Time</dt>
              <dd className="flex items-center gap-1 font-medium">
                <Clock className="size-3.5" aria-hidden="true" />
                {formatMinutes(c.minutes)}
              </dd>
              {started && !finished ? (
                <>
                  <dt className="text-fg-2">Left to do</dt>
                  <dd className="font-medium" data-testid="course-time-left">
                    {formatMinutes(minutesLeftIn)}
                  </dd>
                </>
              ) : null}
              <dt className="text-fg-2">Level</dt>
              <dd className="font-medium">{c.level ? LEVEL_LABELS[c.level] : "Any"}</dd>
              <dt className="text-fg-2">Lessons</dt>
              <dd className="font-medium">{lessons.length}</dd>
              <dt className="text-fg-2">Format</dt>
              <dd className="font-medium">
                <FormatChip format={c.format} />
              </dd>
              {c.department ? (
                <>
                  <dt className="text-fg-2">For</dt>
                  <dd className="font-medium">{c.department.name}</dd>
                </>
              ) : null}
            </dl>
            {started ? <LessonsDone done={c.doneCount} total={c.lessonCount} size={44} /> : null}
            {c.nextLessonHref ? (
              <Button asChild variant="primary" size="lg">
                <Link to={c.nextLessonHref}>{finished ? "Review it again" : started ? "Continue" : "Start"}</Link>
              </Button>
            ) : null}
            <p className="flex items-start gap-1.5 text-caption text-fg-2">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {c.sourcesVerifiedAt
                ? `Sources last checked ${new Date(c.sourcesVerifiedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}.`
                : c.sourceCount
                  ? `${c.sourceCount} reading links, checked by the content team.`
                  : "Written by your team."}
            </p>
          </Card>
        </aside>
      </m.div>
    </PageFrame>
  );
}
