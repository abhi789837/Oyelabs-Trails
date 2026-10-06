import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Award, BookMarked, Download, ExternalLink, NotebookPen, RotateCcw, Search, ShieldCheck, Trophy } from "lucide-react";
import { m } from "motion/react";
import { Link } from "react-router-dom";

import { api, ApiRequestError } from "@/api/client";
import type { CertificateData } from "@/lib/certificate";
import type { TrackId } from "@/types/curriculum";
import { useAuth } from "@/features/auth/AuthProvider";
import { chooseDesign } from "@/v5/app/designFlag";
import { isStaffRole } from "@shared/uiFlag";
import { Button } from "@/v5/design/components/Button";
import { Card, CardHeader } from "@/v5/design/components/Card";
import { Input } from "@/v5/design/components/Field";
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@/v5/design/components/Primitives";
import { EmptyState, ErrorState, Skeleton, SkeletonLayout } from "@/v5/design/components/States";
import { SkillMeter, StreakFlame, XPCounter } from "@/v5/design/components/Stats";
import { cn } from "@/v5/design/cn";
import { transitions } from "@/v5/design/motion";
import type { CertificateView, MeProfile, NoteView, Settings } from "@shared/me";
import { linkedInAddUrl, searchNotes } from "@shared/meCore";

import { PageFrame, V5Screen, useApiData, useDelayed, type ApiData } from "./page";
import { applyTheme } from "./settings";
import { plainTitle } from "@shared/plainTitle";
import { weekOfLabel, weekStartLabel } from "@shared/weekLabel";

// Phase 6: the weekly goal (and team board opt-in), saved through /api/v5/motivation/prefs.
const MotivationSettings = lazy(() => import("@/v5/motivation/MotivationSettings"));

/**
 * `/learn/me`: what you can do now (skill levels, practical cases, certificates), your XP and
 * weekly streak, your notes from every lesson, and your settings.
 */
export default function MePage() {
  const settings = useApiData<{ settings: Settings; emailEnabled?: boolean }>("/api/v5/me/settings");
  return (
    <V5Screen reducedMotion={settings.data?.settings.reducedMotion}>
      <MeScreen settings={settings} />
    </V5Screen>
  );
}

type Tab = "progress" | "notes" | "settings";
const TABS: Tab[] = ["progress", "notes", "settings"];

function initialTab(): Tab {
  const t = new URLSearchParams(window.location.search).get("tab");
  return TABS.includes(t as Tab) ? (t as Tab) : "progress";
}

/** On phones the bottom bar is full, so the sidebar's extra links live here (hidden from md up). */
function MoreLinks() {
  const { user } = useAuth();
  const staff = user ? isStaffRole(user.role) : false;
  const link = "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-card border border-line-1 bg-surface-1 px-3 text-small font-medium text-fg-1 hover:bg-sunken";
  return (
    <nav aria-label="More" className="mb-4 flex gap-2 md:hidden">
      <Link to="/glossary" className={link}>
        <BookMarked className="size-4" aria-hidden="true" /> Handbook
      </Link>
      {staff ? (
        <Link to="/admin" className={link}>
          <ShieldCheck className="size-4" aria-hidden="true" /> Admin
        </Link>
      ) : null}
    </nav>
  );
}

function MeScreen({ settings }: { settings: ApiData<{ settings: Settings; emailEnabled?: boolean }> }) {
  const profile = useApiData<MeProfile>("/api/v5/me/profile");
  const [tab, setTab] = useState<Tab>(initialTab);
  const p = profile.data;
  const showSkeleton = useDelayed(profile.loading && !p);

  const changeTab = (value: string) => {
    setTab(value as Tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <PageFrame
      title={p?.displayName ? p.displayName : "Me"}
      lead="What you can do now, how far you've come, and how Oyelearn works for you."
      actions={p ? <XPCounter value={p.xp.total} /> : null}
    >
      <MoreLinks />
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList aria-label="Me">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          {profile.error && !p ? (
            <ErrorState title="We couldn't load your progress" onRetry={() => void profile.reload()} retrying={profile.loading} />
          ) : !p ? (
            showSkeleton ? <ProgressSkeleton /> : null
          ) : (
            <ProgressTab profile={p} />
          )}
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab settings={settings} />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

function ProgressTab({ profile }: { profile: MeProfile }) {
  const maxWeekXp = Math.max(1, ...profile.xp.weeks.map((w) => w.xp));
  return (
    <m.div className="grid gap-(--v5-gap) lg:grid-cols-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={transitions.calm}>
      <Card className="lg:col-span-2">
        <CardHeader title="Skill levels" description="0 means not started, 5 means you could teach it. From your last test and the skills it showed you have." />
        {profile.skills.length ? (
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2" data-testid="me-skill-levels">
            {profile.skills.map((s) => (
              <li key={s.skillId}>
                <SkillMeter level={s.level} label={s.name} />
                {s.source === "inferred" ? <p className="mt-1 text-caption text-fg-2">Worked out from a skill that builds on it.</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-fg-2" data-testid="me-skill-levels">Your levels appear after your first test.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="XP" description={`+${profile.xp.thisWeek} this week`} />
        <ol className="flex h-28 items-end gap-1.5" aria-label="XP in the last 8 weeks">
          {profile.xp.weeks.map((w) => (
            <li key={w.week} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="sr-only">
                {weekOfLabel(w.week)}: {w.xp} XP
              </span>
              <span aria-hidden="true" className={cn("w-full rounded-t-sm", w.xp ? "bg-brand" : "bg-sunken")} style={{ height: `${Math.max(4, (w.xp / maxWeekXp) * 100)}%` }} />
              <span aria-hidden="true" className="whitespace-nowrap text-[0.625rem] text-fg-2">
                {weekStartLabel(w.week)}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardHeader title="Weekly streak" description="A week counts when you reach your weekly goal." />
        {profile.streak ? (
          <StreakFlame current={profile.streak.current} best={profile.streak.best} freezesLeft={profile.streak.freezesLeft} history={profile.streak.history} />
        ) : (
          <p className="text-body text-fg-2">Your streak starts with your first finished week.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Practical cases passed" description="Real tasks you've shown you can do." />
        {profile.cases.length ? (
          <ul className="flex flex-col gap-3">
            {profile.cases.map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <Trophy className="mt-0.5 size-4 shrink-0 text-success-fg" aria-hidden="true" />
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-small text-fg-2">{c.statement}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-fg-2">None yet. They're the hands-on tasks at the end of a goal.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Certificates" description="Download them, or add them to your LinkedIn profile." />
        {profile.certificates.length ? (
          <ul className="flex flex-col gap-3">
            {profile.certificates.map((c) => (
              <CertificateRow key={c.id} cert={c} />
            ))}
          </ul>
        ) : (
          <p className="text-body text-fg-2">You'll get one when you finish a track or a course.</p>
        )}
      </Card>
    </m.div>
  );
}

function CertificateRow({ cert }: { cert: CertificateView }) {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const download = async () => {
    setState("working");
    try {
      const { downloadCertificatePdf } = await import("@/components/certificate/generateCertificatePdf");
      const data: CertificateData = {
        name: cert.holderName,
        trackId: (cert.trackId || cert.kind) as TrackId,
        trackName: cert.title,
        accentHex: "#2067D3",
        topicsCount: cert.topicCount,
        campCount: 0,
        milestoneCount: 0,
        totalMinutes: 0,
        averageScore: cert.averageScore,
        completedAt: new Date(cert.issuedAt).toISOString(),
        certificateId: cert.id,
      };
      await downloadCertificatePdf(data);
      setState("idle");
    } catch {
      setState("error");
    }
  };
  return (
    <li className="flex flex-col gap-2 rounded-control border border-line-1 p-3">
      <div className="flex items-start gap-2">
        <Award className="mt-0.5 size-4 shrink-0 text-brand-fg" aria-hidden="true" />
        <div className="min-w-0">
          <Link to={`/learn/certificate/${encodeURIComponent(cert.id)}`} className="font-medium text-fg-1 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            {cert.title}
          </Link>
          <p className="text-caption text-fg-2">
            Issued {new Date(cert.issuedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · <span className="font-mono">{cert.id}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => void download()} loading={state === "working"}>
          {state === "working" ? null : <Download aria-hidden="true" />} Download PDF
        </Button>
        <Button asChild size="sm" variant="secondary">
          <a href={linkedInAddUrl(cert, window.location.origin)} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden="true" /> Add to LinkedIn<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Button>
      </div>
      {state === "error" ? (
        <p role="alert" className="text-small text-danger-fg">
          The PDF didn't build. Try again, or reload the page.
        </p>
      ) : null}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

function formatAt(sec: number): string {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(mm).padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
}

function NotesTab() {
  const { data, error, loading, reload } = useApiData<{ notes: NoteView[] }>("/api/v5/me/notes");
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query);
  const notes = useMemo(() => searchNotes(data?.notes ?? [], q), [data, q]);
  const showSkeleton = useDelayed(loading && !data);

  if (error && !data) return <ErrorState title="We couldn't load your notes" onRetry={() => void reload()} retrying={loading} />;
  if (!data) return showSkeleton ? <SkeletonLayout variant="list" rows={4} label="Loading your notes" /> : null;
  if (data.notes.length === 0) {
    return <EmptyState icon={<NotebookPen />} title="No notes yet" body="Notes you write in a lesson land here, with a link back to the moment in the video." />;
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label htmlFor="notes-search" className="sr-only">
          Search your notes
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
        <Input id="notes-search" type="search" placeholder="Search your notes" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" autoComplete="off" />
      </div>
      <p className="text-small text-fg-2" role="status" aria-live="polite">
        {notes.length} {notes.length === 1 ? "note" : "notes"}
      </p>
      <ul className="flex flex-col gap-2" data-testid="me-notes">
        {notes.map((n) => (
          <li key={n.id}>
            <Link
              to={n.href}
              className="flex flex-col gap-1 rounded-control border border-line-1 bg-surface-1 p-3 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span className="flex flex-wrap items-center gap-2 text-caption text-fg-2">
                <span className="font-medium text-fg-1">{plainTitle(n.topicTitle)}</span>
                {n.atSec != null ? <Badge tone="info">At {formatAt(n.atSec)}</Badge> : null}
                <span>{new Date(n.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
              </span>
              <span className="whitespace-pre-wrap text-body text-fg-1">{n.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function SettingsTab({ settings }: { settings: ApiData<{ settings: Settings; emailEnabled?: boolean }> }) {
  const s = settings.data?.settings;
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  // The latest settings, for saves that finish out of order (two quick toggles).
  const latest = useRef(s);
  latest.current = s;
  const inFlight = useRef(0);
  const showSkeleton = useDelayed(settings.loading && !s);

  // Optimistic: the switch moves at once. If the save fails, only the keys this change touched go
  // back (another change made meanwhile stays), and a plain toast says so.
  const save = async (change: Partial<Settings>) => {
    const current = latest.current;
    if (!current) return;
    const previous = Object.fromEntries(Object.keys(change).map((k) => [k, current[k as keyof Settings]])) as Partial<Settings>;
    const next = { ...current, ...change };
    latest.current = next;
    settings.setData({ settings: next });
    if (change.theme) applyTheme(change.theme);
    setStatus("Saving…");
    setError(null);
    inFlight.current += 1;
    try {
      const res = await api.put<{ settings: Settings; emailEnabled?: boolean }>("/api/v5/me/settings", change);
      // Keep any change made while this one was on its way.
      if (inFlight.current === 1) settings.setData(res);
      setStatus("Saved");
    } catch (e) {
      const base = latest.current ?? current;
      const rolled = { ...base, ...previous };
      latest.current = rolled;
      settings.setData({ settings: rolled });
      if (change.theme && previous.theme) applyTheme(previous.theme);
      setStatus("");
      const message = e instanceof ApiRequestError && e.status > 0 && e.status < 500 ? e.message : "That change didn't save. Check your connection and try again.";
      setError(message);
      void import("@/v5/design/components/Overlays").then(({ v5Toast }) => v5Toast.error("That setting didn't save", "We put it back. Try again in a moment.")).catch(() => undefined);
    } finally {
      inFlight.current -= 1;
    }
  };

  useEffect(() => {
    if (status !== "Saved") return;
    const id = window.setTimeout(() => setStatus(""), 2500);
    return () => window.clearTimeout(id);
  }, [status]);

  if (settings.error && !s) return <ErrorState title="We couldn't load your settings" onRetry={() => void settings.reload()} retrying={settings.loading} />;
  if (!s) return showSkeleton ? <SettingsSkeleton /> : null;

  return (
    <div className="flex flex-col gap-(--v5-gap)">
      <p className="min-h-5 text-small text-fg-2" role="status" aria-live="polite">
        {error ? <span className="font-medium text-danger-fg">{error}</span> : status}
      </p>

      <Card className="flex flex-col gap-4">
        <CardHeader title="Look and feel" className="mb-0" />
        <Choice
          label="Theme"
          value={s.theme}
          onChange={(v) => void save({ theme: v as Settings["theme"] })}
          options={[
            ["system", "Same as my device"],
            ["light", "Light"],
            ["dark", "Dark"],
          ]}
        />
        <Choice
          label="Reduce motion"
          hint="Turns off moving animations."
          value={s.reducedMotion}
          onChange={(v) => void save({ reducedMotion: v as Settings["reducedMotion"] })}
          options={[
            ["system", "Same as my device"],
            ["on", "On"],
            ["off", "Off"],
          ]}
        />
        <Toggle label="Celebrations" hint="A short moment when you finish something big." checked={s.celebrations} onChange={(v) => void save({ celebrations: v })} />
      </Card>

      <Card className="flex flex-col gap-4">
        <CardHeader title="Videos" className="mb-0" />
        <Toggle label="Captions" hint="Turn on captions when a video starts, where the video has them." checked={s.captions} onChange={(v) => void save({ captions: v })} />
        <Toggle label="Autoplay the next video" checked={s.autoplayNext} onChange={(v) => void save({ autoplayNext: v })} />
      </Card>

      <Card className="flex flex-col gap-4">
        <CardHeader title="Reminders" className="mb-0" />
        <Toggle label="Daily reminder" hint="One nudge a day, at the time you pick." checked={s.reminderTime !== null} onChange={(v) => void save({ reminderTime: v ? "18:00" : null })} />
        {s.reminderTime !== null ? <TimeField label="Reminder time" value={s.reminderTime} onSave={(v) => void save({ reminderTime: v })} /> : null}
        <Toggle label="Quiet hours" hint="No nudges between these times." checked={s.quietHours !== null} onChange={(v) => void save({ quietHours: v ? { from: "21:00", to: "08:00" } : null })} />
        {s.quietHours ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <TimeField label="Quiet from" value={s.quietHours.from} onSave={(v) => void save({ quietHours: { ...s.quietHours!, from: v } })} />
            <TimeField label="Quiet until" value={s.quietHours.to} onSave={(v) => void save({ quietHours: { ...s.quietHours!, to: v } })} />
          </div>
        ) : null}
        {settings.data?.emailEnabled ? (
          <Toggle label="Weekly email" hint="A short summary of your week, every Monday." checked={s.weeklyEmail} onChange={(v) => void save({ weeklyEmail: v })} />
        ) : null}
      </Card>

      <Suspense fallback={null}>
        <MotivationSettings />
      </Suspense>

      <Card className="flex flex-col gap-3">
        <CardHeader title="Design" className="mb-0" />
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary">
            <Link to="/learn?welcome=1">
              <RotateCcw aria-hidden="true" /> Replay the welcome
            </Link>
          </Button>
          <Button
            variant="secondary"
            loading={leaving}
            onClick={() => {
              setLeaving(true);
              void chooseDesign(false, "/").catch(() => setLeaving(false));
            }}
          >
            Use previous design
          </Button>
        </div>
        <p className="text-small text-fg-2">The previous design stays available for two more weeks. Your progress is the same in both.</p>
      </Card>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = `setting-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-body font-medium text-fg-1">
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className="text-small text-fg-2">
            {hint}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          // A 44 px touch area on phones without changing how the switch looks.
          "before:absolute before:-inset-2 before:content-['']",
          checked ? "border-brand bg-brand" : "border-line-2 bg-sunken",
        )}
      >
        <span className={cn("inline-block size-5 rounded-full bg-surface-1 shadow-e1 transition-transform duration-120", checked ? "translate-x-5" : "translate-x-0.5")} aria-hidden="true" />
      </button>
    </div>
  );
}

function Choice({ label, hint, value, onChange, options }: { label: string; hint?: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  const id = `setting-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <label htmlFor={id} className="text-body font-medium text-fg-1">
          {label}
        </label>
        {hint ? <p className="text-small text-fg-2">{hint}</p> : null}
      </div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-(--v5-control-h) min-w-44 rounded-control border border-line-2 bg-surface-1 px-2 text-body text-fg-1 focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/30"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

function TimeField({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const id = `setting-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-medium text-fg-1">
        {label}
      </label>
      <Input
        id={id}
        type="time"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (/^\d{2}:\d{2}$/.test(draft) && draft !== value) onSave(draft);
        }}
        className="max-w-40"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading shapes (Phase 8): the same layout as what replaces them
// ---------------------------------------------------------------------------

function ProgressSkeleton() {
  return (
    <div role="status" aria-label="Loading your progress" className="grid gap-(--v5-gap) lg:grid-cols-2">
      <div className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad) lg:col-span-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-4 h-20 w-full" />
        </div>
      ))}
      <span className="sr-only">Loading your progress</span>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Loading your settings" className="flex flex-col gap-(--v5-gap)">
      {[3, 2, 3].map((rows, i) => (
        <div key={i} className="flex flex-col gap-4 rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: rows }, (_, j) => (
            <div key={j} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="mt-1.5 h-3.5 w-3/4" />
              </div>
              <Skeleton className="h-7 w-12 rounded-full" />
            </div>
          ))}
        </div>
      ))}
      <span className="sr-only">Loading your settings</span>
    </div>
  );
}
