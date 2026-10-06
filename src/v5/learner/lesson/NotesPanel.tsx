import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Clock, Pencil, Trash2 } from "lucide-react";

import { sortNotes, type LessonNote } from "@shared/lesson";
import { formatClock } from "@shared/video";

import { ApiRequestError } from "@/api/client";
import { Button, Kbd, Textarea, v5Toast } from "@/v5/design";

import { lessonApi } from "./api";

export interface NotesPanelHandle {
  /** Opens the box with the note pinned to this moment and moves focus into it. */
  startNote: (atSec: number | null) => void;
}

/**
 * Timestamped notes (`lesson_notes`). Press N (or "Add a note") while watching: the box opens with
 * the current time; Enter saves, Shift+Enter adds a line. Each note's time is a button that jumps the
 * video there.
 */
export const NotesPanel = forwardRef<NotesPanelHandle, { topicId: string; videoId: string | null; onSeek: (note: LessonNote) => void }>(function NotesPanel(
  { topicId, videoId, onSeek },
  ref,
) {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [draft, setDraft] = useState("");
  const [at, setAt] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    lessonApi
      .notes(topicId, controller.signal)
      .then((res) => setNotes(res.notes))
      .catch(() => undefined);
    return () => controller.abort();
  }, [topicId]);

  useImperativeHandle(ref, () => ({
    startNote: (sec) => {
      setAt(sec === null ? null : Math.floor(sec));
      setComposing(true);
      setError(null);
      requestAnimationFrame(() => boxRef.current?.focus());
    },
  }));

  const save = async () => {
    const body = draft.trim();
    if (!body) return;
    setSaving(true);
    setError(null);
    try {
      const res = await lessonApi.addNote(topicId, { body, videoId: at !== null ? videoId : null, atSec: at });
      setNotes((list) => sortNotes([...list, res.note]));
      setDraft("");
      setComposing(false);
      v5Toast.success(at !== null ? `Note saved at ${formatClock(at)}` : "Note saved");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "We couldn't save that note. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !editing.body.trim()) return;
    try {
      const res = await lessonApi.editNote(editing.id, editing.body.trim());
      setNotes((list) => list.map((n) => (n.id === res.note.id ? res.note : n)));
      setEditing(null);
    } catch {
      v5Toast.error("We couldn't save that change. Try again.");
    }
  };

  const remove = async (note: LessonNote) => {
    setNotes((list) => list.filter((n) => n.id !== note.id));
    try {
      await lessonApi.deleteNote(note.id);
    } catch {
      setNotes((list) => sortNotes([...list, note]));
      v5Toast.error("We couldn't delete that note. Try again.");
    }
  };

  return (
    <section aria-labelledby="lesson-notes" className="rounded-card border border-line-1 bg-surface-1 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="lesson-notes" className="font-display text-small font-semibold text-fg-1">
          My notes {notes.length ? <span className="font-normal text-fg-2">({notes.length})</span> : null}
        </h2>
        {!composing ? (
          <span className="text-caption text-fg-2">
            Press <Kbd>N</Kbd> to add one at this moment
          </span>
        ) : null}
      </div>

      {composing ? (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label htmlFor="v5-note-box" className="text-small font-medium text-fg-1">
            {at !== null ? `Note at ${formatClock(at)}` : "Note"}
          </label>
          <Textarea
            ref={boxRef}
            id="v5-note-box"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void save();
              }
              if (e.key === "Escape") {
                e.stopPropagation();
                setComposing(false);
              }
            }}
            placeholder="What do you want to remember?"
            className="min-h-20"
            aria-describedby={error ? "v5-note-error" : undefined}
          />
          {error ? (
            <p id="v5-note-error" role="alert" className="text-small text-danger-fg">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" loading={saving} disabled={!draft.trim()}>
              Save note
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setComposing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {notes.length ? (
        <ul className="mt-3 flex flex-col gap-2" aria-label="Your notes on this lesson">
          {notes.map((note) => (
            <li key={note.id} className="flex items-start gap-2 rounded-control bg-sunken px-2 py-1.5">
              {note.atSec !== null ? (
                <button
                  type="button"
                  onClick={() => onSeek(note)}
                  className="inline-flex min-h-6 shrink-0 items-center gap-1 rounded-sm px-1 font-mono text-caption text-brand-fg hover:underline"
                  aria-label={`Play from ${formatClock(note.atSec)}`}
                >
                  <Clock className="size-3" aria-hidden="true" />
                  {formatClock(note.atSec)}
                </button>
              ) : null}
              {editing?.id === note.id ? (
                <form
                  className="flex flex-1 flex-col gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveEdit();
                  }}
                >
                  <label htmlFor={`v5-note-edit-${note.id}`} className="sr-only">
                    Edit note
                  </label>
                  <Textarea id={`v5-note-edit-${note.id}`} value={editing.body} onChange={(e) => setEditing({ id: note.id, body: e.target.value })} className="min-h-16" />
                  <div className="flex gap-1">
                    <Button type="submit" size="sm" variant="primary">
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-small text-fg-1">{note.body}</p>
              )}
              {editing?.id !== note.id ? (
                <span className="flex shrink-0">
                  <Button size="icon" variant="ghost" className="size-7" aria-label="Edit this note" onClick={() => setEditing({ id: note.id, body: note.body })}>
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-7" aria-label="Delete this note" onClick={() => void remove(note)}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : !composing ? (
        <p className="mt-2 text-small text-fg-2">No notes yet.</p>
      ) : null}
    </section>
  );
});
