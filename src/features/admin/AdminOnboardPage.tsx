import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, Plus, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { ClaimedSkill, LearnerProfile } from "@shared/profile";
import type { SkillLevel, TrackIdValue } from "@shared/enums";

import type { AccentToken } from "@/types/curriculum";

import { ApiRequestError } from "@/api/client";
import { Field, FormAlert, NumberField, PasswordField, TextField } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useTracks } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { duration, transition } from "@/lib/motion";
import { passwordStrength } from "@/lib/password-strength";
import { accentClasses } from "@/lib/accent";
import { cn } from "@/lib/utils";
import { adminApi } from "./api";
import { TemporaryPasswordNotice } from "./TemporaryPasswordNotice";

const LEVEL_LABELS: Record<SkillLevel, string> = {
  1: "Aware",
  2: "Can follow",
  3: "Can build",
  4: "Can design",
  5: "Can teach",
};

/** What the notes field is worth aiming at. Not a limit — the server does not cap it. */
const NOTES_TARGET = 400;

const emptyProfile: LearnerProfile = {
  roleTitle: null,
  yearsExperience: null,
  adminNotes: "",
  claimedSkills: [],
  targetTracks: [],
};

type StepId = "account" | "profile" | "skills" | "trails" | "review";

const STEPS: { id: StepId; name: string; blurb: string }[] = [
  { id: "account", name: "Account", blurb: "Who they are and how they sign in." },
  { id: "profile", name: "Profile", blurb: "What you know before they are tested." },
  { id: "skills", name: "Skills", blurb: "Your estimate of where they stand." },
  { id: "trails", name: "Trails", blurb: "Where you want them to end up." },
  { id: "review", name: "Review", blurb: "One last read before the account exists." },
];

/**
 * Onboarding (brief §13), as five steps rather than one long form.
 *
 * The form is split because the fields are not equally considered: a username is typed in seconds,
 * and the notes field — the single largest input to the AI blueprint — deserves a screen where it is
 * the only thing to look at. A wall of eight sections encourages skimming past exactly the field
 * that matters most.
 *
 * ## Two things this page does not do
 *
 * - **It does not validate the password itself.** `server/src/auth/password.ts` is the authority;
 *   `passwordStrength` mirrors it rule for rule and the meter reads from that one function, so the
 *   checklist and the 400 can never disagree. The submit button is not gated on the meter either —
 *   the server decides, and a client that refuses to submit something the server would accept is a
 *   bug that is invisible until someone complains.
 * - **It does not ask the server whether a username is free.** There is no such endpoint, and adding
 *   one would be a username oracle. A superadmin can already list every account, so the check runs
 *   against that list — which is honest about being a warning rather than a guarantee, because the
 *   real answer is the 409 on submit.
 */
export default function AdminOnboardPage() {
  useDocumentTitle("Onboard a learner");
  const navigate = useNavigate();
  // A superadmin's manifest is unfiltered, so this is the whole curriculum.
  const tracks = useTracks();

  const [step, setStep] = useState<StepId>("account");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [passwordMode, setPasswordMode] = useState<"generate" | "set">("generate");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<LearnerProfile>(emptyProfile);
  const [issueAssessment, setIssueAssessment] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);
  const [takenUsernames, setTakenUsernames] = useState<Set<string> | null>(null);

  // The existing roster, for the availability hint. A failure here is silent on purpose: the hint
  // is a convenience, and an error banner about it would be noise on a form that is otherwise fine.
  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .listUsers(controller.signal)
      .then((r) => setTakenUsernames(new Set(r.users.map((u) => u.username.toLowerCase()))))
      .catch(() => setTakenUsernames(null));
    return () => controller.abort();
  }, []);

  // The superadmin sees the full curriculum, so the module list is a fine source of skill areas.
  const areaOptions = useMemo(
    () => tracks.flatMap((track) => track.modules.filter((m) => m.available).map((m) => m.name)).sort(),
    [tracks],
  );

  const update = (patch: Partial<LearnerProfile>) => setProfile((p) => ({ ...p, ...patch }));

  const setSkill = (index: number, patch: Partial<ClaimedSkill>) =>
    update({ claimedSkills: profile.claimedSkills.map((s, i) => (i === index ? { ...s, ...patch } : s)) });

  const trimmedUsername = username.trim().toLowerCase();
  const usernameTaken = takenUsernames !== null && trimmedUsername.length > 0 && takenUsernames.has(trimmedUsername);

  const index = STEPS.findIndex((s) => s.id === step);
  const isLast = index === STEPS.length - 1;

  /* Only the account step gates progress, and only on the two things that cannot be guessed later.
     Every other step is skippable — an admin who knows nothing about a new hire's skills should be
     able to onboard them and let the assessment find out, which is what it is for. */
  const canAdvance =
    step !== "account" || (trimmedUsername.length > 0 && displayName.trim().length > 0 && !usernameTaken);

  const goTo = (next: StepId) => {
    setStep(next);
    // The steps are tall enough that advancing from the bottom of one lands mid-way down the next.
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!isLast) {
      if (canAdvance) goTo(STEPS[index + 1].id);
      return;
    }
    setSubmitting(true);
    setError(null);
    setFields({});
    try {
      const result = await adminApi.onboard({
        username: username.trim(),
        displayName,
        ...(passwordMode === "set" && password ? { password } : {}),
        profile: {
          ...profile,
          // Drop rows the admin added but never filled in.
          claimedSkills: profile.claimedSkills.filter((s) => s.area.trim().length > 0),
        },
        issueAssessment,
      });
      if (result.temporaryPassword) {
        setCreated({ username: result.user.username, password: result.temporaryPassword });
        setUsername("");
        setDisplayName("");
        setPassword("");
        setProfile(emptyProfile);
        setStep("account");
      } else {
        navigate("/admin/people");
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        const errorFields = err.fields ?? {};
        setFields(errorFields);
        // Send the admin back to the step that owns the rejected field, rather than showing an
        // error on the review screen about a box three steps behind them.
        const owner = stepForField(Object.keys(errorFields)[0]);
        if (owner) setStep(owner);
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Onboard a learner</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Creates the account and the profile the placement assessment is built from.
      </p>

      {created && (
        <TemporaryPasswordNotice
          className="mt-6"
          username={created.username}
          password={created.password}
          onDismiss={() => {
            setCreated(null);
            navigate("/admin/people");
          }}
        />
      )}

      <Stepper current={index} onJump={(i) => i < index && goTo(STEPS[i].id)} />

      <form onSubmit={handleSubmit} className="mt-8" noValidate>
        {error && (
          <div className="mb-6">
            <FormAlert>{error}</FormAlert>
          </div>
        )}

        <div>
          <h2 className="font-display text-lg font-semibold">{STEPS[index].name}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{STEPS[index].blurb}</p>
        </div>

        {/* One panel at a time, sliding in the direction of travel. `mode="wait"` so two tall
            panels never overlap and double the page height mid-transition. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: duration.base }}
            className="mt-6 space-y-6"
          >
            {step === "account" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Username"
                    required
                    value={username}
                    error={fields.username ?? (usernameTaken ? "That username is already taken." : undefined)}
                    spellCheck={false}
                    autoCapitalize="none"
                    autoFocus
                    placeholder="priya.sharma"
                    hint={
                      usernameTaken
                        ? undefined
                        : trimmedUsername.length > 0 && takenUsernames !== null
                          ? "Available."
                          : "Lowercase letters, digits, dot, dash or underscore."
                    }
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <TextField
                    label="Full name"
                    required
                    value={displayName}
                    error={fields.displayName}
                    placeholder="Priya Sharma"
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">First password</legend>
                  <PasswordChoice
                    checked={passwordMode === "generate"}
                    onSelect={() => setPasswordMode("generate")}
                    title="Generate one for me"
                    body="The server makes a readable 20-character password and shows it to you exactly once. Nothing stores it afterwards, which is why it cannot be looked up later."
                  />
                  <PasswordChoice
                    checked={passwordMode === "set"}
                    onSelect={() => setPasswordMode("set")}
                    title="Set one now"
                    body="Useful when you are handing it over in person."
                  >
                    <PasswordField
                      label="Password"
                      value={password}
                      error={fields.password}
                      meter
                      username={username}
                      autoComplete="new-password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </PasswordChoice>
                  <p className="text-xs text-muted-foreground">
                    Either way they choose their own password at first sign-in, and this one stops working then.
                  </p>
                </fieldset>
              </>
            )}

            {step === "profile" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Role title"
                    value={profile.roleTitle ?? ""}
                    error={fields["profile.roleTitle"]}
                    placeholder="Frontend Engineer"
                    onChange={(e) => update({ roleTitle: e.target.value || null })}
                  />
                  <NumberField
                    label="Years of experience"
                    min={0}
                    max={60}
                    step={0.5}
                    value={profile.yearsExperience}
                    error={fields["profile.yearsExperience"]}
                    onChange={(years) => update({ yearsExperience: years })}
                  />
                </div>

                <Field
                  label="Notes"
                  error={fields["profile.adminNotes"]}
                  hint="The single most useful input to the assessment. What have they built? Where are they strong, where do they struggle, how do they perform under pressure? Write plainly — nobody but you and the assessment sees this."
                >
                  {({ id, describedBy, invalid }) => (
                    <>
                      <textarea
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={invalid || undefined}
                        rows={10}
                        value={profile.adminNotes}
                        onChange={(e) => update({ adminNotes: e.target.value })}
                        className={cn(
                          "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
                          invalid && "border-destructive",
                        )}
                        placeholder="Two years on our React dashboards. Comfortable with components and hooks, but async JavaScript and error handling are shaky — needed help with a race condition last sprint. Has never worked on a backend."
                      />
                      {/* A guide, not a limit: the server does not cap this, so the counter counts
                          up to a useful length rather than down from a ceiling that does not exist. */}
                      <p className="mt-1 text-right text-xs text-muted-foreground" aria-live="polite">
                        {profile.adminNotes.length} characters
                        {profile.adminNotes.length < NOTES_TARGET && ` · a paragraph or two works best`}
                      </p>
                    </>
                  )}
                </Field>
              </>
            )}

            {step === "skills" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Your estimate, not theirs. The assessment probes these and reports where it agrees.
                </p>

                {profile.claimedSkills.length === 0 && (
                  <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    Nothing claimed yet. You can leave this empty — the assessment will find out on its own.
                  </p>
                )}

                <ul className="space-y-3">
                  {profile.claimedSkills.map((skill, i) => (
                    <li key={i} className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
                      <Field label="Area">
                        {({ id }) => (
                          <Input
                            id={id}
                            list="skill-areas"
                            value={skill.area}
                            placeholder="React"
                            onChange={(e) => setSkill(i, { area: e.target.value })}
                          />
                        )}
                      </Field>

                      <Field label={`Level ${skill.level} — ${LEVEL_LABELS[skill.level]}`}>
                        {() => (
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[skill.level]}
                            thumbLabels={[`${skill.area || "Skill"} level`]}
                            onValueChange={([v]) => setSkill(i, { level: v as SkillLevel })}
                          />
                        )}
                      </Field>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mb-1"
                        onClick={() => update({ claimedSkills: profile.claimedSkills.filter((_, j) => j !== i) })}
                      >
                        <Trash2 aria-hidden="true" />
                        <span className="sr-only">Remove {skill.area || "this skill"}</span>
                      </Button>
                    </li>
                  ))}
                </ul>

                <datalist id="skill-areas">
                  {areaOptions.map((area) => (
                    <option key={area} value={area} />
                  ))}
                </datalist>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => update({ claimedSkills: [...profile.claimedSkills, { area: "", level: 3 }] })}
                >
                  <Plus aria-hidden="true" />
                  Add a skill
                </Button>
              </>
            )}

            {step === "trails" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Where you want them to end up. The assessment focuses here, plus fundamentals.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {tracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      name={track.name}
                      tagline={track.tagline}
                      accent={track.accentToken}
                      moduleCount={track.modules.filter((m) => m.available).length}
                      selected={profile.targetTracks.includes(track.id as TrackIdValue)}
                      onToggle={(on) =>
                        update({
                          targetTracks: on
                            ? [...profile.targetTracks, track.id as TrackIdValue]
                            : profile.targetTracks.filter((t) => t !== track.id),
                        })
                      }
                    />
                  ))}
                </div>
                {fields["profile.targetTracks"] && (
                  <p className="text-xs font-medium text-destructive">{fields["profile.targetTracks"]}</p>
                )}
              </>
            )}

            {step === "review" && (
              <Review
                username={username.trim()}
                displayName={displayName}
                passwordMode={passwordMode}
                passwordScore={passwordMode === "set" && password ? passwordStrength(password, username).score : null}
                profile={profile}
                tracks={tracks.map((t) => ({ id: t.id, name: t.name }))}
                onEdit={goTo}
              >
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <Checkbox
                    checked={issueAssessment}
                    onCheckedChange={(on) => setIssueAssessment(on === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">Issue the placement assessment now</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      Generation starts in the background and takes a few minutes. It then waits for your approval
                      before the learner sees it — nothing reaches them until you say so, or until the auto-release
                      deadline passes.
                    </span>
                  </span>
                </label>
              </Review>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
          {index > 0 ? (
            <Button type="button" variant="ghost" onClick={() => goTo(STEPS[index - 1].id)}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => navigate("/admin/people")}>
              Cancel
            </Button>
          )}

          <div className="ml-auto flex items-center gap-3">
            {!isLast && (
              <Button type="button" variant="link" size="sm" onClick={() => goTo("review")} disabled={!canAdvance}>
                Skip to review
              </Button>
            )}
            <Button type="submit" loading={submitting} disabled={!canAdvance}>
              {isLast ? (
                <>
                  <Sparkles aria-hidden="true" />
                  Create account
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

/** Which step owns a server field error, so a rejection lands where it can be fixed. */
function stepForField(field: string | undefined): StepId | null {
  if (!field) return null;
  if (field === "username" || field === "displayName" || field === "password") return "account";
  if (field === "profile.targetTracks") return "trails";
  if (field.startsWith("profile.claimedSkills")) return "skills";
  if (field.startsWith("profile.")) return "profile";
  return null;
}

/**
 * The progress rail.
 *
 * Completed steps are clickable and future ones are not, which is the honest affordance: you can
 * revisit what you have filled in, and jumping ahead is what "Skip to review" is for. The marker is
 * one `layoutId` so it slides between steps rather than five bars fading in and out.
 */
function Stepper({ current, onJump }: { current: number; onJump: (index: number) => void }) {
  return (
    <ol className="mt-8 flex flex-wrap gap-x-1 gap-y-2" aria-label="Onboarding steps">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.id} className="min-w-0 flex-1">
            <button
              type="button"
              disabled={!done}
              onClick={() => onJump(i)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "group relative w-full pb-2 text-left",
                done && "cursor-pointer",
                !done && !active && "cursor-default",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition-colors",
                    done && "border-summit bg-summit text-slate-50",
                    active && "border-primary bg-primary/10 text-primary-strong",
                    !done && !active && "border-border text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3" aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "truncate text-xs font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                    done && "group-hover:text-foreground",
                  )}
                >
                  {step.name}
                </span>
              </span>
              <span
                className={cn(
                  "mt-2 block h-0.5 rounded-full",
                  done ? "bg-summit" : active ? "bg-primary" : "bg-border",
                )}
              />
              {done && <span className="sr-only">(completed — select to go back)</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function PasswordChoice({
  checked,
  onSelect,
  title,
  body,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "block cursor-pointer rounded-md border p-4 transition-colors",
        checked ? "border-primary bg-primary/5" : "hover:bg-surface-sunken/60",
      )}
    >
      <span className="flex items-start gap-3">
        <input
          type="radio"
          name="password-mode"
          checked={checked}
          onChange={onSelect}
          className="mt-1 size-4 accent-[rgb(var(--primary))]"
        />
        <span>
          <span className="font-medium">{title}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
        </span>
      </span>
      {checked && children && <span className="mt-4 block">{children}</span>}
    </label>
  );
}

function TrackCard({
  name,
  tagline,
  accent,
  moduleCount,
  selected,
  onToggle,
}: {
  name: string;
  tagline: string;
  accent: AccentToken;
  moduleCount: number;
  selected: boolean;
  onToggle: (on: boolean) => void;
}) {
  /* `accentClasses` is keyed by the whole `AccentToken` union, so all eight tracks colour correctly
     and a ninth token would fail the build rather than quietly falling back to orange. Spelled-out
     classes, because Tailwind cannot scan an interpolated `border-${accent}`. */
  const { border, soft } = accentClasses[accent];

  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col rounded-lg border p-4 transition-colors",
        selected ? cn(border, soft) : "hover:bg-surface-sunken/60",
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={selected}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className="flex items-start justify-between gap-2">
        <span className="font-display font-semibold">{name}</span>
        <motion.span
          initial={false}
          animate={{ scale: selected ? 1 : 0.6, opacity: selected ? 1 : 0 }}
          transition={transition.fast}
          className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
        >
          <Check className="size-2.5" aria-hidden="true" />
        </motion.span>
      </span>
      <span className="mt-1 text-sm text-muted-foreground">{tagline}</span>
      <span className="mt-3 font-mono text-[11px] text-muted-foreground">
        {moduleCount} camp{moduleCount === 1 ? "" : "s"}
      </span>
    </label>
  );
}

function Review({
  username,
  displayName,
  passwordMode,
  passwordScore,
  profile,
  tracks,
  onEdit,
  children,
}: {
  username: string;
  displayName: string;
  passwordMode: "generate" | "set";
  passwordScore: number | null;
  profile: LearnerProfile;
  tracks: { id: string; name: string }[];
  onEdit: (step: StepId) => void;
  children: React.ReactNode;
}) {
  const skills = profile.claimedSkills.filter((s) => s.area.trim().length > 0);
  const trackNames = profile.targetTracks.map((id) => tracks.find((t) => t.id === id)?.name ?? id);

  return (
    <div className="space-y-4">
      <ReviewBlock title="Account" onEdit={() => onEdit("account")}>
        <p>
          <span className="font-medium">{displayName || "—"}</span>{" "}
          <span className="font-mono text-xs text-muted-foreground">{username || "—"}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {passwordMode === "generate"
            ? "A password will be generated and shown to you once."
            : passwordScore !== null
              ? `You are setting the password yourself (strength ${passwordScore + 1} of 5).`
              : "You chose to set the password yourself, but have not typed one — the server will generate one instead."}
        </p>
      </ReviewBlock>

      <ReviewBlock title="Profile" onEdit={() => onEdit("profile")}>
        <p className="text-sm">
          {profile.roleTitle ?? "No role title"}
          {profile.yearsExperience !== null && ` · ${profile.yearsExperience} yrs`}
        </p>
        {profile.adminNotes.trim().length === 0 ? (
          <p className="mt-1 text-sm text-trailmark-strong">
            No notes. The assessment will be built from the claimed skills and trails alone, which makes it noticeably
            more generic.
          </p>
        ) : (
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{profile.adminNotes}</p>
        )}
      </ReviewBlock>

      <ReviewBlock title="Claimed skills" onEdit={() => onEdit("skills")}>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">None claimed.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <li key={i}>
                <Badge variant="outline">
                  {s.area} · {LEVEL_LABELS[s.level]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </ReviewBlock>

      <ReviewBlock title="Target trails" onEdit={() => onEdit("trails")}>
        {trackNames.length === 0 ? (
          <p className="text-sm text-muted-foreground">None chosen — the assessment will cover fundamentals broadly.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {trackNames.map((name) => (
              <li key={name}>
                <Badge variant="brand">{name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </ReviewBlock>

      {children}
    </div>
  );
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="link" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}
