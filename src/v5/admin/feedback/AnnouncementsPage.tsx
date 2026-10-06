import { Megaphone, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { AdminAnnouncementView, AnnouncementInput } from "@shared/today";

import { adminApi } from "@/features/admin/api";
import { useCatalog } from "@/features/admin/catalog/useCatalog";
import { Badge, Button, Card, Dialog, EmptyState, ErrorState, Field, Input, SkeletonLayout, Textarea, cn, v5Toast } from "@/v5/design";

import { v5AdminApi } from "../api";
import { formatDate, isMissing, Page, PageHeader, plainMessage, useLoad, useSlow } from "../parts/common";

type AudienceKind = "all" | "departments" | "people";

interface Draft {
  title: string;
  body: string;
  kind: AudienceKind;
  departmentIds: string[];
  userIds: string[];
  pinned: boolean;
  /** `YYYY-MM-DD` or "" for no end. */
  until: string;
}

const EMPTY: Draft = { title: "", body: "", kind: "all", departmentIds: [], userIds: [], pinned: true, until: "" };

/** The draft as the API's input; null with a plain reason when something is missing. */
export function draftToInput(d: Draft): { input: AnnouncementInput | null; problem: string | null } {
  if (!d.title.trim()) return { input: null, problem: "Add a title." };
  if (!d.body.trim()) return { input: null, problem: "Add a message." };
  const audience = d.kind === "all" ? { all: true as const } : d.kind === "departments" ? { departmentIds: d.departmentIds } : { userIds: d.userIds };
  if (d.kind === "departments" && d.departmentIds.length === 0) return { input: null, problem: "Pick at least one department." };
  if (d.kind === "people" && d.userIds.length === 0) return { input: null, problem: "Pick at least one person." };
  let expiresAt: number | null = null;
  if (d.until) {
    const [y, m, day] = d.until.split("-").map(Number);
    expiresAt = new Date(y!, m! - 1, day!, 23, 59, 59).getTime();
  }
  return { input: { title: d.title.trim(), body: d.body.trim(), audience, pinned: d.pinned, expiresAt }, problem: null };
}

/** `/admin/announcements`: short messages on learners' Today screens. */
export default function AnnouncementsPage() {
  const [params, setParams] = useSearchParams();
  const list = useLoad((signal) => v5AdminApi.announcements(signal));
  const slow = useSlow(list.loading && !list.data);
  const { departmentOptions, departmentName } = useCatalog();
  const people = useLoad((signal) => adminApi.listUsers(signal));
  const [open, setOpen] = useState(params.get("new") === "1");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (params.get("new") === "1") setOpen(true);
  }, [params]);

  const learners = (people.data?.users ?? []).filter((u) => u.role === "learner" && u.status === "active");
  const items = (list.data?.announcements ?? []).filter((a) => !hidden.has(a.id));

  const audienceText = (a: AdminAnnouncementView) =>
    a.audience.all ? "Everyone" : a.audience.departmentIds?.length ? a.audience.departmentIds.map((id) => departmentName(id)).join(", ") : `${a.audience.userIds?.length ?? 0} people`;

  const save = async () => {
    const { input, problem: p } = draftToInput(draft);
    setProblem(p);
    if (!input) return;
    setSaving(true);
    try {
      await v5AdminApi.createAnnouncement(input);
      v5Toast.success("Announcement posted.");
      setOpen(false);
      setDraft(EMPTY);
      if (params.get("new")) setParams({}, { replace: true });
      list.reload();
    } catch (error) {
      setProblem(plainMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (a: AdminAnnouncementView) => {
    try {
      await v5AdminApi.updateAnnouncement(a.id, { pinned: !a.pinned });
      list.reload();
    } catch (error) {
      v5Toast.error("That didn't work", plainMessage(error));
    }
  };

  /** Removed at once from the list; deleted for real when the Undo window closes. */
  const remove = (a: AdminAnnouncementView) => {
    setHidden((h) => new Set(h).add(a.id));
    const timer = setTimeout(() => {
      void v5AdminApi.deleteAnnouncement(a.id).catch((error) => {
        setHidden((h) => {
          const n = new Set(h);
          n.delete(a.id);
          return n;
        });
        v5Toast.error("We couldn't remove it", plainMessage(error));
      });
    }, 6000);
    v5Toast.undo("Announcement removed.", () => {
      clearTimeout(timer);
      setHidden((h) => {
        const n = new Set(h);
        n.delete(a.id);
        return n;
      });
    });
  };

  return (
    <Page>
      <PageHeader
        title="Announcements"
        description="Short messages that show on learners' Today screen."
        actions={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            Write an announcement
          </Button>
        }
      />
      {list.error && !list.data ? (
        isMissing(list.error) ? (
          <EmptyState icon={<Megaphone />} title="Announcements are coming soon" body="This part of Oyelearn isn't switched on here yet." />
        ) : (
          <ErrorState body={plainMessage(list.error)} onRetry={list.reload} />
        )
      ) : !list.data ? (
        slow ? <SkeletonLayout variant="list" rows={3} label="Loading announcements" /> : null
      ) : items.length === 0 ? (
        <EmptyState icon={<Megaphone />} title="No announcements" body="Write one to tell people about a new course, a deadline or a change." />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((a) => (
            <li key={a.id}>
              <Card className={cn("flex flex-col gap-1", a.expired && "opacity-70")}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 flex-1 font-display text-h4 font-semibold">{a.title}</h2>
                  {a.pinned ? <Badge tone="brand">Pinned</Badge> : null}
                  {a.expired ? <Badge tone="neutral">Ended</Badge> : null}
                </div>
                <p className="whitespace-pre-line text-small text-fg-1">{a.body}</p>
                <p className="text-caption text-fg-2">
                  For {audienceText(a)} · posted {formatDate(a.createdAt)}
                  {a.author ? ` by ${a.author}` : ""}
                  {a.expiresAt ? ` · until ${formatDate(a.expiresAt)}` : ""}
                </p>
                <div className="mt-1 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => void togglePin(a)}>
                    {a.pinned ? <PinOff aria-hidden="true" /> : <Pin aria-hidden="true" />}
                    {a.pinned ? "Unpin" : "Pin"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(a)}>
                    <Trash2 aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o && params.get("new")) setParams({}, { replace: true });
        }}
        title="Write an announcement"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Not now
            </Button>
            <Button variant="primary" loading={saving} onClick={() => void save()}>
              Post it
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Title">
            <Input value={draft.title} maxLength={120} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Message">
            <Textarea value={draft.body} maxLength={2000} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-small font-medium">Who sees it</legend>
            {(
              [
                ["all", "Everyone"],
                ["departments", "Some departments"],
                ["people", "Some people"],
              ] as const
            ).map(([kind, label]) => (
              <label key={kind} className="flex items-center gap-2 text-small">
                <input type="radio" name="audience" className="size-6 shrink-0 accent-[rgb(var(--v5-brand))]" checked={draft.kind === kind} onChange={() => setDraft({ ...draft, kind })} />
                {label}
              </label>
            ))}
            {draft.kind === "departments" ? (
              <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1">
                {departmentOptions.map((d) => (
                  <label key={d.value} className="flex items-center gap-2 text-small">
                    <input
                      type="checkbox"
                      className="size-6 shrink-0 accent-[rgb(var(--v5-brand))]"
                      checked={draft.departmentIds.includes(d.value)}
                      onChange={(e) => setDraft({ ...draft, departmentIds: e.target.checked ? [...draft.departmentIds, d.value] : draft.departmentIds.filter((x) => x !== d.value) })}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            ) : null}
            {draft.kind === "people" ? (
              <div className="ml-6 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-control border border-line-1 p-2">
                {learners.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-small">
                    <input
                      type="checkbox"
                      className="size-6 shrink-0 accent-[rgb(var(--v5-brand))]"
                      checked={draft.userIds.includes(u.id)}
                      onChange={(e) => setDraft({ ...draft, userIds: e.target.checked ? [...draft.userIds, u.id] : draft.userIds.filter((x) => x !== u.id) })}
                    />
                    {u.displayName}
                  </label>
                ))}
                {learners.length === 0 ? <p className="text-small text-fg-2">No active learners yet.</p> : null}
              </div>
            ) : null}
          </fieldset>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-2 text-small">
              <input type="checkbox" className="size-6 shrink-0 accent-[rgb(var(--v5-brand))]" checked={draft.pinned} onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })} />
              Pin it to the top
            </label>
            <Field label="Show until" hint="Leave empty to keep it until you remove it." optional>
              <Input type="date" value={draft.until} onChange={(e) => setDraft({ ...draft, until: e.target.value })} className="w-44" />
            </Field>
          </div>
          {problem ? (
            <p role="alert" className="text-small font-medium text-danger-fg">
              {problem}
            </p>
          ) : null}
        </div>
      </Dialog>
    </Page>
  );
}
