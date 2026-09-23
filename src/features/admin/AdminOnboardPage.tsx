import { useMemo, useState, type FormEvent } from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { ClaimedSkill, LearnerProfile } from "@shared/profile";
import type { SkillLevel, TrackIdValue } from "@shared/enums";

import { ApiRequestError } from "@/api/client";
import { Field, FormAlert, TextField } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTracks } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
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

const emptyProfile: LearnerProfile = {
  roleTitle: null,
  yearsExperience: null,
  adminNotes: "",
  claimedSkills: [],
  targetTracks: [],
};

/**
 * Onboarding (brief §13). The admin notes are the most important field on this page: they are the
 * main input to the AI blueprint, so the form gives them real room and says what they are for.
 */
export default function AdminOnboardPage() {
  useDocumentTitle("Onboard a learner");
  const navigate = useNavigate();
  // A superadmin's manifest is unfiltered, so this is the whole curriculum.
  const tracks = useTracks();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profile, setProfile] = useState<LearnerProfile>(emptyProfile);
  const [issueAssessment, setIssueAssessment] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);

  // The superadmin sees the full curriculum, so the module list is a fine source of skill areas.
  const areaOptions = useMemo(
    () => tracks.flatMap((track) => track.modules.filter((m) => m.available).map((m) => m.name)).sort(),
    [tracks],
  );

  const update = (patch: Partial<LearnerProfile>) => setProfile((p) => ({ ...p, ...patch }));

  const setSkill = (index: number, patch: Partial<ClaimedSkill>) =>
    update({ claimedSkills: profile.claimedSkills.map((s, i) => (i === index ? { ...s, ...patch } : s)) });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setFields({});
    try {
      const result = await adminApi.onboard({
        username,
        displayName,
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
        setProfile(emptyProfile);
      } else {
        navigate("/admin/people");
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setFields(err.fields ?? {});
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
        Creates the account and the profile the placement assessment is built from. They will be asked to
        choose their own password at first sign-in.
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

      <form onSubmit={handleSubmit} className="mt-8 space-y-10" noValidate>
        {error && <FormAlert>{error}</FormAlert>}

        <section aria-labelledby="account-heading" className="space-y-4">
          <div>
            <h2 id="account-heading" className="text-lg font-semibold">
              Account
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">A password is generated and shown to you once.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Username"
              required
              value={username}
              error={fields.username}
              spellCheck={false}
              autoCapitalize="none"
              placeholder="priya.sharma"
              hint="Lowercase letters, digits, dot, dash or underscore."
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
        </section>

        <section aria-labelledby="profile-heading" className="space-y-4">
          <div>
            <h2 id="profile-heading" className="text-lg font-semibold">
              Profile
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">What you know about them before they are tested.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Role title"
              value={profile.roleTitle ?? ""}
              error={fields["profile.roleTitle"]}
              placeholder="Frontend Engineer"
              onChange={(e) => update({ roleTitle: e.target.value || null })}
            />
            <TextField
              label="Years of experience"
              type="number"
              min={0}
              max={60}
              step={0.5}
              value={profile.yearsExperience ?? ""}
              error={fields["profile.yearsExperience"]}
              onChange={(e) => update({ yearsExperience: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </div>

          <Field
            label="Notes"
            error={fields["profile.adminNotes"]}
            hint="The single most useful input to the assessment. What have they built? Where are they strong, where do they struggle, how do they perform under pressure? Write plainly — nobody but you and the assessment sees this."
          >
            {({ id, describedBy, invalid }) => (
              <textarea
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                rows={8}
                value={profile.adminNotes}
                onChange={(e) => update({ adminNotes: e.target.value })}
                className={cn(
                  "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground",
                  invalid && "border-destructive",
                )}
                placeholder="Two years on our React dashboards. Comfortable with components and hooks, but async JavaScript and error handling are shaky — needed help with a race condition last sprint. Has never worked on a backend."
              />
            )}
          </Field>
        </section>

        <section aria-labelledby="skills-heading" className="space-y-4">
          <div>
            <h2 id="skills-heading" className="text-lg font-semibold">
              Claimed skills
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your estimate, not theirs. The assessment probes these and reports where it agrees.
            </p>
          </div>

          <ul className="space-y-3">
            {profile.claimedSkills.map((skill, index) => (
              <li key={index} className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <Field label="Area">
                  {({ id }) => (
                    <>
                      <Input
                        id={id}
                        list="skill-areas"
                        value={skill.area}
                        placeholder="React"
                        onChange={(e) => setSkill(index, { area: e.target.value })}
                      />
                    </>
                  )}
                </Field>

                <Field label={`Level — ${LEVEL_LABELS[skill.level]}`} className="sm:w-56">
                  {({ id }) => (
                    <input
                      id={id}
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={skill.level}
                      onChange={(e) => setSkill(index, { level: Number(e.target.value) as SkillLevel })}
                      className="h-10 w-full accent-[rgb(var(--trailmark))]"
                    />
                  )}
                </Field>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mb-1"
                  onClick={() => update({ claimedSkills: profile.claimedSkills.filter((_, i) => i !== index) })}
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
        </section>

        <section aria-labelledby="tracks-heading" className="space-y-3">
          <div>
            <h2 id="tracks-heading" className="text-lg font-semibold">
              Target trails
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Where you want them to end up. The assessment focuses here, plus fundamentals.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {tracks.map((track) => {
              const selected = profile.targetTracks.includes(track.id);
              return (
                <label
                  key={track.id}
                  className={cn(
                    "cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors",
                    selected ? "border-trailmark bg-trailmark/10 font-medium" : "hover:bg-surface-sunken/60",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selected}
                    onChange={(e) =>
                      update({
                        targetTracks: e.target.checked
                          ? [...profile.targetTracks, track.id as TrackIdValue]
                          : profile.targetTracks.filter((t) => t !== track.id),
                      })
                    }
                  />
                  {track.name}
                </label>
              );
            })}
          </div>
          {fields["profile.targetTracks"] && (
            <p className="text-xs font-medium text-destructive">{fields["profile.targetTracks"]}</p>
          )}
        </section>

        <section className="space-y-3 border-t pt-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={issueAssessment}
              onChange={(e) => setIssueAssessment(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[rgb(var(--trailmark))]"
            />
            <span>
              <span className="font-medium">Issue the placement assessment now</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                Generates their assessment in the background so it is ready when they first sign in.
              </span>
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting || !username || !displayName}>
              {submitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {submitting ? "Creating…" : "Create account"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate("/admin/people")}>
              Cancel
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}
