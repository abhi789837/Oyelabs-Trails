import type { ReactNode } from "react";

import type {
  AssessmentStatus,
  CredentialStatus,
  ItemStatus,
  JobStatus,
  Role,
  Severity,
  TopicStatus,
  UserStatus,
} from "@shared/enums";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * One badge for every status the app has.
 *
 * Before this existed the same enum was drawn four different ways — `AssessmentStatus` appeared as
 * a toned pill on one screen, an untoned pill on another, raw snake_case text on a third — so a
 * learner's state read differently depending on which page you were standing on. The registry
 * below is keyed by enum, which means TypeScript fails the build if a value is added to
 * `shared/enums.ts` and not given a label and a tone here.
 *
 * The tones are the trail vocabulary, not new colours: trailmark for in flight, summit for
 * arrived, basalt for quiet, destructive for gone wrong. `brand` marks an identity (a role), which
 * is the one thing in this list that is not a state.
 */

type Tone = BadgeProps["variant"];

interface Entry {
  label: string;
  tone: Tone;
  /** Allowed to pulse — but only when the caller says the thing is live. See `live` below. */
  pulse?: boolean;
}

interface StatusKinds {
  user: UserStatus;
  assessment: AssessmentStatus;
  credential: CredentialStatus;
  job: JobStatus;
  item: ItemStatus;
  severity: Severity;
  topic: TopicStatus;
  role: Role;
}

export type StatusKind = keyof StatusKinds;

const registry: { [K in StatusKind]: Record<StatusKinds[K], Entry> } = {
  user: {
    active: { label: "Active", tone: "success" },
    disabled: { label: "Disabled", tone: "outline" },
  },
  assessment: {
    generating: { label: "Generating", tone: "progress" },
    awaiting_approval: { label: "Awaiting approval", tone: "progress" },
    ready: { label: "Ready", tone: "success" },
    in_progress: { label: "In progress", tone: "progress" },
    submitted: { label: "Submitted", tone: "progress" },
    evaluating: { label: "Evaluating", tone: "progress" },
    completed: { label: "Completed", tone: "success" },
    terminated: { label: "Terminated", tone: "danger" },
    failed: { label: "Failed", tone: "danger" },
  },
  credential: {
    unverified: { label: "Not verified", tone: "outline" },
    verified: { label: "Verified", tone: "success" },
    failed: { label: "Failed", tone: "danger" },
  },
  job: {
    queued: { label: "Queued", tone: "outline" },
    running: { label: "Running", tone: "progress" },
    done: { label: "Done", tone: "success" },
    failed: { label: "Failed", tone: "danger" },
  },
  item: {
    pool: { label: "In pool", tone: "outline" },
    served: { label: "Served", tone: "progress" },
    answered: { label: "Answered", tone: "success" },
    skipped: { label: "Skipped", tone: "outline" },
    dropped: { label: "Dropped", tone: "danger" },
  },
  severity: {
    soft: { label: "Soft", tone: "progress" },
    /* A hard warning is the only status allowed to move, and only while it is happening. */
    hard: { label: "Hard", tone: "danger", pulse: true },
  },
  topic: {
    "not-started": { label: "Not started", tone: "outline" },
    "in-progress": { label: "In progress", tone: "progress" },
    completed: { label: "Completed", tone: "success" },
  },
  role: {
    superadmin: { label: "Super admin", tone: "brand" },
    learner: { label: "Learner", tone: "outline" },
  },
};

/** The label and tone for a status, for the rare place that needs the words without the pill. */
export function statusMeta<K extends StatusKind>(kind: K, status: StatusKinds[K]): Entry {
  return registry[kind][status];
}

export interface StatusBadgeProps<K extends StatusKind> {
  kind: K;
  status: StatusKinds[K];
  /**
   * `true` only when this badge describes something happening right now — a running assessment,
   * an open SSE feed. A historical log of past events must leave this off, or a screen full of
   * finished incidents blinks at the reader for no reason.
   */
  live?: boolean;
  /** The trail's own badges predate the dot and stay dotless so they do not shift. */
  dot?: boolean;
  className?: string;
  /** Extra detail after the label — a score, an `sr-only` explanation. */
  children?: ReactNode;
}

export function StatusBadge<K extends StatusKind>({
  kind,
  status,
  live = false,
  dot = true,
  className,
  children,
}: StatusBadgeProps<K>) {
  const entry = registry[kind][status];
  return (
    <Badge variant={entry.tone} className={className}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full bg-current",
            live && entry.pulse && "animate-status-pulse",
          )}
        />
      )}
      {entry.label}
      {children}
    </Badge>
  );
}
