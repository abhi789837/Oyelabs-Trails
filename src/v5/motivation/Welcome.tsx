import { CalendarRange, MessageCircleQuestion, PlayCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/v5/design/components/Button";
import { Dialog } from "@/v5/design/components/Overlays";
import { WELCOME_STEPS } from "@shared/motivation";

const ICONS = { plan: CalendarRange, lessons: PlayCircle, ask: MessageCircleQuestion } as const;

/**
 * The first-run welcome: three short steps, skippable at any point (Skip, Escape, the close
 * button). Shown once; Me → Settings → "Replay the welcome" opens it again. No animation beyond
 * the dialog's own fade, which follows reduced motion.
 */
export function Welcome({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const step = WELCOME_STEPS[index];
  const last = index === WELCOME_STEPS.length - 1;
  const Icon = ICONS[step.id];

  const close = () => {
    setIndex(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={step.title}
      closeLabel="Skip the welcome"
      footer={
        <>
          {index > 0 ? (
            <Button variant="ghost" onClick={() => setIndex(index - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={close}>
              Skip
            </Button>
          )}
          <Button variant="primary" onClick={() => (last ? close() : setIndex(index + 1))} data-testid="welcome-next">
            {last ? "Start learning" : "Next"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4" data-testid="v5-welcome">
        <div className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand-fg" aria-hidden="true">
          <Icon className="size-6" />
        </div>
        <p className="text-body text-fg-1">{step.body}</p>
        <p className="text-caption text-fg-2" aria-live="polite">
          Step {index + 1} of {WELCOME_STEPS.length}
        </p>
        <ol className="flex gap-1.5" aria-hidden="true">
          {WELCOME_STEPS.map((s, i) => (
            <li key={s.id} className={i <= index ? "h-1.5 flex-1 rounded-full bg-brand" : "h-1.5 flex-1 rounded-full bg-sunken"} />
          ))}
        </ol>
      </div>
    </Dialog>
  );
}
