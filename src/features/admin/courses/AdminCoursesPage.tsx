import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Plus, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";

import type { Course } from "@shared/courses";

import { ApiRequestError } from "@/api/client";
import { FormAlert, TextField } from "@/components/form/Field";
import { useFormDialog } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { accentClasses } from "@/lib/accent";
import { fadeUp, stagger, transition } from "@/lib/motion";
import { notify } from "@/lib/toast";
import { cn, formatMinutes, formatTimestamp } from "@/lib/utils";
import type { AccentToken } from "@/types/curriculum";
import { coursesApi } from "./api";

/**
 * Courses an admin writes by hand — an internal process, a runbook, how an incident is handled.
 *
 * Deliberately its own section rather than a seventh trail. A trail has levels, assessment coverage
 * and challenges that gate progress; a course has prose, a video and a tick-box. Presenting the two
 * as the same thing would make the trail's completion mean less, not the course's mean more.
 */
export default function AdminCoursesPage() {
  useDocumentTitle("Courses");
  const formDialog = useFormDialog();

  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [audience, setAudience] = useState<"all" | "everyone" | "assigned">("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await coursesApi.list(signal);
      setCourses(result.courses);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiRequestError ? err.message : "Could not load the courses.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const visible = (courses ?? []).filter((course) => {
    if (status === "published" && !course.published) return false;
    if (status === "draft" && course.published) return false;
    if (audience !== "all" && course.audience !== audience) return false;
    const query = search.trim().toLowerCase();
    if (query && !`${course.title} ${course.summary}`.toLowerCase().includes(query)) return false;
    return true;
  });
  const filtering = status !== "all" || audience !== "all" || search.trim() !== "";

  const handleCreate = async () => {
    const created = await formDialog({
      title: "New course",
      description:
        "A course is written by hand rather than generated: prose, a video and links. There is no quiz — a learner marks each lesson done themselves.",
      submitLabel: "Create",
      body: () => (
        <div className="space-y-4">
          <TextField name="title" label="Title" required autoFocus placeholder="How we handle an incident" maxLength={120} />
          <TextField
            name="summary"
            label="One line"
            placeholder="What to do, who to call, and in what order"
            maxLength={400}
          />
        </div>
      ),
      onSubmit: async (data) => {
        const title = String(data.get("title") ?? "").trim();
        if (title.length < 2) throw new Error("Give the course a title.");
        return coursesApi.create({
          title,
          summary: String(data.get("summary") ?? "").trim(),
          accent: "glacier",
          audience: "everyone",
          published: false,
        });
      },
    });
    if (!created) return;
    notify.success(`Created "${created.course.title}". It is a draft until you publish it.`);
    await load();
  };

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Courses</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Written by you, not generated. For the things only this company knows — a process, a runbook, an
            onboarding walkthrough. Lessons carry prose, a video and links; there is no quiz, so a learner marks each
            one done themselves.
          </p>
        </div>
        <Button onClick={() => void handleCreate()}>
          <Plus aria-hidden="true" />
          New course
        </Button>
      </div>

      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      {courses !== null && courses.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            leading={<Search aria-hidden="true" />}
            placeholder="Search courses"
            aria-label="Search courses"
            containerClassName="max-w-xs"
          />
          <Chip active={status === "all"} onClick={() => setStatus("all")}>
            All
          </Chip>
          <Chip active={status === "published"} onClick={() => setStatus("published")}>
            Published
          </Chip>
          <Chip active={status === "draft"} onClick={() => setStatus("draft")}>
            Drafts
          </Chip>
          <span aria-hidden="true" className="h-5 w-px bg-border" />
          <Chip active={audience === "all"} onClick={() => setAudience("all")}>
            Anyone
          </Chip>
          <Chip active={audience === "everyone"} onClick={() => setAudience("everyone")}>
            For everyone
          </Chip>
          <Chip active={audience === "assigned"} onClick={() => setAudience("assigned")}>
            Assigned
          </Chip>
          <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">
            {visible.length} of {courses.length}
          </span>
        </div>
      )}

      {courses === null ? (
        <p className="mt-10 text-sm text-muted-foreground" role="status">
          Loading…
        </p>
      ) : courses.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed px-6 py-16 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-display font-semibold">Nothing written yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            A course is the place for what the curriculum cannot know: your incident process, your release checklist,
            the walkthrough every new hire asks for.
          </p>
          <Button className="mt-5" onClick={() => void handleCreate()}>
            <Plus aria-hidden="true" />
            Write the first one
          </Button>
        </div>
      ) : (
        <motion.ul variants={stagger(0.04)} initial="hidden" animate="visible" className="mt-6 grid gap-4 lg:grid-cols-2">
          {visible.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              {filtering ? "No course matches those filters." : "Nothing to show."}
            </li>
          ) : (
            visible.map((course) => <CourseCard key={course.id} course={course} />)
          )}
        </motion.ul>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const accent = accentClasses[course.accent as AccentToken];
  const topics = course.sections.reduce((total, section) => total + section.topics.length, 0);
  const minutes = course.sections.reduce(
    (total, section) => total + section.topics.reduce((sum, topic) => sum + topic.estMinutes, 0),
    0,
  );

  return (
    <motion.li variants={fadeUp} transition={transition.base}>
      <Link
        to={`/admin/courses/${course.id}`}
        className={cn(
          "flex h-full flex-col rounded-lg border p-4 transition-colors hover:bg-surface-sunken/60",
          course.published ? accent.border : "border-dashed",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span aria-hidden="true" className={cn("mt-1 h-6 w-1.5 shrink-0 rounded-[2px]", accent.bg)} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-semibold">{course.title}</h2>
            {course.summary && <p className="mt-0.5 text-sm text-muted-foreground">{course.summary}</p>}
          </div>
          {/* A draft is the author's own; saying so is more useful than a green tick that means
              nothing until it is published. */}
          {course.published ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="outline">Draft</Badge>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
          <span>
            {course.sections.length} section{course.sections.length === 1 ? "" : "s"}
          </span>
          <span>
            {topics} lesson{topics === 1 ? "" : "s"}
          </span>
          {minutes > 0 && <span>{formatMinutes(minutes)}</span>}
          <span className="flex items-center gap-1">
            <Users className="size-3" aria-hidden="true" />
            {course.audience === "everyone" ? "everyone" : "assigned"}
          </span>
          <span className="ml-auto">edited {formatTimestamp(course.updatedAt)}</span>
        </div>

        {topics > 0 && <Progress value={100} className="mt-3 h-1" indicatorClassName={accent.bg} aria-hidden="true" />}
      </Link>
    </motion.li>
  );
}

/** A filter chip: dashed while it is doing nothing, solid once it is — the kit's own convention. */
function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
        active
          ? "border-foreground/30 bg-surface-sunken font-medium"
          : "border-dashed text-muted-foreground hover:bg-surface-sunken/60",
      )}
    >
      {children}
    </button>
  );
}
