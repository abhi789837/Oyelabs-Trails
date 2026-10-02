import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Send, Trash2, Undo2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { LEVEL_BANDS, LEVEL_BAND_LABELS, type LevelBand } from "@shared/catalog";
import type { Course, CourseLink, CourseSection, CourseTopic } from "@shared/courses";
import { youtubeId } from "@shared/courses";

import { ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { Field, FormAlert, TextField } from "@/components/form/Field";
import { useConfirm, useFormDialog } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { accentClasses } from "@/lib/accent";
import { fadeUp, stagger, transition } from "@/lib/motion";
import { notify } from "@/lib/toast";
import { cn, formatMinutesCompact } from "@/lib/utils";
import type { AccentToken } from "@/types/curriculum";
import { useCatalog } from "../catalog/useCatalog";
import { coursesApi } from "./api";

/**
 * Writing one course.
 *
 * Sections hold lessons; a lesson is prose, optionally a video and some links. Order is moved with
 * buttons rather than drag-and-drop: the lists are short, a button works with a keyboard and on a
 * phone without any extra code, and the server owns the order either way.
 *
 * Every save returns the whole course and replaces local state with it. That is a deliberate
 * trade — a slightly heavier response for an editor that can never end up showing an order the
 * server does not have.
 */
export default function AdminCourseEditorPage() {
  const { courseId = "" } = useParams();
  const confirm = useConfirm();
  const formDialog = useFormDialog();
  const { departmentOptions, departmentName } = useCatalog();

  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);

  useDocumentTitle(course ? course.title : "Course");

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const result = await coursesApi.get(courseId, signal);
        setCourse(result.course);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load that course.");
      }
    },
    [courseId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  /** Every mutation goes through here, so one error path and one busy flag serve all of them. */
  const run = async (work: () => Promise<{ course: Course }>) => {
    setBusy(true);
    setError(null);
    try {
      const result = await work();
      setCourse(result.course);
      return true;
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That didn't work.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (error && !course) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <FormAlert>{error}</FormAlert>
      </div>
    );
  }
  if (!course) {
    return (
      <p className="px-4 py-8 text-sm text-muted-foreground sm:px-6" role="status">
        Loading…
      </p>
    );
  }

  const accent = accentClasses[course.accent as AccentToken];
  const topicCount = course.sections.reduce((total, section) => total + section.topics.length, 0);

  const editCourse = async () => {
    const saved = await formDialog({
      title: "Course details",
      submitLabel: "Save",
      body: () => (
        <div className="space-y-4">
          <TextField name="title" label="Title" required defaultValue={course.title} maxLength={120} />
          <TextField name="summary" label="One line" defaultValue={course.summary} maxLength={400} />
          <Field label="Who it is for" hint="Everyone means every learner, including anyone onboarded later.">
            {({ id }) => (
              <select
                id={id}
                name="audience"
                defaultValue={course.audience}
                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
              >
                <option value="everyone">Everyone</option>
                <option value="assigned">Only people I assign</option>
              </select>
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Department" hint="Who sees it when it is for everyone.">
              {({ id, describedBy }) => (
                <select
                  id={id}
                  name="departmentId"
                  aria-describedby={describedBy}
                  defaultValue={course.departmentId ?? ""}
                  className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
                >
                  <option value="">All departments</option>
                  {/* The course's own department stays selectable even if it has since been archived. */}
                  {course.departmentId && !departmentOptions.some((o) => o.value === course.departmentId) && (
                    <option value={course.departmentId}>{departmentName(course.departmentId)}</option>
                  )}
                  {departmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Level">
              {({ id }) => (
                <select
                  id={id}
                  name="level"
                  defaultValue={course.level ?? ""}
                  className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
                >
                  <option value="">Any level</option>
                  {LEVEL_BANDS.map((band) => (
                    <option key={band} value={band}>
                      {LEVEL_BAND_LABELS[band]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </div>
      ),
      onSubmit: (data) => {
        const level = String(data.get("level") ?? "");
        const departmentId = String(data.get("departmentId") ?? "");
        return coursesApi.update(course.id, {
          title: String(data.get("title") ?? "").trim(),
          summary: String(data.get("summary") ?? "").trim(),
          accent: course.accent,
          audience: data.get("audience") === "assigned" ? "assigned" : "everyone",
          published: course.published,
          level: (LEVEL_BANDS as readonly string[]).includes(level) ? (level as LevelBand) : null,
          departmentId: departmentId || null,
        });
      },
    });
    if (saved) setCourse(saved.course);
  };

  const togglePublished = async () => {
    if (course.published) {
      const ok = await confirm({
        title: `Unpublish "${course.title}"?`,
        body: "It disappears from every learner's list. Nobody loses what they have already ticked off — it comes back if you publish it again.",
        confirmLabel: "Unpublish",
        variant: "destructive",
      });
      if (!ok) return;
    }
    const done = await run(() =>
      coursesApi.update(course.id, {
        title: course.title,
        summary: course.summary,
        accent: course.accent,
        audience: course.audience,
        published: !course.published,
      }),
    );
    if (done) {
      notify.success(
        course.published
          ? "Unpublished. Learners no longer see it."
          : course.audience === "everyone"
            ? "Published. Every learner sees it now."
            : "Published. The people you assign will see it.",
      );
    }
  };

  const addSection = async () => {
    const saved = await formDialog({
      title: "New section",
      submitLabel: "Add",
      body: () => (
        <div className="space-y-4">
          <TextField name="title" label="Title" required autoFocus placeholder="Before the incident" maxLength={120} />
          <TextField name="summary" label="One line" maxLength={400} />
        </div>
      ),
      onSubmit: (data) =>
        coursesApi.addSection(course.id, {
          title: String(data.get("title") ?? "").trim(),
          summary: String(data.get("summary") ?? "").trim(),
        }),
    });
    if (saved) setCourse(saved.course);
  };

  const moveSection = (index: number, delta: number) => {
    const ids = course.sections.map((s) => s.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void run(() => coursesApi.orderSections(course.id, { ids }));
  };

  return (
    <div className="px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/courses">
          <ArrowLeft aria-hidden="true" />
          Courses
        </Link>
      </Button>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className={cn("mt-1.5 h-8 w-1.5 shrink-0 rounded-[2px]", accent.bg)} />
          <div>
            <h1 className="font-display text-2xl font-bold">{course.title}</h1>
            {course.summary && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{course.summary}</p>}
            <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
              {course.published ? <Badge variant="success">Published</Badge> : <Badge variant="outline">Draft</Badge>}
              <span>
                {topicCount} lesson{topicCount === 1 ? "" : "s"}
              </span>
              <span>· {course.audience === "everyone" ? "everyone" : "assigned people only"}</span>
              <span>· {departmentName(course.departmentId).toLowerCase()}</span>
              {course.level && <span>· {LEVEL_BAND_LABELS[course.level].toLowerCase()}</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void editCourse()}>
            <Pencil aria-hidden="true" />
            Details
          </Button>
          <Button
            loading={busy}
            variant={course.published ? "ghost" : "default"}
            onClick={() => void togglePublished()}
            disabled={!course.published && topicCount === 0}
            title={!course.published && topicCount === 0 ? "Add a lesson first" : undefined}
          >
            {course.published ? <Undo2 aria-hidden="true" /> : <Send aria-hidden="true" />}
            {course.published ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </header>

      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      {!course.published && topicCount === 0 && (
        <p className="mt-6 rounded-md border border-trailmark/40 bg-trailmark/[0.06] px-4 py-3 text-sm">
          Add a section and at least one lesson before publishing — a published course with nothing in it puts a card
          on every learner's dashboard that opens onto nothing.
        </p>
      )}

      <motion.div variants={stagger(0.04)} initial="hidden" animate="visible" className="mt-8 space-y-6">
        {course.sections.map((section, index) => (
          <SectionBlock
            key={section.id}
            section={section}
            accentClass={accent.bg}
            busy={busy}
            first={index === 0}
            last={index === course.sections.length - 1}
            openTopicId={openTopicId}
            onToggleTopic={(id) => setOpenTopicId((current) => (current === id ? null : id))}
            onMove={(delta) => moveSection(index, delta)}
            onRun={run}
          />
        ))}
      </motion.div>

      <Button variant="outline" className="mt-6" onClick={() => void addSection()}>
        <Plus aria-hidden="true" />
        Add a section
      </Button>
    </div>
  );
}

function SectionBlock({
  section,
  accentClass,
  busy,
  first,
  last,
  openTopicId,
  onToggleTopic,
  onMove,
  onRun,
}: {
  section: CourseSection;
  accentClass: string;
  busy: boolean;
  first: boolean;
  last: boolean;
  openTopicId: string | null;
  onToggleTopic: (id: string) => void;
  onMove: (delta: number) => void;
  onRun: (work: () => Promise<{ course: Course }>) => Promise<boolean>;
}) {
  const confirm = useConfirm();
  const formDialog = useFormDialog();

  const editSection = async () => {
    const saved = await formDialog({
      title: "Section",
      submitLabel: "Save",
      body: () => (
        <div className="space-y-4">
          <TextField name="title" label="Title" required defaultValue={section.title} maxLength={120} />
          <TextField name="summary" label="One line" defaultValue={section.summary} maxLength={400} />
        </div>
      ),
      onSubmit: (data) =>
        coursesApi.updateSection(section.id, {
          title: String(data.get("title") ?? "").trim(),
          summary: String(data.get("summary") ?? "").trim(),
        }),
    });
    if (saved) await onRun(() => Promise.resolve(saved));
  };

  const removeSection = async () => {
    const ok = await confirm({
      title: `Delete "${section.title}"?`,
      body:
        section.topics.length > 0
          ? `Its ${section.topics.length} lesson${section.topics.length === 1 ? "" : "s"} go with it, and so does everyone's record of having read them.`
          : "It has no lessons in it.",
      confirmLabel: "Delete section",
      variant: "destructive",
    });
    if (!ok) return;
    await onRun(() => coursesApi.removeSection(section.id));
  };

  const addTopic = async () => {
    const saved = await formDialog({
      title: "New lesson",
      submitLabel: "Add",
      body: ({ pending }) => <TopicFields pending={pending} />,
      onSubmit: (data) => coursesApi.addTopic(section.id, readTopicForm(data)),
    });
    if (saved) await onRun(() => Promise.resolve(saved));
  };

  const moveTopic = (index: number, delta: number) => {
    const ids = section.topics.map((t) => t.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void onRun(() => coursesApi.orderTopics(section.id, { ids }));
  };

  return (
    <motion.section variants={fadeUp} transition={transition.base} className="rounded-lg border">
      <div className="flex flex-wrap items-start gap-3 border-b px-4 py-3">
        <span aria-hidden="true" className={cn("mt-1 h-5 w-1 shrink-0 rounded-[2px]", accentClass)} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-semibold">{section.title}</h2>
          {section.summary && <p className="mt-0.5 text-sm text-muted-foreground">{section.summary}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {/* Buttons rather than drag-and-drop: the lists are short, and this works with a keyboard
              and on a phone without any extra code. */}
          <Button variant="ghost" size="icon-sm" disabled={first || busy} onClick={() => onMove(-1)}>
            <ChevronUp aria-hidden="true" />
            <span className="sr-only">Move {section.title} up</span>
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={last || busy} onClick={() => onMove(1)}>
            <ChevronDown aria-hidden="true" />
            <span className="sr-only">Move {section.title} down</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => void editSection()}>
            <Pencil aria-hidden="true" />
            <span className="sr-only">Edit {section.title}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => void removeSection()}
          >
            <Trash2 aria-hidden="true" />
            <span className="sr-only">Delete {section.title}</span>
          </Button>
        </div>
      </div>

      {section.topics.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No lessons in this section yet.</p>
      ) : (
        <ul className="divide-y">
          {section.topics.map((topic, index) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              busy={busy}
              first={index === 0}
              last={index === section.topics.length - 1}
              open={openTopicId === topic.id}
              onToggle={() => onToggleTopic(topic.id)}
              onMove={(delta) => moveTopic(index, delta)}
              onRun={onRun}
            />
          ))}
        </ul>
      )}

      <div className="border-t px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => void addTopic()}>
          <Plus aria-hidden="true" />
          Add a lesson
        </Button>
      </div>
    </motion.section>
  );
}

function TopicRow({
  topic,
  busy,
  first,
  last,
  open,
  onToggle,
  onMove,
  onRun,
}: {
  topic: CourseTopic;
  busy: boolean;
  first: boolean;
  last: boolean;
  open: boolean;
  onToggle: () => void;
  onMove: (delta: number) => void;
  onRun: (work: () => Promise<{ course: Course }>) => Promise<boolean>;
}) {
  const confirm = useConfirm();
  const formDialog = useFormDialog();

  const editTopic = async () => {
    const saved = await formDialog({
      title: "Lesson",
      submitLabel: "Save",
      body: ({ pending }) => <TopicFields pending={pending} topic={topic} />,
      onSubmit: (data) => coursesApi.updateTopic(topic.id, readTopicForm(data)),
    });
    if (saved) await onRun(() => Promise.resolve(saved));
  };

  const removeTopic = async () => {
    const ok = await confirm({
      title: `Delete "${topic.title}"?`,
      body: "Everyone's record of having read it goes too.",
      confirmLabel: "Delete lesson",
      variant: "destructive",
    });
    if (!ok) return;
    await onRun(() => coursesApi.removeTopic(topic.id));
  };

  return (
    <li>
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
        <GripVertical className="size-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium">{topic.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-muted-foreground">
            <span>{formatMinutesCompact(topic.estMinutes)}</span>
            {topic.videoId && <span>· video</span>}
            {topic.links.length > 0 && (
              <span>
                · {topic.links.length} link{topic.links.length === 1 ? "" : "s"}
              </span>
            )}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" disabled={first || busy} onClick={() => onMove(-1)}>
            <ChevronUp aria-hidden="true" />
            <span className="sr-only">Move {topic.title} up</span>
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={last || busy} onClick={() => onMove(1)}>
            <ChevronDown aria-hidden="true" />
            <span className="sr-only">Move {topic.title} down</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => void editTopic()}>
            <Pencil aria-hidden="true" />
            <span className="sr-only">Edit {topic.title}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => void removeTopic()}
          >
            <Trash2 aria-hidden="true" />
            <span className="sr-only">Delete {topic.title}</span>
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition.fast}
            className="overflow-hidden"
          >
            <div className="border-t bg-surface-sunken/30 px-4 py-4">
              {/* What the learner will see, rendered the same way they will see it. */}
              {topic.body ? (
                <RichText text={topic.body} className="max-w-prose text-sm" />
              ) : (
                <p className="text-sm text-muted-foreground">No text yet.</p>
              )}
              {topic.videoId && (
                <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                  video: {topic.videoTitle ?? topic.videoId}
                </p>
              )}
              {topic.links.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {topic.links.map((link) => (
                    <li key={link.url}>
                      <span className="text-muted-foreground">{link.label} — </span>
                      <span className="font-mono text-[11px] break-all text-muted-foreground">{link.url}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/**
 * The lesson form.
 *
 * Uncontrolled, per the form dialog's contract: every field has a `name` and is read back from the
 * `FormData`. The links field is one per line, `Label | https://…`, which is quicker to write and
 * to paste than a repeating row of two inputs and needs no add/remove buttons.
 */
function TopicFields({ pending, topic }: { pending: boolean; topic?: CourseTopic }) {
  const [video, setVideo] = useState(topic?.videoId ?? "");
  const readable = video.trim().length === 0 || youtubeId(video) !== null;

  return (
    <div className="space-y-4">
      <TextField name="title" label="Title" required autoFocus defaultValue={topic?.title} maxLength={160} disabled={pending} />

      <Field label="What it says" hint="Plain text. Blank lines make paragraphs; `backticks` make code.">
        {({ id }) => (
          <textarea
            id={id}
            name="body"
            rows={10}
            defaultValue={topic?.body}
            disabled={pending}
            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            placeholder={"When an alert fires, the on-call engineer acknowledges it within five minutes.\n\nIf they cannot, it escalates to the team lead."}
          />
        )}
      </Field>

      <TextField
        name="video"
        label="Video"
        value={video}
        onChange={(e) => setVideo(e.target.value)}
        disabled={pending}
        placeholder="https://www.youtube.com/watch?v=…"
        error={readable ? undefined : "That doesn't look like a YouTube link."}
        hint={readable ? "Optional. A YouTube link, or the video id." : undefined}
      />
      <TextField name="videoTitle" label="Video title" defaultValue={topic?.videoTitle ?? ""} maxLength={160} disabled={pending} />

      <Field label="Links" hint="One per line, as `Label | https://example.com`.">
        {({ id }) => (
          <textarea
            id={id}
            name="links"
            rows={4}
            disabled={pending}
            defaultValue={(topic?.links ?? []).map((link) => `${link.label} | ${link.url}`).join("\n")}
            className="w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            placeholder="Runbook | https://wiki.example.com/runbook"
          />
        )}
      </Field>

      {/* A plain input, not `NumberField`: that one is controlled, and this dialog reads its fields
          back from the FormData rather than holding them in state. */}
      <Field label="How long it takes" hint="Minutes. Your estimate — nothing enforces it.">
        {({ id }) => (
          <input
            id={id}
            name="estMinutes"
            type="number"
            min={1}
            max={600}
            step={1}
            disabled={pending}
            defaultValue={topic?.estMinutes ?? 10}
            className="w-28 rounded-md border border-input bg-surface px-3 py-2 text-sm tabular focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
          />
        )}
      </Field>
    </div>
  );
}

/** Reads the lesson form back. Malformed link lines are skipped rather than failing the save. */
function readTopicForm(data: FormData) {
  const links: CourseLink[] = [];
  for (const line of String(data.get("links") ?? "").split("\n")) {
    const [label, ...rest] = line.split("|");
    const url = rest.join("|").trim();
    if (!label?.trim() || !url) continue;
    links.push({ label: label.trim().slice(0, 120), url: url.slice(0, 500) });
  }

  const minutes = Number(data.get("estMinutes"));
  return {
    title: String(data.get("title") ?? "").trim(),
    body: String(data.get("body") ?? ""),
    video: String(data.get("video") ?? "").trim() || undefined,
    videoTitle: String(data.get("videoTitle") ?? "").trim() || undefined,
    links: links.slice(0, 12),
    estMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.min(600, Math.trunc(minutes)) : 10,
  };
}
