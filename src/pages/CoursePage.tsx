import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Check, ExternalLink, Link2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import type { Course, CourseTopic } from "@shared/courses";

import { api, ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { accentClasses } from "@/lib/accent";
import { fadeUp, stagger, transition } from "@/lib/motion";
import { cn, formatMinutesCompact } from "@/lib/utils";
import type { AccentToken } from "@/types/curriculum";

interface CourseResponse {
  course: Course;
  completedTopicIds: string[];
}

/**
 * Reading one course.
 *
 * Everything on one page rather than a lesson per route. A course is a handful of short lessons
 * that are usually read in one sitting, and a page per lesson would mean a navigation between every
 * two paragraphs. The video is the only part that loads on demand.
 *
 * There is nothing to pass here, so the only action is "I have read this". It is a real, reversible
 * statement by the learner — not a score — which is why it is counted separately from the plan
 * everywhere it appears.
 */
export default function CoursePage() {
  const { courseId = "" } = useParams();

  const [data, setData] = useState<CourseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyTopicId, setBusyTopicId] = useState<string | null>(null);

  useDocumentTitle(data ? data.course.title : "Course");

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<CourseResponse>(`/api/me/courses/${courseId}`, controller.signal)
      .then(setData)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load that course.");
      });
    return () => controller.abort();
  }, [courseId]);

  const completed = useMemo(() => new Set(data?.completedTopicIds ?? []), [data]);

  const toggle = useCallback(
    async (topic: CourseTopic) => {
      setBusyTopicId(topic.id);
      try {
        const result = await api.post<{ completedTopicIds: string[] }>(
          `/api/me/courses/topics/${topic.id}/complete`,
          { done: !completed.has(topic.id) },
        );
        setData((current) => (current ? { ...current, completedTopicIds: result.completedTopicIds } : current));
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Could not save that.");
      } finally {
        setBusyTopicId(null);
      }
    },
    [completed],
  );

  if (error && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <FormAlert>{error}</FormAlert>
        <Button asChild variant="ghost" size="sm" className="mt-4 -ml-2">
          <Link to="/courses">
            <ArrowLeft aria-hidden="true" />
            Courses
          </Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground sm:px-6" role="status">
        Loading…
      </p>
    );
  }

  const { course } = data;
  const accent = accentClasses[course.accent as AccentToken];
  const topics = course.sections.flatMap((section) => section.topics);
  const pct = topics.length === 0 ? 0 : Math.round((completed.size / topics.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/courses">
          <ArrowLeft aria-hidden="true" />
          Courses
        </Link>
      </Button>

      <header className="mt-4">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className={cn("mt-1.5 h-8 w-1.5 shrink-0 rounded-[2px]", accent.bg)} />
          <div>
            <h1 className="font-display text-2xl font-bold">{course.title}</h1>
            {course.summary && <p className="mt-1 text-sm text-muted-foreground">{course.summary}</p>}
          </div>
        </div>

        <div className="mt-5">
          <p className="flex items-baseline justify-between text-xs text-muted-foreground">
            <span className="tabular" aria-live="polite">
              {completed.size} of {topics.length} read
            </span>
            {pct === 100 && <span className="text-summit-strong">All read</span>}
          </p>
          <Progress
            value={pct}
            className="mt-2 h-1.5"
            indicatorClassName={pct === 100 ? "bg-summit" : accent.bg}
            aria-label="Course progress"
          />
        </div>
      </header>

      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      <motion.div variants={stagger(0.04)} initial="hidden" animate="visible" className="mt-10 space-y-12">
        {course.sections.map((section) => (
          <motion.section key={section.id} variants={fadeUp} transition={transition.base} aria-labelledby={section.id}>
            <h2 id={section.id} className="font-display text-lg font-semibold">
              {section.title}
            </h2>
            {section.summary && <p className="mt-1 text-sm text-muted-foreground">{section.summary}</p>}

            <ol className="mt-5 space-y-8">
              {section.topics.map((topic) => (
                <Lesson
                  key={topic.id}
                  topic={topic}
                  done={completed.has(topic.id)}
                  busy={busyTopicId === topic.id}
                  onToggle={() => void toggle(topic)}
                />
              ))}
            </ol>
          </motion.section>
        ))}
      </motion.div>
    </div>
  );
}

function Lesson({
  topic,
  done,
  busy,
  onToggle,
}: {
  topic: CourseTopic;
  done: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <li className={cn("rounded-lg border p-5 transition-colors", done && "border-summit/40 bg-summit/[0.04]")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display font-semibold">{topic.title}</h3>
        <span className="font-mono text-[11px] text-muted-foreground">{formatMinutesCompact(topic.estMinutes)}</span>
      </div>

      {topic.body && <RichText text={topic.body} className="mt-3 max-w-prose text-sm leading-relaxed" />}

      {topic.videoId && (
        <div className="mt-5">
          {/* The same embed the curriculum uses: YouTube's player is built for this, and it is the
              only third-party frame that reliably loads. `loading="lazy"` so a course with five
              videos does not open five players at once. */}
          <div className="aspect-video overflow-hidden rounded-md border bg-editor">
            <iframe
              src={`https://www.youtube.com/embed/${topic.videoId}`}
              title={topic.videoTitle ?? topic.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          {topic.videoTitle && <p className="mt-1.5 text-xs text-muted-foreground">{topic.videoTitle}</p>}
        </div>
      )}

      {topic.links.length > 0 && (
        <ul className="mt-5 space-y-1.5">
          {topic.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm underline decoration-primary decoration-2 underline-offset-4"
              >
                <Link2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                {link.label}
                <ExternalLink className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center gap-3 border-t pt-4">
        <Button variant={done ? "ghost" : "outline"} size="sm" loading={busy} onClick={onToggle}>
          {done ? "Mark as unread" : "I have read this"}
        </Button>
        {done && (
          <Badge variant="success" className="gap-1">
            <Check className="size-3" aria-hidden="true" />
            Read
          </Badge>
        )}
      </div>
    </li>
  );
}
