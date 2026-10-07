import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { Lock, Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";

import type { ModuleVideoInput, OyelabsVideoView, UploadView } from "@shared/oyelabsCourses";
import { CONFIDENTIALITY_NOTE, VIDEO_SOURCE_LABELS, type ResolvedVideo } from "@shared/videoSourcesCore";

import { Button, Input, Textarea } from "@/v5/design";

import { errorText, mediaApi, type VideoCheckResult } from "./api";
import { cardStatus, formatBytes, minutesToSeconds, moveItem, pastedLinks, type CardStatus } from "./fieldLogic";
import { LinkCard } from "./LinkCard";
import { UploadButton } from "./UploadButton";

/**
 * v4.5 Phase 2 (builder B; builder A places it in each module card).
 *
 * The module's videos: a box for pasted links (one per line), "Upload a video", and one preview card
 * per video (thumbnail, provider, title, "Plays ✓" or "Can't play: reason + fix", a length box for
 * embeds we can't measure, drag or Move up/down to reorder). The confidentiality line sits next to
 * the field. Controlled: A owns the list in its editor state and autosave.
 */
export interface VideoLinksFieldProps {
  value: ModuleVideoInput[];
  onChange: (next: ModuleVideoInput[]) => void;
  /** What the server knows about saved videos (status, title, thumbnail), by id. */
  saved: Record<string, OyelabsVideoView>;
  disabled?: boolean;
}

const VIDEO_ACCEPT = ".mp4,.webm,.mov,.m4v,.mkv,.avi,video/*";

function keyOf(v: ModuleVideoInput, i: number): string {
  return v.id ?? (v.url ? `url:${v.url}` : v.uploadId ? `up:${v.uploadId}` : `i:${i}`);
}

export function VideoLinksField({ value, onChange, saved, disabled }: VideoLinksFieldProps) {
  const [text, setText] = useState("");
  const boxId = useId();
  const noteId = useId();

  const add = () => {
    const links = pastedLinks(text, value.map((v) => v.url ?? ""));
    if (links.length) onChange([...value, ...links.map((url) => ({ url }))]);
    setText("");
  };
  const addUpload = (up: UploadView) => {
    if (value.some((v) => v.uploadId === up.id)) return;
    onChange([...value, { uploadId: up.id, title: up.name.replace(/\.[a-z\d]+$/i, "") }]);
  };
  const move = (from: number, to: number) => onChange(moveItem(value, from, to));

  return (
    <div className="flex flex-col gap-3" data-testid="oyelabs-video-field">
      <p id={noteId} className="flex items-start gap-1.5 text-small text-fg-2">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {CONFIDENTIALITY_NOTE}
      </p>
      {value.length ? (
        <DragDropProvider
          onDragEnd={(event) => {
            if (event.canceled) return;
            const { source } = event.operation;
            if (isSortable(source)) move(source.initialIndex, source.index);
          }}
        >
          <ol className="flex flex-col gap-2" aria-label="Videos in this module, in order">
            {value.map((v, i) => (
              <VideoCard
                key={keyOf(v, i)}
                id={keyOf(v, i)}
                item={v}
                index={i}
                count={value.length}
                saved={v.id ? saved[v.id] : undefined}
                disabled={disabled}
                onMove={move}
                onRemove={() => onChange(value.filter((_, j) => j !== i))}
                onPatch={(patch) => onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
              />
            ))}
          </ol>
        </DragDropProvider>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={boxId} className="text-small font-medium text-fg-1">
          Paste video links, one per line
        </label>
        <Textarea
          id={boxId}
          rows={2}
          value={text}
          disabled={disabled}
          aria-describedby={noteId}
          placeholder="YouTube, Vimeo, Loom, Google Drive, OneDrive, Dropbox, Box, or a link to an .mp4 file"
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            // Pasting into an empty box adds the links straight away.
            if (text.trim()) return;
            const pasted = e.clipboardData.getData("text");
            const links = pastedLinks(pasted, value.map((v) => v.url ?? ""));
            if (links.length) {
              e.preventDefault();
              onChange([...value, ...links.map((url) => ({ url }))]);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              add();
            }
          }}
        />
        <div className="flex flex-wrap items-start gap-2">
          <Button variant="secondary" size="sm" disabled={disabled || !text.trim()} onClick={add}>
            <Plus aria-hidden="true" /> Add links
          </Button>
          <UploadButton kind="video" label="Upload a video" accept={VIDEO_ACCEPT} disabled={disabled} onUploaded={addUpload} />
        </div>
      </div>
    </div>
  );
}

interface CardState {
  kind: string;
  source: string;
  title: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  estimated: boolean;
  status: CardStatus;
}

function fromResolved(r: ResolvedVideo | VideoCheckResult | OyelabsVideoView): CardState {
  return {
    kind: r.kind,
    source: VIDEO_SOURCE_LABELS[r.kind],
    title: r.title || null,
    thumbnailUrl: r.thumbnailUrl,
    durationSeconds: r.durationSeconds,
    estimated: r.tracking === "estimated",
    status: cardStatus(r.status, r.problem, "video"),
  };
}

function fromUpload(u: UploadView): CardState {
  const status: CardStatus =
    u.transcode === "pending" || u.transcode === "running"
      ? u.mime === "video/mp4" || u.mime === "video/webm"
        ? { tone: "ok", line: "Plays ✓ (checking the file)", fix: null }
        : { tone: "pending", line: "Converting so it plays in every browser…", fix: null }
      : u.transcode === "failed"
        ? { tone: "problem", line: "Can't play: this video couldn't be converted.", fix: "Export it as MP4 (H.264) and upload it again." }
        : { tone: "ok", line: "Plays ✓", fix: null };
  return { kind: "upload", source: `${VIDEO_SOURCE_LABELS.upload}, ${formatBytes(u.bytes)}`, title: u.name, thumbnailUrl: null, durationSeconds: u.durationSeconds, estimated: false, status };
}

function VideoCard({
  id,
  item,
  index,
  count,
  saved,
  disabled,
  onMove,
  onRemove,
  onPatch,
}: {
  id: string;
  item: ModuleVideoInput;
  index: number;
  count: number;
  saved: OyelabsVideoView | undefined;
  disabled?: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  onPatch: (patch: Partial<ModuleVideoInput>) => void;
}) {
  const savedMatches = saved && (item.url ? saved.input === item.url : saved.uploadId === item.uploadId);
  const [state, setState] = useState<CardState | null>(savedMatches && saved ? fromResolved(saved) : null);
  const [checking, setChecking] = useState(false);
  const [minutes, setMinutes] = useState(item.durationSeconds ? String(Math.round(item.durationSeconds / 60)) : "");
  const titleId = useId();
  const lengthId = useId();

  // A pasted link that isn't saved yet (or changed): resolve it for the preview.
  useEffect(() => {
    if (savedMatches || !item.url) return;
    let live = true;
    mediaApi.resolveVideo(item.url).then(
      (r) => live && setState(fromResolved(r)),
      (e: unknown) => live && setState({ kind: "embed", source: "Link", title: null, thumbnailUrl: null, durationSeconds: null, estimated: false, status: { tone: "problem", line: `Can't check: ${errorText(e)}`, fix: null } }),
    );
    return () => {
      live = false;
    };
  }, [item.url, savedMatches]);

  // An upload: show its conversion state, and follow it until it's done.
  useEffect(() => {
    if (!item.uploadId) return;
    let live = true;
    let timer = 0;
    const poll = () =>
      mediaApi.getUpload(item.uploadId!).then(
        (u) => {
          if (!live) return;
          setState(fromUpload(u));
          if (u.transcode === "pending" || u.transcode === "running") timer = window.setTimeout(poll, 5000);
        },
        () => undefined,
      );
    void poll();
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [item.uploadId]);

  const checkAgain = async () => {
    setChecking(true);
    try {
      if (item.id && savedMatches) setState(fromResolved(await mediaApi.checkVideo(item.id)));
      else if (item.url) setState(fromResolved(await mediaApi.resolveVideo(item.url, true)));
    } catch (e) {
      setState((s) => (s ? { ...s, status: { tone: "problem", line: `Can't check: ${errorText(e)}`, fix: null } } : s));
    } finally {
      setChecking(false);
    }
  };

  const shownTitle = item.title || state?.title || (item.url ? "Video" : "Uploaded video");
  const needsLength = Boolean(state?.estimated);
  const unknownLength = needsLength && !item.durationSeconds && !state?.durationSeconds;
  return (
    <LinkCard
      id={id}
      index={index}
      count={count}
      source={state?.source ?? "Checking the link…"}
      kind={state?.kind ?? "embed"}
      title={shownTitle}
      sub={item.url ?? ""}
      thumbnailUrl={state?.thumbnailUrl}
      status={state?.status ?? { tone: "pending", line: "Checking…", fix: null }}
      checking={checking}
      disabled={disabled}
      onCheckAgain={item.url ? () => void checkAgain() : undefined}
      onMove={onMove}
      onRemove={onRemove}
    >
      <div className="mt-1 flex flex-wrap items-end gap-2">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor={titleId} className="text-caption text-fg-2">
            Title learners see
          </label>
          <Input id={titleId} value={item.title ?? ""} maxLength={200} placeholder={state?.title ?? "Video title"} disabled={disabled} onChange={(e) => onPatch({ title: e.target.value || undefined })} />
        </div>
        {needsLength ? (
          <div className="flex w-36 flex-col gap-1">
            <label htmlFor={lengthId} className="text-caption text-fg-2">
              Length in minutes
            </label>
            <Input
              id={lengthId}
              inputMode="decimal"
              value={minutes}
              placeholder={state?.durationSeconds ? String(Math.round(state.durationSeconds / 60)) : "e.g. 12"}
              disabled={disabled}
              aria-invalid={unknownLength || undefined}
              onChange={(e) => {
                setMinutes(e.target.value);
                onPatch({ durationSeconds: minutesToSeconds(e.target.value) });
              }}
            />
          </div>
        ) : null}
      </div>
      {needsLength ? (
        <p className="text-caption text-fg-2">
          We can't see inside this player, so we count time on the page. {unknownLength ? "Add the length so learners know when they've watched enough." : null}
        </p>
      ) : null}
    </LinkCard>
  );
}
