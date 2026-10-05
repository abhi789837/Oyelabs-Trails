import { BookOpen, CalendarRange, CheckCircle2, Library, Repeat, Sun, Trophy } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/Button";
import { Field, Input } from "../components/Field";
import { StatusLine } from "../components/Lesson";
import { CommandPalette, Dialog, Sheet, v5Toast } from "../components/Overlays";
import { Celebration } from "../components/Showcase";
import { EmptyState, ErrorState, SkeletonLayout, type SkeletonVariant } from "../components/States";
import { Demo, Preview } from "./scaffold";

function OverlayDemo({ theme }: { theme: string }) {
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [palette, setPalette] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  return (
    <div className="flex flex-wrap gap-2 pt-4">
      <Button onClick={() => setDialog(true)}>Open a dialog</Button>
      <Button onClick={() => setSheet(true)}>Open a sheet</Button>
      <Button onClick={() => setPalette(true)}>Open search</Button>
      <Button onClick={() => v5Toast.success("Note saved", "You can find it under Me, Notes.")}>Show a toast</Button>
      <Button onClick={() => v5Toast.undo("Removed from your plan", () => v5Toast.info("Put back"))}>Toast with Undo</Button>
      <Button variant="primary" onClick={() => setCelebrate(true)}>
        <Trophy aria-hidden="true" /> Celebrate
      </Button>

      <Dialog
        open={dialog}
        onOpenChange={setDialog}
        title="Leave this lesson?"
        description="Your place in the video is saved. You can pick up where you left off."
        footer={
          <>
            <Button onClick={() => setDialog(false)}>Stay</Button>
            <Button variant="primary" onClick={() => setDialog(false)}>
              Leave for now
            </Button>
          </>
        }
      />
      <Sheet
        open={sheet}
        onOpenChange={setSheet}
        title="Rahul Mehta"
        description="Backend engineer · joined 12 Aug"
        footer={
          <Button variant="primary" onClick={() => setSheet(false)}>
            Send a nudge
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-small text-fg-2">A side panel on a wide screen, a bottom sheet on a phone. Escape or the close button dismisses it.</p>
          <Field label="Note for Rahul">
            <Input id={`sheet-note-${theme}`} placeholder="Great progress this week" />
          </Field>
        </div>
      </Sheet>
      <CommandPalette
        open={palette}
        onOpenChange={setPalette}
        groups={[
          {
            heading: "Go to",
            items: [
              { id: "today", label: "Today", icon: <Sun />, shortcut: ["G", "T"], onSelect: () => undefined },
              { id: "plan", label: "My plan", icon: <CalendarRange />, shortcut: ["G", "P"], onSelect: () => undefined },
              { id: "library", label: "Library", icon: <Library />, onSelect: () => undefined },
              { id: "review", label: "Review", icon: <Repeat />, hint: "12 cards due", onSelect: () => undefined },
            ],
          },
          {
            heading: "Lessons",
            items: [
              { id: "closures", label: "Closures", icon: <BookOpen />, hint: "JavaScript core", onSelect: () => undefined },
              { id: "event-loop", label: "The event loop", icon: <BookOpen />, hint: "JavaScript core", onSelect: () => undefined },
            ],
          },
        ]}
      />
      <Celebration open={celebrate} onDone={() => setCelebrate(false)} title="Lesson done" detail="+30 XP · 3 lessons left this week" icon={<CheckCircle2 />} />
    </div>
  );
}

const SKELETONS: SkeletonVariant[] = ["card", "list", "stat-row", "table", "lesson", "article"];

export default function ComponentsFeedback() {
  const [retrying, setRetrying] = useState(false);
  return (
    <>
      <Demo id="c-status" name="StatusLine" use="What is true right now, in one sentence, and the one thing to do about it. Use it at the top of a screen instead of a banner wall.">
        <Preview>
          <div className="flex flex-col gap-2 pt-4">
            <StatusLine tone="info" action={<Button size="sm" variant="primary">Continue</Button>}>
              You're 12 minutes into "The event loop".
            </StatusLine>
            <StatusLine tone="success">You met this week's goal. Your streak is 5 weeks.</StatusLine>
            <StatusLine tone="warning" action={<Button size="sm">See what's due</Button>}>
              Two lessons are due by Friday.
            </StatusLine>
          </div>
        </Preview>
      </Demo>

      <Demo id="c-empty" name="EmptyState and ErrorState" use="Empty: say what this place is for and how to fill it. Error: plain words, no codes up front, say the work is safe, offer Try again. Codes go under Show details.">
        <Preview>
          <div className="grid gap-3 pt-4 md:grid-cols-2">
            <EmptyState icon={<Repeat />} title="Nothing to review today" body="Cards come back here when it's the right time to remember them. Check again tomorrow." action={<Button size="sm">Browse the library</Button>} />
            <ErrorState
              onRetry={() => {
                setRetrying(true);
                window.setTimeout(() => setRetrying(false), 1200);
              }}
              retrying={retrying}
              details="GET /api/me/week → 503"
            />
          </div>
        </Preview>
      </Demo>

      <Demo id="c-skeleton" name="Skeleton" use="Shaped like what replaces it, so nothing jumps. Show only after about 300 ms; under that, show nothing. The shimmer stops with reduced motion.">
        <Preview single>
          <div className="grid gap-4 pt-4 md:grid-cols-2">
            {SKELETONS.map((v) => (
              <div key={v}>
                <p className="mb-2 font-mono text-caption text-fg-2">{v}</p>
                <SkeletonLayout variant={v} rows={3} label={`Loading (${v} example)`} />
              </div>
            ))}
          </div>
        </Preview>
      </Demo>

      <Demo
        id="c-overlays"
        name="Dialog, Sheet, Toast, CommandPalette, Celebration"
        use="Dialog: a question that blocks. Sheet: details next to a list (bottom sheet on a phone, no swipe library). Toast: something that happened. Search: Ctrl K. Celebration: 2 s at most, skippable, still under reduced motion."
      >
        <Preview>{(theme) => <OverlayDemo theme={theme} />}</Preview>
      </Demo>
    </>
  );
}
