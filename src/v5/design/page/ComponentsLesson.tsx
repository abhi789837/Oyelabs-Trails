import { Captions, Gauge, MessageCircle, StickyNote } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/Button";
import { Callout, Flashcard, HintLadder, ReadingView, SplitView, TutorPanel, type TutorMessage } from "../components/Learning";
import { FeedbackPanel, LessonStepHeader, PlaylistSidebar, VideoPlayerFrame, type PlaylistEntry } from "../components/Lesson";
import { CertificatePreview } from "../components/Showcase";
import type { LessonStep, Rating } from "../lesson";
import { Demo, Preview } from "./scaffold";

const PLAYLIST: PlaylistEntry[] = [
  { id: "v1", title: "What the event loop is for", durationSec: 431, watched: true },
  { id: "v2", title: "The call stack, step by step", durationSec: 742, progress: 0.4 },
  { id: "v3", title: "Microtasks vs macrotasks, with a quiz", durationSec: 1105 },
];

function StepperDemo() {
  const [step, setStep] = useState<LessonStep>("read");
  const done = { watch: true, read: step !== "read" };
  return (
    <LessonStepHeader
      title="The event loop"
      current={step}
      done={done}
      secondsLeft={14 * 60}
      onStep={setStep}
      onNext={() => setStep("do")}
      nextDisabled={step === "do"}
      nextHint={step === "do" ? "Pass the checks to go on" : undefined}
    />
  );
}

function HintDemo() {
  const [attempts, setAttempts] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setAttempts((a) => a + 1)}>
          Run the checks
        </Button>
        <span className="text-caption text-fg-2">{attempts} run so far</span>
      </div>
      <HintLadder
        attempts={attempts}
        hints={{
          nudge: "What does the loop do while the call stack is still busy?",
          concept: "Promise callbacks go in the microtask queue, which empties before the next timer runs.",
          partial: (
            <pre className="overflow-x-auto rounded-md bg-sunken p-2 font-mono text-caption">{"queueMicrotask(() => log.push('b'));\nsetTimeout(() => log.push('c'));"}</pre>
          ),
        }}
        solution={<code className="font-mono">["a", "b", "c"]</code>}
      />
    </div>
  );
}

function TutorDemo() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <MessageCircle aria-hidden="true" /> Ask Oye
      </Button>
      <TutorPanel
        open={open}
        onOpenChange={setOpen}
        messages={messages}
        busy={busy}
        footnote="8 questions left today"
        onAsk={(q) => {
          setMessages((m) => [...m, { id: `q${m.length}`, role: "learner", body: q }]);
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            setMessages((m) => [...m, { id: `a${m.length}`, role: "tutor", body: "Good question. What do you think runs first: the timer or the promise? Look at which queue each one joins." }]);
          }, 900);
        }}
      />
    </>
  );
}

function FlashcardDemo() {
  const [last, setLast] = useState<Rating | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Flashcard
        front="What does a closure keep?"
        back="The variables from the scope where the function was created, even after that scope has finished."
        position="Card 3 of 12"
        intervals={{ 1: "10 min", 2: "1 day", 3: "3 days", 4: "8 days" }}
        onRate={setLast}
      />
      <p className="text-center text-caption text-fg-2" aria-live="polite">
        {last ? `Rated ${["", "Again", "Hard", "Good", "Easy"][last]}` : "Flip, then rate (keys 1 to 4)."}
      </p>
    </div>
  );
}

export default function ComponentsLesson() {
  return (
    <>
      <Demo id="c-stepper" name="LessonStepHeader" use="Watch, Read, Do, Check, in order. Done steps get a tick; later steps stay locked until the earlier ones are done, and Next says why it's waiting.">
        <Preview>
          <div className="-mx-4 pt-4 sm:-mx-5">
            <StepperDemo />
          </div>
        </Preview>
      </Demo>

      <Demo id="c-video" name="VideoPlayerFrame and PlaylistSidebar" use="The frame holds the YouTube player (the lesson screen wires it). The playlist shows what's watched and where you stopped.">
        <Preview>
          <div className="grid gap-3 pt-4 xl:grid-cols-[1fr_16rem]">
            <VideoPlayerFrame
              title="The call stack, step by step"
              ready={false}
              onPlay={() => undefined}
              controls={
                <>
                  <Button size="sm" variant="ghost">
                    <Gauge aria-hidden="true" /> 1x
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Captions aria-hidden="true" /> Captions
                  </Button>
                  <Button size="sm" variant="ghost">
                    <StickyNote aria-hidden="true" /> Note at 4:51
                  </Button>
                </>
              }
            />
            <PlaylistSidebar entries={PLAYLIST} currentId="v2" />
          </div>
        </Preview>
      </Demo>

      <Demo id="c-reading" name="ReadingView and Callout" use="Article type at a 68ch measure, key takeaways first, and three callouts: Tip, Watch out, and At Oyelabs (how we do it here).">
        <Preview single>
          <div className="pt-4">
            <ReadingView
              title="The event loop"
              meta="8 min read · Last checked 3 Oct 2026"
              takeaways={["JavaScript runs one thing at a time.", "Promises queue microtasks; timers queue tasks.", "All microtasks run before the next task."]}
            >
              <p>
                The browser runs your code on <strong>one thread</strong>. When something has to wait, such as a timer or a network call, the work is handed off and a
                callback is queued for later.
              </p>
              <h2>Two queues</h2>
              <p>
                After each task, the loop empties the <code>microtask</code> queue completely. That's why a resolved promise always beats <code>setTimeout(fn, 0)</code>.
              </p>
              <Callout kind="tip">Log the order before you guess it. It's faster than reasoning in your head.</Callout>
              <Callout kind="warning">A microtask that queues another microtask can starve the page: nothing paints until the queue is empty.</Callout>
              <Callout kind="oyelabs">In our React apps, keep heavy work out of effects; move it to a Web Worker.</Callout>
              <pre>
                <code>{"setTimeout(() => console.log('c'));\nPromise.resolve().then(() => console.log('b'));\nconsole.log('a');"}</code>
              </pre>
            </ReadingView>
          </div>
        </Preview>
      </Demo>

      <Demo id="c-split" name="SplitView" use="Instructions beside the editor. Drag the handle, or focus it and use the arrow keys. On a phone it becomes two tabs.">
        <Preview single>
          <div className="h-72 pt-4">
            <SplitView
              id="design-split-demo"
              leftLabel="Instructions"
              rightLabel="Your code"
              className="h-full"
              left={<div className="p-4 text-small text-fg-1">Write a function that returns the log order for the snippet.</div>}
              right={<pre className="h-full bg-[rgb(var(--editor))] p-4 font-mono text-small text-[rgb(var(--editor-foreground))]">{"export function order() {\n  return [];\n}"}</pre>}
            />
          </div>
        </Preview>
      </Demo>

      <Demo id="c-feedback" name="FeedbackPanel" use="After Check: what's right, what to fix, and why. Never just a red X.">
        <Preview>
          <div className="pt-4">
            <FeedbackPanel
              verdict="almost"
              right={["Logs 'a' first", "Handles an empty queue"]}
              fix={["'b' should come before 'c'"]}
              why="The promise callback is a microtask, so it runs before the timer's task."
              action={<Button size="sm" variant="primary">Try again</Button>}
            />
          </div>
        </Preview>
      </Demo>

      <Demo id="c-hints" name="HintLadder" use="Three hints, smallest first: a nudge, the idea, then part of the code. The full solution opens only after all three hints and two checks.">
        <Preview>
          <div className="pt-4">
            <HintDemo />
          </div>
        </Preview>
      </Demo>

      <Demo id="c-tutor" name="TutorPanel" use="Ask Oye: a side panel that keeps the lesson usable on a wide screen, a bottom sheet on a phone. It asks questions back instead of giving answers. Off during tests.">
        <Preview>
          <div className="pt-4">
            <TutorDemo />
          </div>
        </Preview>
      </Demo>

      <Demo id="c-flashcard" name="Flashcard" use="Space or click flips. Rate with Again, Hard, Good, Easy (or keys 1 to 4). Each button shows when the card comes back.">
        <Preview single>
          <div className="mx-auto max-w-lg pt-4">
            <FlashcardDemo />
          </div>
        </Preview>
      </Demo>

      <Demo id="c-certificate" name="CertificatePreview" use="Always light, like the PDF. The check URL is printed as text so a paper copy can still be verified.">
        <Preview single>
          <div className="mx-auto max-w-2xl pt-4">
            <CertificatePreview holderName="Rahul Mehta" title="Backend foundations" kind="Track" issuedAt="5 October 2026" certId="OYE-7K2Q-91" verifyUrl="learn.oyelabs.com/verify/OYE-7K2Q-91" />
          </div>
        </Preview>
      </Demo>
    </>
  );
}
