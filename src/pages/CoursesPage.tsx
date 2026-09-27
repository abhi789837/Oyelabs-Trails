import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Check } from "lucide-react";
import { Link } from "react-router-dom";

import type { CourseCard } from "@shared/courses";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { accentClasses } from "@/lib/accent";
import { fadeUp, stagger, transition } from "@/lib/motion";
import { cn, formatMinutes } from "@/lib/utils";
import type { AccentToken } from "@/types/curriculum";

/**
 * The courses a learner has been given, outside their plan.
 *
 * Separate from the trail on purpose, and labelled as such. A trail topic is finished by passing a
 * graded challenge; a course lesson is finished by reading it and saying so. Both are worth doing;
 * showing them as the same thing would quietly redefine what "completed" means on the dashboard.
 */
export default function CoursesPage() {
  useDocumentTitle("Courses");

  const [courses, setCourses] = useState<CourseCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<{ courses: CourseCard[] }>("/api/me/courses", controller.signal)
      .then((result) => setCourses(result.courses))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load your courses.");
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Courses</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        How things are done here. These sit alongside your trail rather than on it — there is nothing to pass, you
        mark each lesson read when you have read it.
      </p>

      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      {courses === null ? (
        <p className="mt-10 text-sm text-muted-foreground" role="status">
          Loading…
        </p>
      ) : courses.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed px-6 py-16 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-display font-semibold">Nothing assigned</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            When someone writes up an internal process for the team, it appears here.
          </p>
        </div>
      ) : (
        <motion.ul variants={stagger(0.04)} initial="hidden" animate="visible" className="mt-8 grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <CourseTile key={course.id} course={course} />
          ))}
        </motion.ul>
      )}
    </div>
  );
}

function CourseTile({ course }: { course: CourseCard }) {
  const accent = accentClasses[course.accent as AccentToken];
  const done = course.topicCount > 0 && course.completedCount === course.topicCount;
  const pct = course.topicCount === 0 ? 0 : Math.round((course.completedCount / course.topicCount) * 100);

  return (
    <motion.li variants={fadeUp} transition={transition.base}>
      <Link
        to={`/courses/${course.id}`}
        className={cn(
          "flex h-full flex-col rounded-lg border p-5 transition-colors hover:bg-surface-sunken/60",
          done ? "border-summit/50" : accent.border,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span aria-hidden="true" className={cn("mt-1 h-6 w-1.5 shrink-0 rounded-[2px]", accent.bg)} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-semibold">{course.title}</h2>
            {course.summary && <p className="mt-1 text-sm text-muted-foreground">{course.summary}</p>}
          </div>
          {done && (
            <Badge variant="success" className="gap-1">
              <Check className="size-3" aria-hidden="true" />
              Read
            </Badge>
          )}
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-baseline justify-between text-xs text-muted-foreground">
            <span className="tabular">
              {course.completedCount} of {course.topicCount} lesson{course.topicCount === 1 ? "" : "s"}
            </span>
            {course.estMinutes > 0 && <span className="tabular">{formatMinutes(course.estMinutes)}</span>}
          </div>
          <Progress
            value={pct}
            className="mt-2 h-1.5"
            indicatorClassName={done ? "bg-summit" : accent.bg}
            aria-label={`${course.title} progress`}
          />
        </div>
      </Link>
    </motion.li>
  );
}
