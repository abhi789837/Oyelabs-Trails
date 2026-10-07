import { Award, CheckCircle2, Mountain, Sparkles, TrendingUp, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/v5/design/cn";
import { Sheet } from "@/v5/design/components/Overlays";
import { Celebration } from "@/v5/design/components/Showcase";
import { usePrefersReducedMotion } from "@/v5/design/hooks";
import { clampCelebrationMs } from "@/v5/design/motion";
import { V5MotionProvider } from "@/v5/design/V5MotionProvider";
import { celebrationMode, shouldShowWelcome, type CelebrationKind, type MotivationPrefs, type MotivationSummary } from "@shared/motivation";

import { motivationApi } from "./api";
import { subscribeMotivation, type MotivationCommand } from "./celebrate";
import { claimOnce, celebrationKey, digestEvents, toPending, type PendingCelebration } from "./logic";
import { NotificationBell } from "./NotificationBell";
import { SummitRing } from "./SummitRing";
import { TeamBoard, WeeklyGoalField } from "./ProgressPanel";
import { Welcome } from "./Welcome";

const ICONS: Record<CelebrationKind, ReactNode> = {
  lesson: <CheckCircle2 />,
  level_up: <TrendingUp />,
  weekly_summit: <Mountain />,
  certificate: <Award />,
};

/** Re-reads are throttled: navigation, focus and `refreshMotivation()` all ask, at most this often. */
const MIN_GAP_MS = 1500;

const LESSON_ONLY: ReadonlySet<CelebrationKind> = new Set(["lesson"]);
const NONE: ReadonlySet<CelebrationKind> = new Set();

const isLearnerPath = (path: string) => path === "/learn" || path.startsWith("/learn/");

/**
 * The motivation host (lazy, mounted once by V5App through `MotivationHost`). It owns:
 * - the learner top bar's XP button ("+30 XP" when an award arrives) and notification bell,
 *   placed over the shell header's right end, just left of the account menu;
 * - celebrations, from `celebrate()` calls and from milestone XP it notices on its own;
 * - the first-run welcome and the "Your progress" panel (weekly goal, opt-in team board).
 */
export default function HostImpl() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const systemReduce = usePrefersReducedMotion();

  const [summary, setSummary] = useState<MotivationSummary | null>(null);
  const [gained, setGained] = useState<{ amount: number; id: number } | null>(null);
  const [queue, setQueue] = useState<PendingCelebration[]>([]);
  const [progressOpen, setProgressOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  const since = useRef<number | null>(null);
  const seen = useRef(new Set<string>());
  const celebrated = useRef(new Set<string>());
  const lastLoad = useRef(0);
  const welcomeHandled = useRef(false);
  const replayKey = useRef<string | null>(null);
  const tzSynced = useRef(false);
  const counter = useRef(0);
  const trailing = useRef<number | null>(null);
  const loadRef = useRef<(force?: boolean) => Promise<void>>(async () => undefined);
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  const enqueue = useCallback((item: PendingCelebration) => setQueue((q) => (q.some((x) => x.key === item.key) ? q : [...q, item].slice(-3))), []);

  const load = useCallback(
    async (force = false) => {
      const at = Date.now();
      const wait = MIN_GAP_MS - (at - lastLoad.current);
      if (!force && wait > 0) {
        // Too soon: read once more when the gap has passed, so a quick navigation isn't missed.
        if (trailing.current === null) {
          trailing.current = window.setTimeout(() => {
            trailing.current = null;
            void loadRef.current(true);
          }, wait);
        }
        return;
      }
      lastLoad.current = at;
      try {
        const prev = since.current;
        const res = await motivationApi.summary(prev === null ? null : Math.max(0, prev - 1));
        since.current = res.serverTime;
        setSummary(res);
        if (prev === null) return;
        // On the lesson route the player shows its own "Lesson finished"; don't add a second one.
        const suppress = pathRef.current.startsWith("/learn/lesson/") ? LESSON_ONLY : NONE;
        const digest = digestEvents(res.events, seen.current, celebrated.current, suppress);
        if (digest.gained > 0) setGained({ amount: digest.gained, id: at });
        if (digest.celebration) enqueue(digest.celebration);
      } catch {
        // Quiet: the top bar keeps what it had. Nothing here blocks learning.
      }
    },
    [enqueue],
  );

  useEffect(() => {
    loadRef.current = load;
    return () => {
      if (trailing.current !== null) window.clearTimeout(trailing.current);
      trailing.current = null;
    };
  }, [load]);

  // Read on arrival, on every navigation (throttled) and when the tab comes back.
  useEffect(() => {
    void load();
  }, [load, location.pathname, location.search]);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  // Commands from other screens.
  useEffect(
    () =>
      subscribeMotivation((command: MotivationCommand) => {
        if (command.type === "refresh") void load(true);
        else if (command.type === "open-progress") setProgressOpen(true);
        else {
          const { kind, options } = command;
          if (options.once && !claimOnce(options.once)) return;
          const key = celebrationKey(kind, options.ref);
          if (key) {
            if (celebrated.current.has(key)) return;
            celebrated.current.add(key);
          }
          counter.current += 1;
          enqueue(toPending(kind, options, `${kind}:call-${counter.current}`));
          window.setTimeout(() => void load(true), 400);
        }
      }),
    [enqueue, load],
  );

  // The "+30 XP" chip fades after a moment.
  useEffect(() => {
    if (!gained) return;
    const id = window.setTimeout(() => setGained(null), 2600);
    return () => window.clearTimeout(id);
  }, [gained]);

  // Remember the learner's time zone, so "18:00" reminders mean their 18:00.
  useEffect(() => {
    if (!summary || tzSynced.current) return;
    tzSynced.current = true;
    let zone: string | undefined;
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      zone = undefined;
    }
    if (zone && zone !== summary.prefs.timeZone) void motivationApi.savePrefs({ timeZone: zone }).catch(() => undefined);
  }, [summary]);

  // The welcome: once, on Today, for learners; or whenever ?welcome=1 asks for it.
  useEffect(() => {
    if (!summary || welcomeOpen) return;
    const replay = new URLSearchParams(location.search).get("welcome") === "1" && replayKey.current !== location.key;
    if (!replay && (welcomeHandled.current || user?.role !== "learner")) return;
    // Each `?welcome=1` visit opens it once (closing removes the query, a beat later).
    if (replay) replayKey.current = location.key;
    if (shouldShowWelcome({ welcomeDoneAt: summary.prefs.welcomeDoneAt, pathname: location.pathname, search: location.search })) {
      welcomeHandled.current = true;
      setWelcomeOpen(true);
    }
  }, [summary, location.pathname, location.search, location.key, user?.role, welcomeOpen]);

  const closeWelcome = () => {
    setWelcomeOpen(false);
    welcomeHandled.current = true;
    setSummary((s) => (s ? { ...s, prefs: { ...s.prefs, welcomeDoneAt: s.prefs.welcomeDoneAt ?? Date.now() } } : s));
    void motivationApi.savePrefs({ welcomeDone: true }).catch(() => undefined);
    const params = new URLSearchParams(location.search);
    if (params.get("welcome") === "1") {
      params.delete("welcome");
      const rest = params.toString();
      navigate(`${location.pathname}${rest ? `?${rest}` : ""}`, { replace: true });
    }
  };

  const setPrefs = useCallback((prefs: MotivationPrefs) => setSummary((s) => (s ? { ...s, prefs } : s)), []);
  const markRead = useCallback(() => setSummary((s) => (s ? { ...s, unread: 0 } : s)), []);

  const mode = summary ? celebrationMode({ celebrations: summary.prefs.celebrations, reducedMotion: summary.prefs.reducedMotion, systemReduce }) : null;
  useEffect(() => {
    if (mode === "off" && queue.length) setQueue([]);
  }, [mode, queue.length]);
  const current = !welcomeOpen && mode && mode !== "off" ? (queue[0] ?? null) : null;
  const finish = useCallback(() => setQueue((q) => q.slice(1)), []);

  const onLearner = isLearnerPath(location.pathname);

  return (
    <V5MotionProvider reducedMotion={summary?.prefs.reducedMotion ?? "system"}>
      {onLearner && summary ? (
        // Left of the shell's account menu (a 40 px button inside the header's 16/24 px padding).
        <aside aria-label="Your progress and notifications" className="fixed right-[3.75rem] top-0 z-30 flex h-14 items-center gap-1 sm:right-[4.25rem]" data-testid="v5-topbar-motivation">
          <span aria-live="polite" className="text-caption font-semibold text-success-fg">
            {gained ? (
              <span key={gained.id} className="rounded-full bg-success-soft px-2 py-0.5" data-testid="xp-gained">
                +{gained.amount} XP
              </span>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => setProgressOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-control px-2.5 text-small font-semibold tabular-nums text-fg-1 hover:bg-sunken"
            data-testid="v5-xp-button"
            aria-label={`Your progress: ${summary.xp.total.toLocaleString("en-US")} XP`}
          >
            <Sparkles className="size-4 text-brand-fg" aria-hidden="true" />
            {summary.xp.total.toLocaleString("en-US")} XP
          </button>
          <NotificationBell unread={summary.unread} onRead={markRead} />
        </aside>
      ) : null}

      {summary ? (
        <Sheet open={progressOpen} onOpenChange={setProgressOpen} title="Your progress" description="Your XP, your weekly goal and, if your team uses it, the team board." width="sm">
          <div className="flex flex-col gap-6">
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-card border border-line-1 bg-surface-1 p-3">
                <dt className="text-caption text-fg-2">All time</dt>
                <dd className="font-display text-h3 font-semibold tabular-nums text-fg-1">{summary.xp.total.toLocaleString("en-US")} XP</dd>
              </div>
              <div className="rounded-card border border-line-1 bg-surface-1 p-3">
                <dt className="text-caption text-fg-2">This week</dt>
                <dd className="font-display text-h3 font-semibold tabular-nums text-fg-1">{summary.xp.thisWeek.toLocaleString("en-US")} XP</dd>
              </div>
            </dl>
            <WeeklyGoalField prefs={summary.prefs} onSaved={setPrefs} defaultMinutes={summary.defaultGoalMinutes ?? null} />
            {summary.leaderboards ? <TeamBoard prefs={summary.prefs} onSaved={setPrefs} /> : null}
          </div>
        </Sheet>
      ) : null}

      <Welcome open={welcomeOpen} onClose={closeWelcome} />

      {current && mode === "animated" ? (
        <Celebration key={current.key} open onDone={finish} title={current.title} detail={current.detail} icon={ICONS[current.kind]} badge={current.kind === "weekly_summit" ? <SummitRing /> : undefined} durationMs={current.durationMs} confetti={current.confetti} />
      ) : current && mode === "static" ? (
        <StaticCelebration key={current.key} item={current} onDone={finish} />
      ) : null}
    </V5MotionProvider>
  );
}

/** Reduced motion: the same words as a still badge. Same 2 s cap; Escape, click or Skip closes it. */
function StaticCelebration({ item, onDone }: { item: PendingCelebration; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, clampCelebrationMs(item.durationMs));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onDone]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4" data-testid="celebration-static">
      <div role="status" aria-live="polite" className="pointer-events-auto flex items-center gap-3 rounded-card border border-line-1 bg-surface-3 py-2.5 pl-3 pr-2 shadow-e3">
        {item.kind === "weekly_summit" ? (
          <span className="grid size-9 place-items-center" aria-hidden="true">
            <SummitRing size={36} still />
          </span>
        ) : (
          <span className={cn("grid size-9 place-items-center rounded-full bg-progress-soft text-progress-fg [&_svg]:size-5")} aria-hidden="true">
            {ICONS[item.kind]}
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-small font-semibold text-fg-1">{item.title}</span>
          {item.detail ? <span className="block text-caption text-fg-2">{item.detail}</span> : null}
        </span>
        <button type="button" onClick={onDone} className="ml-1 inline-flex min-h-8 items-center gap-1 rounded-control px-2 text-small font-medium text-fg-2 hover:bg-sunken hover:text-fg-1">
          <X className="size-3.5" aria-hidden="true" /> Skip
        </button>
      </div>
    </div>
  );
}
