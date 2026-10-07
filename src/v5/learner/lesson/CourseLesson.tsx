import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Eye, ExternalLink, Undo2 } from "lucide-react";
import { m } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";

import type { Course, CourseTopic } from "@shared/courses";
import { isStaffRole } from "@shared/uiFlag";

import { api, ApiRequestError } from "@/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/v5/design/components/Button";
import { StatusLine, VideoPlayerFrame } from "@/v5/design/components/Lesson";
import { EmptyState, ErrorState, SkeletonLayout } from "@/v5/design/components/States";
import { transitions } from "@/v5/design/motion";

import { useApiData } from "../me/page";
import { blockTree } from "./article";
import { BlocksView } from "./LessonRich";
import { courseLessonHref, courseLessonNav, coursePageHref } from "./lessonLinks";

/** v4.5: an Oyelabs module (playlist from any drive, docs, notes, module test). Its own chunk. */
const ModuleLesson = lazy(() => import("./oyelabs/ModuleLesson"));

/**
 * A library course lesson in the lesson player: `/learn/lesson/:topicId?course=<courseId>`.
 *
 * Course lessons aren't curriculum topics (no steps, no graded test): a video, the lesson text
 * (with any quick checks and tasks the author added in the block editor), links, and "Mark as
 * done", which is the existing course API. `&preview=1` (staff only) reads the admin copy, so a
 * draft can be checked, shows a banner, and saves nothing.
 */
export default function CourseLesson({ courseId, topicId }: { courseId: string; topicId: string }) {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const preview = params.get("preview") === "1" && Boolean(user && isStaffRole(user.role));
  const url = preview ? `/api/admin/courses/${encodeURIComponent(courseId)}` : `/api/me/courses/${encodeURIComponent(courseId)}`;
  const { data, error, loading, reload, setData } = useApiData<{ course: Course; completedTopicIds?: string[] }>(url);

  const nav = useMemo(() => (data ? courseLessonNav<CourseTopic>(data.course, topicId) : null), [data, topicId]);
  useDocumentTitle(nav?.lesson.title ?? "Lesson");

  if (error && !data) {
    const missing = error instanceof ApiRequestError && error.status === 404;
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        {missing ? (
          <EmptyState title="This course isn't in your library" body="It may have been removed, or it isn't shared with your team." action={<LibraryButton />} />
        ) : (
          <ErrorState title="This lesson couldn't be loaded" body="Check your connection and try again." onRetry={() => void reload()} retrying={loading} />
        )}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <SkeletonLayout variant="article" rows={6} label="Loading the lesson" />
      </div>
    );
  }
  if (!nav) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState title="This lesson isn't in the course any more" body="The course has changed since the link was made." action={<Button variant="primary" asChild><Link to={coursePageHref(courseId, preview)}>Open the course</Link></Button>} />
      </div>
    );
  }

  const done = new Set(data.completedTopicIds ?? []);
  return (
    <CourseLessonView
      key={topicId}
      course={data.course}
      nav={nav}
      done={done.has(topicId)}
      preview={preview}
      onDoneChange={(ids) => setData({ ...data, completedTopicIds: ids })}
    onModulePassed={() => void reload()}
    />
  );
}

function LibraryButton() {
  return (
    <Button variant="primary" asChild>
      <Link to="/learn/library">Go to the library</Link>
    </Button>
  );
}

function CourseLessonView({
  course,
  nav,
  done,
  preview,
  onDoneChange,
  onModulePassed,
}: {
  course: Course;
  nav: NonNullable<ReturnType<typeof courseLessonNav<CourseTopic>>>;
  done: boolean;
  preview: boolean;
  onDoneChange: (completedTopicIds: string[]) => void;
  onModulePassed: () => void;
}) {
  const lesson = nav.lesson;
  const isModule = lesson.kind === "module";
  const blocks = useMemo(() => blockTree(lesson.body, [], new Set()), [lesson.body]);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const setDone = async (next: boolean) => {
    if (preview) return;
    setSaving(true);
    setProblem(null);
    try {
      const res = await api.post<{ completedTopicIds: string[] }>(`/api/me/courses/topics/${encodeURIComponent(lesson.id)}/complete`, { done: next });
      onDoneChange(res.completedTopicIds);
    } catch {
      setProblem("That didn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-surface-0 text-fg-1" data-testid="v5-course-lesson" data-preview={preview ? "on" : "off"}>
      {preview ? (
        <div role="status" className="flex flex-wrap items-center gap-2 border-b border-info/30 bg-info-soft px-4 py-2 text-small text-fg-1" data-testid="preview-banner">
          <Eye className="size-4 shrink-0" aria-hidden="true" />
          <span className="font-semibold">Preview.</span> This is what learners see. Nothing you do here is saved.
        </div>
      ) : null}
      <m.article className={`mx-auto flex w-full ${isModule ? "max-w-6xl" : "max-w-3xl"} flex-col gap-5 px-4 py-6 md:py-10`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={transitions.calm}>
        <Link
          to={coursePageHref(course.id, preview)}
          className="inline-flex min-h-6 items-center gap-1 self-start rounded-sm text-small font-medium text-brand-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {course.title}
        </Link>
        <header>
          <p className="text-small text-fg-2">
            Lesson {nav.number} of {nav.total}
            {nav.sectionTitle && course.sections.length > 1 ? ` in ${nav.sectionTitle}` : ""}, about {lesson.estMinutes} min
          </p>
          <h1 className="mt-1 font-display text-h1 font-semibold text-fg-1">{lesson.title}</h1>
        </header>

        {isModule ? (
          <Suspense fallback={<div className="aspect-video animate-pulse rounded-card bg-sunken" aria-busy="true" aria-label="Loading the module" />}>
            <ModuleLesson topicId={lesson.id} courseId={course.id} preview={preview} onPassed={onModulePassed} />
          </Suspense>
        ) : null}

        {!isModule && lesson.videoId ? (
          <CourseVideo key={lesson.videoId} videoId={lesson.videoId} title={lesson.videoTitle ?? lesson.title} />
        ) : null}

        {!isModule && blocks.length ? <BlocksView blocks={blocks} className="v5-article text-body leading-relaxed text-fg-1" /> : null}

        {lesson.links.length ? (
          <section aria-labelledby="lesson-links" className="flex flex-col gap-2">
            <h2 id="lesson-links" className="font-display text-h4 font-semibold">
              Read more
            </h2>
            <ul className="flex flex-col gap-1.5">
              {lesson.links.map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-6 items-center gap-1.5 rounded-sm text-body text-brand-fg underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {l.label} <ExternalLink className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-line-1 pt-4">
          {preview ? (
            <StatusLine tone="info" icon={<Eye />}>
              {isModule ? "Learners finish a module by passing its test. Nothing is saved in a preview." : `Learners finish a lesson with "Mark as done". It isn't saved in a preview.`}
            </StatusLine>
          ) : done && isModule ? (
            <StatusLine tone="success" icon={<CheckCircle2 />}>
              You've passed this module's test.
            </StatusLine>
          ) : done ? (
            <StatusLine
              tone="success"
              icon={<CheckCircle2 />}
              action={
                <Button size="sm" variant="ghost" onClick={() => void setDone(false)} disabled={saving}>
                  <Undo2 aria-hidden="true" /> Not done yet
                </Button>
              }
            >
              You've finished this lesson.
            </StatusLine>
          ) : null}
          {problem ? (
            <p role="alert" className="text-small text-danger-fg">
              {problem}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {nav.prev ? (
              <Button variant="ghost" asChild>
                <Link to={courseLessonHref(course.id, nav.prev.id, preview)}>
                  <ChevronLeft aria-hidden="true" /> Previous lesson
                </Link>
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap items-center gap-2">
              {!preview && !done && !isModule ? (
                <Button variant={nav.next ? "secondary" : "primary"} onClick={() => void setDone(true)} disabled={saving}>
                  <CheckCircle2 aria-hidden="true" /> Mark as done
                </Button>
              ) : null}
              {nav.next ? (
                <Button variant="primary" asChild>
                  <Link to={courseLessonHref(course.id, nav.next.id, preview)}>
                    Next lesson <ChevronRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button variant={done || preview ? "primary" : "ghost"} asChild>
                  <Link to={coursePageHref(course.id, preview)}>Back to the course</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </m.article>
    </div>
  );
}

/**
 * A course lesson's video behind a facade (Phase 9 performance): the thumbnail and a Play button,
 * and the YouTube embed (about 1.3 MB) only once Play is pressed. It then starts playing.
 */
function CourseVideo({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <VideoPlayerFrame title={title} ready={playing} onPlay={() => setPlaying(true)} poster={`https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`}>
      <iframe
        className="absolute inset-0 size-full"
        src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&autoplay=1&cc_load_policy=1&cc_lang_pref=en`}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </VideoPlayerFrame>
  );
}
