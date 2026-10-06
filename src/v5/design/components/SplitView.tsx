import type { ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "../cn";
import { useIsMobile } from "../hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Primitives";

// Its own module (moved out of Learning.tsx), so react-resizable-panels loads only where a split
// view is drawn (the lesson's Do step), not with every callout or reading view.

// ---------------------------------------------------------------------------
// SplitView — resizable on desktop, tabs on mobile
// ---------------------------------------------------------------------------

export interface SplitViewProps {
  left: ReactNode;
  right: ReactNode;
  leftLabel: string;
  rightLabel: string;
  /** Initial left share, in percent. */
  defaultLeft?: number;
  /** Persists the layout under this id (localStorage via react-resizable-panels). */
  id?: string;
  className?: string;
}

export function SplitView({ left, right, leftLabel, rightLabel, defaultLeft = 45, id, className }: SplitViewProps) {
  const mobile = useIsMobile();
  if (mobile) {
    return (
      <Tabs defaultValue="left" className={cn("flex min-h-0 flex-col", className)}>
        <TabsList className="self-start">
          <TabsTrigger value="left">{leftLabel}</TabsTrigger>
          <TabsTrigger value="right">{rightLabel}</TabsTrigger>
        </TabsList>
        <TabsContent value="left" className="min-h-0 flex-1">
          {left}
        </TabsContent>
        <TabsContent value="right" className="min-h-0 flex-1">
          {right}
        </TabsContent>
      </Tabs>
    );
  }
  return (
    <Group orientation="horizontal" id={id} className={cn("min-h-0 rounded-card border border-line-1 bg-surface-1", className)}>
      <Panel defaultSize={`${defaultLeft}`} minSize="25" className="min-h-0 overflow-auto" aria-label={leftLabel}>
        {left}
      </Panel>
      <Separator
        aria-label={`Resize ${leftLabel} and ${rightLabel}`}
        className="group relative w-3 shrink-0 cursor-col-resize outline-none focus-visible:bg-brand-soft"
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line-1 transition-colors group-hover:bg-brand group-focus-visible:bg-brand" />
        <span className="absolute left-1/2 top-1/2 h-8 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-line-2 group-hover:bg-brand" />
      </Separator>
      <Panel minSize="25" className="min-h-0 overflow-auto" aria-label={rightLabel}>
        {right}
      </Panel>
    </Group>
  );
}

