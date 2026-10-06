import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { Bold, Code2, ExternalLink, History, Italic, List, ListChecks, ListOrdered, ClipboardList, PlayCircle, Plus, Save, Text, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import type { Course, CourseLink, CourseTopic } from "@shared/courses";

import { RichText } from "@/components/content/RichText";
import { coursesApi } from "@/features/admin/courses/api";
import { Badge, Button, Card, Dialog, ErrorState, Input, Sheet, Skeleton, SkeletonLayout, Tooltip, cn, v5Toast } from "@/v5/design";

import { v5AdminApi, type VersionMeta } from "../../api";
import { BiggerScreenNote } from "../../parts/BiggerScreen";
import { formatDateTime, Page, PageHeader, plainMessage, useLoad } from "../../parts/common";
import { EditorSkeleton } from "../../parts/Skeletons";
import { withoutTopic } from "./courseOps";
import { docToLesson, EMPTY_QUIZ, EMPTY_TASK, lessonToDoc, type PMDoc } from "./blocks";
import { QuizBlock, TaskBlock, VideoBlock } from "./nodes";
import { lessonStarterKit } from "./schema";

/**
 * `/admin/library/:courseId/edit`: a block editor for one lesson at a time (video, reading, code,
 * quick check, task), saved through the same course API as the older editor. Every save is
 * followed by a version snapshot, and "Version history" can preview and restore any of them.
 *
 * Tiptap (MIT parts only: core, react, starter-kit, pm) is loaded with this route only.
 */

function firstTopic(course: Course): CourseTopic | null {
  for (const s of course.sections) if (s.topics[0]) return s.topics[0];
  return null;
}

function findTopic(course: Course | null, id: string | null): CourseTopic | null {
  if (!course || !id) return null;
  for (const s of course.sections) {
    const t = s.topics.find((x) => x.id === id);
    if (t) return t;
  }
  return null;
}

export default function CourseEditPage() {
  const { courseId = "" } = useParams();
  const courseLoad = useLoad((signal) => coursesApi.get(courseId, signal), courseId);
  const [course, setCourse] = useState<Course | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versionsKey, setVersionsKey] = useState(0);
  // The open lesson has unsaved changes: "Make it live" steps back to secondary while Save is the primary.
  const [lessonDirty, setLessonDirty] = useState(false);

  useEffect(() => {
    if (!courseLoad.data) return;
    setCourse(courseLoad.data.course);
    setTopicId((cur) => (findTopic(courseLoad.data!.course, cur) ? cur : (firstTopic(courseLoad.data!.course)?.id ?? null)));
  }, [courseLoad.data]);

  const topic = findTopic(course, topicId);
  const reloadCourse = courseLoad.reload;

  const addLesson = async (sectionId: string) => {
    try {
      const r = await coursesApi.addTopic(sectionId, { title: "New lesson", body: "", links: [], estMinutes: 10 });
      setCourse(r.course);
      const added = r.course.sections.find((s) => s.id === sectionId)?.topics.at(-1);
      if (added) setTopicId(added.id);
      void v5AdminApi.snapshot(courseId).then(() => setVersionsKey((k) => k + 1));
    } catch (error) {
      v5Toast.error("We couldn't add a lesson", plainMessage(error));
    }
  };

  const addSection = async () => {
    try {
      const r = await coursesApi.addSection(courseId, { title: `Part ${(course?.sections.length ?? 0) + 1}`, summary: "" });
      setCourse(r.course);
    } catch (error) {
      v5Toast.error("We couldn't add a part", plainMessage(error));
    }
  };

  const removeLesson = async (t: CourseTopic) => {
    // Gone from the list at once; put back if the server says no.
    const prevCourse = course;
    const prevTopic = topicId;
    if (course) {
      const next = withoutTopic(course, t.id);
      setCourse(next);
      if (topicId === t.id) setTopicId(firstTopic(next)?.id ?? null);
    }
    try {
      const before = await v5AdminApi.snapshot(courseId, "Before removing a lesson");
      const r = await coursesApi.removeTopic(t.id);
      setCourse(r.course);
      if (topicId === t.id) setTopicId(firstTopic(r.course)?.id ?? null);
      await v5AdminApi.snapshot(courseId);
      setVersionsKey((k) => k + 1);
      v5Toast.undo(`Removed "${t.title}".`, () => {
        void v5AdminApi.restore(courseId, before.version).then(
          () => {
            reloadCourse();
            setVersionsKey((k) => k + 1);
          },
          (error: unknown) => v5Toast.error("We couldn't bring it back", `${plainMessage(error)} It's still in Version history.`),
        );
      });
    } catch (error) {
      setCourse(prevCourse);
      setTopicId(prevTopic);
      v5Toast.error("We couldn't remove that lesson", `${plainMessage(error)} It's back in the list.`);
    }
  };

  const togglePublished = async () => {
    if (!course) return;
    try {
      const r = await coursesApi.update(course.id, {
        title: course.title,
        summary: course.summary,
        accent: course.accent,
        audience: course.audience,
        published: !course.published,
        level: course.level,
        departmentId: course.departmentId,
      });
      setCourse(r.course);
      await v5AdminApi.snapshot(courseId).catch(() => null);
      setVersionsKey((k) => k + 1);
      v5Toast.success(r.course.published ? "It's live. Learners can see it." : "It's a draft again. Learners can't see it.");
    } catch (error) {
      v5Toast.error("That didn't work", plainMessage(error));
    }
  };

  if (courseLoad.error && !course) {
    return (
      <Page>
        <ErrorState body={plainMessage(courseLoad.error)} onRetry={reloadCourse} />
      </Page>
    );
  }
  if (!course) {
    return (
      <Page wide>
        <EditorSkeleton />
      </Page>
    );
  }

  return (
    <Page wide>
      <BiggerScreenNote id="course-editor" className="mb-4" body="You can fix a typo here, but writing lessons is easier on a tablet or a computer." />
      <PageHeader
        title={course.title}
        description={course.published ? "Live: learners can see it." : "Draft: learners can't see it yet."}
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/learn/library/${course.id}?preview=1`} target="_blank" rel="noopener">
                <ExternalLink aria-hidden="true" />
                Preview as learner
              </Link>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)}>
              <History aria-hidden="true" />
              Version history
            </Button>
            {/* On a saved draft, going live is the next step, so it's the primary (UX review Ed1). */}
            <Button variant={!course.published && !lessonDirty ? "primary" : "secondary"} size="sm" onClick={() => void togglePublished()}>
              {course.published ? "Make it a draft" : "Make it live"}
            </Button>
          </>
        }
      />
      <div className="grid gap-(--v5-gap) lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Lessons in this course" className="flex flex-col gap-3">
          {course.sections.map((s) => (
            <div key={s.id}>
              <p className="px-2 pb-1 text-caption font-semibold text-fg-2">{s.title}</p>
              <ul className="flex flex-col gap-0.5">
                {s.topics.map((t) => (
                  <li key={t.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      aria-current={t.id === topicId ? "true" : undefined}
                      onClick={() => setTopicId(t.id)}
                      className={cn("min-h-8 flex-1 truncate rounded-control px-2 text-left text-small", t.id === topicId ? "bg-brand-soft text-brand-fg" : "text-fg-1 hover:bg-sunken")}
                    >
                      {t.title}
                    </button>
                    <Tooltip content="Remove this lesson">
                      <Button variant="ghost" size="icon" className="size-8 opacity-60 group-hover:opacity-100" aria-label={`Remove ${t.title}`} onClick={() => void removeLesson(t)}>
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </Tooltip>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" className="mt-1" onClick={() => void addLesson(s.id)}>
                <Plus aria-hidden="true" />
                Add a lesson
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" className="self-start" onClick={() => void addSection()}>
            <Plus aria-hidden="true" />
            Add a part
          </Button>
        </nav>

        <div className="min-w-0">
          {topic ? (
            <LessonEditor
              key={topic.id}
              courseId={course.id}
              topic={topic}
              onDirtyChange={setLessonDirty}
              onSaved={(next, version) => {
                setCourse(next);
                setVersionsKey((k) => k + 1);
                v5Toast.success(version ? `Saved. This is version ${version}.` : "Saved.");
              }}
            />
          ) : (
            <Card>
              <p className="text-small text-fg-2">{course.sections.length ? "Add a lesson to start writing." : "Add a part, then a lesson, to start writing."}</p>
            </Card>
          )}
        </div>
      </div>

      <VersionHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        courseId={course.id}
        refreshKey={versionsKey}
        onRestored={() => {
          reloadCourse();
          setVersionsKey((k) => k + 1);
        }}
      />
    </Page>
  );
}

// ---------------------------------------------------------------------------
// One lesson
// ---------------------------------------------------------------------------

function ToolbarButton({ label, icon, active, onClick }: { label: string; icon: ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <Tooltip content={label}>
      <Button variant="ghost" size="icon" className={cn("size-8", active && "bg-brand-soft text-brand-fg")} aria-label={label} aria-pressed={active} onClick={onClick}>
        {icon}
      </Button>
    </Tooltip>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({ bold: e.isActive("bold"), italic: e.isActive("italic"), code: e.isActive("code"), bullet: e.isActive("bulletList"), ordered: e.isActive("orderedList") }),
  });
  /** New blocks go after the current top-level block, never inside a list item. */
  const insert = (content: object) => {
    const { $from } = editor.state.selection;
    const pos = $from.depth >= 1 ? $from.after(1) : editor.state.doc.content.size;
    editor.chain().focus().insertContentAt(pos, content).run();
  };
  return (
    <div role="toolbar" aria-label="Formatting and blocks" className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 rounded-control border border-line-1 bg-surface-1 p-1">
      <ToolbarButton label="Bold" icon={<Bold />} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton label="Emphasis" icon={<Italic />} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton label="Code in a sentence" icon={<Code2 />} active={state.code} onClick={() => editor.chain().focus().toggleCode().run()} />
      <ToolbarButton label="Bulleted list" icon={<List />} active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton label="Numbered list" icon={<ListOrdered />} active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <span className="mx-1 h-5 w-px bg-line-1" aria-hidden="true" />
      <span className="px-1 text-caption text-fg-2">Add</span>
      <Button variant="ghost" size="sm" onClick={() => insert({ type: "videoBlock" })}>
        <PlayCircle aria-hidden="true" />
        Video
      </Button>
      <Button variant="ghost" size="sm" onClick={() => insert({ type: "paragraph" })}>
        <Text aria-hidden="true" />
        Reading
      </Button>
      <Button variant="ghost" size="sm" onClick={() => insert({ type: "codeBlock", attrs: { language: "js" } })}>
        <Code2 aria-hidden="true" />
        Code
      </Button>
      <Button variant="ghost" size="sm" onClick={() => insert({ type: "quizBlock", attrs: { ...EMPTY_QUIZ } })}>
        <ListChecks aria-hidden="true" />
        Quick check
      </Button>
      <Button variant="ghost" size="sm" onClick={() => insert({ type: "taskBlock", attrs: { ...EMPTY_TASK } })}>
        <ClipboardList aria-hidden="true" />
        Task
      </Button>
    </div>
  );
}

function LessonEditor({ courseId, topic, onSaved, onDirtyChange }: { courseId: string; topic: CourseTopic; onSaved: (course: Course, version: number | null) => void; onDirtyChange?: (dirty: boolean) => void }) {
  const [title, setTitle] = useState(topic.title);
  const [minutes, setMinutes] = useState(String(topic.estMinutes));
  const [links, setLinks] = useState<CourseLink[]>(topic.links);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial = useMemo(() => lessonToDoc({ body: topic.body, videoId: topic.videoId, videoTitle: topic.videoTitle }), [topic]);

  const editor = useEditor({
    extensions: [lessonStarterKit, VideoBlock, QuizBlock, TaskBlock],
    content: initial,
    editorProps: { attributes: { role: "textbox", "aria-multiline": "true", "aria-label": "Lesson content", class: "v5-article min-h-64 rounded-card border border-line-1 bg-surface-1 px-4 py-3 text-body text-fg-1 outline-none focus-visible:border-focus [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-control [&_pre]:bg-sunken [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-small [&_ul]:list-disc [&_ul]:pl-6" } },
    onUpdate: () => setDirty(true),
  });

  const save = useCallback(async () => {
    if (!editor || saving) return;
    const out = docToLesson(editor.getJSON() as PMDoc);
    const est = Math.min(600, Math.max(1, Number.parseInt(minutes, 10) || 10));
    if (title.trim().length < 2) {
      setError("Give the lesson a title of at least 2 letters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await coursesApi.updateTopic(topic.id, {
        title: title.trim(),
        body: out.body,
        video: out.video,
        videoTitle: out.videoTitle,
        links: links.filter((l) => l.label.trim() && l.url.trim()),
        estMinutes: est,
      });
      const snap = await v5AdminApi.snapshot(courseId).catch(() => null);
      setDirty(false);
      for (const w of out.warnings) v5Toast.info(w);
      onSaved(r.course, snap?.version ?? null);
    } catch (err) {
      setError(plainMessage(err, "We couldn't save. Your changes are still here. Try again."));
    } finally {
      setSaving(false);
    }
  }, [editor, saving, minutes, title, topic.id, links, courseId, onSaved]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  // Unmounting (another lesson picked) leaves nothing unsaved behind in the header.
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  // Ctrl/⌘+S saves.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-60 flex-1 flex-col gap-1 text-small font-medium">
          Lesson title
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
          />
        </label>
        <label className="flex w-28 flex-col gap-1 text-small font-medium">
          Minutes
          <Input
            type="number"
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => {
              setMinutes(e.target.value);
              setDirty(true);
            }}
          />
        </label>
        <Button variant={dirty ? "primary" : "secondary"} onClick={() => void save()} loading={saving} disabled={!dirty}>
          <Save aria-hidden="true" />
          {dirty ? "Save" : "Saved"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-small font-medium text-danger-fg">
          {error}
        </p>
      ) : null}
      {editor ? <Toolbar editor={editor} /> : <Skeleton className="h-10 w-full" />}
      {editor ? <EditorContent editor={editor} /> : <Skeleton className="h-64 w-full" />}
      <LinksEditor
        links={links}
        onChange={(next) => {
          setLinks(next);
          setDirty(true);
        }}
      />
    </div>
  );
}

function LinksEditor({ links, onChange }: { links: CourseLink[]; onChange: (links: CourseLink[]) => void }) {
  return (
    <fieldset className="flex flex-col gap-2 rounded-card border border-line-1 p-3">
      <legend className="px-1 text-small font-semibold">Links to read</legend>
      {links.map((l, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <Input aria-label={`Link ${i + 1} name`} placeholder="Name" value={l.label} onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="w-48 text-small" />
          <Input aria-label={`Link ${i + 1} address`} placeholder="https://…" value={l.url} onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} className="min-w-48 flex-1 text-small" />
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Remove link ${i + 1}`} onClick={() => onChange(links.filter((_, j) => j !== i))}>
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ))}
      {links.length < 12 ? (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => onChange([...links, { label: "", url: "" }])}>
          <Plus aria-hidden="true" />
          Add a link
        </Button>
      ) : null}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Version history
// ---------------------------------------------------------------------------

function VersionHistory({ open, onOpenChange, courseId, refreshKey, onRestored }: { open: boolean; onOpenChange: (open: boolean) => void; courseId: string; refreshKey: number; onRestored: () => void }) {
  const versions = useLoad((signal) => (open ? v5AdminApi.versions(courseId, signal) : Promise.resolve({ versions: [] as VersionMeta[] })), `${courseId}:${refreshKey}:${open}`);
  const [preview, setPreview] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);
  const shown = useLoad((signal) => (preview ? v5AdminApi.version(courseId, preview, signal) : Promise.resolve(null)), `${courseId}:${preview}`);
  const list = versions.data?.versions ?? [];
  const latest = list[0]?.version ?? null;

  const restore = async (version: number) => {
    setRestoring(true);
    try {
      const r = await v5AdminApi.restore(courseId, version);
      setConfirm(null);
      setPreview(null);
      onRestored();
      const undoTo = latest !== null && r.version > latest ? r.version - 1 : null;
      if (undoTo) {
        v5Toast.undo(`Restored version ${version}.`, () => {
          void v5AdminApi.restore(courseId, undoTo).then(onRestored);
        });
      } else {
        v5Toast.success(`Restored version ${version}.`);
      }
    } catch (error) {
      v5Toast.error("We couldn't restore that version", plainMessage(error));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} title="Version history" description="A new version is kept every time you save." width="lg">
        {versions.error ? (
          <ErrorState body={plainMessage(versions.error)} onRetry={versions.reload} />
        ) : !versions.data ? (
          <SkeletonLayout variant="list" rows={4} label="Loading versions" />
        ) : list.length === 0 ? (
          <p className="text-small text-fg-2">No versions yet. Save a lesson to keep the first one.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <ol className="flex flex-col divide-y divide-line-1 rounded-card border border-line-1" aria-label="Versions, newest first">
              {list.map((v) => (
                <li key={v.version} className={cn("flex flex-wrap items-center gap-2 px-3 py-2", preview === v.version && "bg-brand-soft")}>
                  <span className="min-w-0 flex-1 text-small">
                    <span className="font-semibold">Version {v.version}</span>
                    {v.version === latest ? (
                      <Badge tone="success" className="ml-2">
                        Now
                      </Badge>
                    ) : null}
                    <span className="block text-fg-2">
                      {formatDateTime(v.createdAt)}
                      {v.createdByName ? ` · ${v.createdByName}` : ""}
                      {v.note ? ` · ${v.note}` : ""} · {v.lessons} {v.lessons === 1 ? "lesson" : "lessons"}
                    </span>
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setPreview(preview === v.version ? null : v.version)} aria-expanded={preview === v.version}>
                    {preview === v.version ? "Hide" : "Preview"}
                  </Button>
                  {v.version !== latest ? (
                    <Button variant="secondary" size="sm" onClick={() => setConfirm(v.version)}>
                      Restore
                    </Button>
                  ) : null}
                </li>
              ))}
            </ol>
            {preview ? (
              <section aria-label={`Version ${preview}`} className="rounded-card border border-line-1 p-3">
                {shown.data?.course ? (
                  <div className="flex flex-col gap-4">
                    <h3 className="font-display text-h4 font-semibold">{shown.data.course.title}</h3>
                    {shown.data.course.sections.map((s) => (
                      <div key={s.id} className="flex flex-col gap-3">
                        <p className="text-caption font-semibold text-fg-2">{s.title}</p>
                        {s.topics.map((t) => (
                          <article key={t.id} className="rounded-control bg-sunken p-3">
                            <h4 className="mb-1 text-small font-semibold">{t.title}</h4>
                            {t.videoId ? <p className="mb-1 text-caption text-fg-2">Video: {t.videoTitle || t.videoId}</p> : null}
                            {t.body ? <RichText text={t.body} /> : <p className="text-small text-fg-2">No text.</p>}
                          </article>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Skeleton className="h-32 w-full" />
                )}
              </section>
            ) : null}
          </div>
        )}
      </Sheet>
      <Dialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Restore version ${confirm ?? ""}?`}
        description="The course goes back to how it was then. What it looks like now is kept as a version, so you can come back to it."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Keep it as it is
            </Button>
            <Button variant="primary" loading={restoring} onClick={() => confirm !== null && void restore(confirm)}>
              Restore version {confirm}
            </Button>
          </>
        }
      />
    </>
  );
}
