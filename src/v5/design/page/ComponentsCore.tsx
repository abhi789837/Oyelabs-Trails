import { ArrowRight, Clock, Flame, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/Button";
import { Card, CardHeader } from "../components/Card";
import { Field, Input, Textarea } from "../components/Field";
import { Avatar, Badge, Kbd, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Primitives";
import { Tooltip } from "../components/Tooltip";
import { StatTile } from "../components/Stats";
import { Demo, Preview } from "./scaffold";

function FieldDemo({ theme }: { theme: string }) {
  const [email, setEmail] = useState("rahul@oyelabs");
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Field label="Work email" hint="We send your weekly recap here." error={email.includes(".") ? undefined : "Add the part after the @, like oyelabs.com."}>
        <Input id={`demo-email-${theme}`} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="What do you want to get better at?" optional>
        <Textarea id={`demo-goal-${theme}`} placeholder="For example: writing tests for our API" />
      </Field>
    </div>
  );
}

export default function ComponentsCore() {
  return (
    <>
      <Demo
        id="c-button"
        name="Button"
        use={
          <>
            One <strong>primary</strong> button per view: the next thing to do. Labels say what happens ("Send the test", "Start lesson"), never "Submit" or "OK". Icon-only
            buttons need an aria-label. Loading keeps the label so the button doesn't jump.
          </>
        }
      >
        <Preview>
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <Button variant="primary">
              Start lesson <ArrowRight aria-hidden="true" />
            </Button>
            <Button>Save for later</Button>
            <Button variant="ghost">Skip</Button>
            <Button variant="danger">
              <Trash2 aria-hidden="true" /> Remove
            </Button>
            <Button variant="success">Mark as done</Button>
            <Button variant="achievement">Claim certificate</Button>
            <Button variant="link">See all</Button>
            <Button variant="primary" loading>
              Saving
            </Button>
            <Button size="icon" aria-label="Add a note">
              <Plus aria-hidden="true" />
            </Button>
            <Button size="sm">Small</Button>
            <Button size="lg" variant="primary">
              Large
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </Preview>
      </Demo>

      <Demo id="c-field" name="Field and Input" use="Label above, hint under the label, error right under the field in plain words that say how to fix it. What the person typed stays.">
        <Preview>{(theme) => <FieldDemo theme={theme} />}</Preview>
      </Demo>

      <Demo id="c-tabs" name="Tabs" use="Switch between views of the same thing. Arrow keys move between tabs. Not for steps in a flow (use LessonStepHeader).">
        <Preview>
          <Tabs defaultValue="week" className="pt-4">
            <TabsList>
              <TabsTrigger value="week">This week</TabsTrigger>
              <TabsTrigger value="all">Whole plan</TabsTrigger>
              <TabsTrigger value="done">Done</TabsTrigger>
            </TabsList>
            <TabsContent value="week" className="text-small text-fg-2">
              Five waypoints this week, about 3 hours.
            </TabsContent>
            <TabsContent value="all" className="text-small text-fg-2">
              Twelve weeks, 48 waypoints.
            </TabsContent>
            <TabsContent value="done" className="text-small text-fg-2">
              Nine done so far.
            </TabsContent>
          </Tabs>
        </Preview>
      </Demo>

      <Demo id="c-tooltip" name="Tooltip, Kbd, Badge, Avatar" use="Tooltips name an icon; they never hold the only copy of anything. Badges are a status word, so colour is never the only signal.">
        <Preview>
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Tooltip content="Add a timestamped note">
                <Button size="icon" aria-label="Add a note">
                  <Plus aria-hidden="true" />
                </Button>
              </Tooltip>
              <span className="text-small text-fg-2">
                Open search with <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Draft</Badge>
              <Badge tone="brand">New</Badge>
              <Badge tone="success">Passed</Badge>
              <Badge tone="warning">Due soon</Badge>
              <Badge tone="danger">Overdue</Badge>
              <Badge tone="info">In review</Badge>
              <Badge tone="outline">Optional</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Avatar name="Rahul Mehta" size="sm" />
              <Avatar name="Priya Shah" />
              <Avatar name="Ana" size="lg" />
            </div>
          </div>
        </Preview>
      </Demo>

      <Demo id="c-card" name="Card and StatTile" use="A card groups one thing. Don't nest cards. StatTile is one number and its label; the detail line says what the number means.">
        <Preview>
          <div className="flex flex-col gap-(--v5-gap) pt-4">
            <Card>
              <CardHeader title="Closures" description="Must know · 20 min" action={<Button size="sm">Open</Button>} />
              <p className="text-small text-fg-2">A function that remembers the variables around it, even after the outer function has returned.</p>
            </Card>
            <div className="grid grid-cols-2 gap-(--v5-gap)">
              <StatTile label="This week" value="2 h 10 min" detail="40 min to your goal" icon={<Clock />} />
              <StatTile label="Streak" value="4 weeks" detail="Up 1 from last week" trend="up" icon={<Flame />} />
              <StatTile label="Topics done" value="18" icon={<Target />} />
              <StatTile label="Tests passed" value="3 of 4" detail="1 to retake" trend="down" />
            </div>
          </div>
        </Preview>
      </Demo>
    </>
  );
}
