/**
 * The v5 design system. Import from here (`@/v5/design`) in v5 code only.
 *
 * Importing this module loads the v5 code font (JetBrains Mono; Outfit is already global)
 * and the scoped tokens. Both land in the lazy v5 CSS chunk, never in the old UI's stylesheet.
 * Call `useV5Root()` once at the top of the v5 tree and wrap it in `V5MotionProvider`.
 *
 * Heavy pieces are NOT exported here, to keep this barrel small: `V5DataTable` (pulls the
 * TanStack Table kit) is imported from `@/v5/design/components/DataTable`.
 */
import "./styles";

export { cn } from "./cn";
export { useV5Root, type V5RootOptions } from "./useV5Root";
export { V5MotionProvider, useMotionPref } from "./V5MotionProvider";
export * from "./motion";
export * from "./density";
export { useIsMobile, useMediaQuery, usePrefersReducedMotion } from "./hooks";

export { Button, buttonVariants, type ButtonProps } from "./components/Button";
export { Field, Input, Textarea, type FieldProps } from "./components/Field";
export { Avatar, Badge, Kbd, Tabs, TabsContent, TabsList, TabsTrigger, badgeVariants, initialsOf } from "./components/Primitives";
export { Tooltip, TooltipProvider } from "./components/Tooltip";
export { Card, CardHeader, type CardProps } from "./components/Card";
export { ProgressBar, type ProgressBarProps, type ProgressTone } from "./components/Progress";
// The goal ring is the brand's own (the mark's rings and the "you are here" dot).
export { ProgressRing, type ProgressRingProps } from "@/components/brand/ProgressRing";
export { SkillMeter, StatTile, StreakFlame, XPCounter, type StatTileProps, type StreakFlameProps } from "./components/Stats";
export { LANES, LANE_CLASSES, LaneChip, v5LaneColor } from "./components/LaneChip";
export { Trail, Waypoint, type TrailProps, type WaypointProps } from "./components/Trail";
export { ContourBackground, EmptyState, ErrorState, Skeleton, SkeletonLayout, type SkeletonVariant } from "./components/States";
export { CommandPalette, Dialog, Sheet, V5Toaster, useCommandShortcut, v5Toast, type CommandGroup, type CommandItem } from "./components/Overlays";
export { FeedbackPanel, LessonStepHeader, PlaylistSidebar, StatusLine, VideoPlayerFrame, type PlaylistEntry } from "./components/Lesson";
export { Callout, Flashcard, HintLadder, ReadingView, Takeaways, TutorPanel, type TutorMessage } from "./components/Learning";
export { SplitView, type SplitViewProps } from "./components/SplitView";
export { Celebration, CertificatePreview, Logo } from "./components/Showcase";
export { SkipLink } from "./components/SkipLink";
export { AppShell, type AppShellProps, type LinkLike, type NavItem } from "./components/AppShell";

export type { TrailStop } from "./trail";
export * from "./lesson";
export * from "./progress";
