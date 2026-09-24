import { useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { ClaimedSkill, LearnerProfile } from "@shared/profile";
import type { SkillLevel, TrackIdValue } from "@shared/enums";

import { ApiRequestError } from "@/api/client";
import { Field, FormAlert, NumberField, TextField } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTracks } from "@/content";
import { cn } from "@/lib/utils";
import { adminApi } from "../api";

const LEVEL_LABELS: Record<SkillLevel, string> = {
  1: "Aware",
  2: "Can follow",
  3: "Can build",
  4: "Can design",
  5: "Can teach",
};

/**
 * The profile, editable (brief §13).
 *
 * The same fields as onboarding, because they are the same record and the notes are still the
 * main input to any assessment issued later. Editing them after a placement is legitimate — what
 * you learn about someone in their first month is exactly what a re-test should be built from.
 */
export function ProfileTab({
  userId,
  profile: saved,
  onSaved,
}: {
  userId: string;
  profile: LearnerProfile;
  onSaved: (profile: LearnerProfile) => void;
}) {
  const tracks = useTracks();
  const [profile, setProfile] = useState<LearnerProfile>(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const dirty = useMemo(() => JSON.stringify(profile) !== JSON.stringify(saved), [profile, saved]);

  const areaOptions = useMemo(
    () => tracks.flatMap((track) => track.modules.filter((m) => m.available).map((m) => m.name)).sort(),
    [tracks],
  );

  const update = (patch: Partial<LearnerProfile>) => setProfile((p) => ({ ...p, ...patch }));

  const setSkill = (index: number, patch: Partial<ClaimedSkill>) =>
    update({ claimedSkills: profile.claimedSkills.map((s, i) => (i === index ? { ...s, ...patch } : s)) });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setFields({});
    setNotice(null);
    try {
      const next: LearnerProfile = {
        ...profile,
        claimedSkills: profile.claimedSkills.filter((s) => s.area.trim().length > 0),
      };
      const result = await adminApi.updateProfile(userId, next);
      setProfile(result.profile);
      onSaved(result.profile);
      setNotice("Profile saved.");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setFields(err.fields ?? {});
      } else {
        setError("Could not save that profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-10" noValidate>
      {error && <FormAlert>{error}</FormAlert>}
      {notice && (
        <p className="rounded-md border border-summit/40 bg-summit/[0.07] px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      )}

      <section aria-labelledby="who-heading" className="space-y-4">
        <div>
          <h3 id="who-heading" className="text-base font-semibold">
            Who they are
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">Shown in the header and used to frame the assessment.</p>
        </div>

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
      </section>

      <section aria-labelledby="notes-heading" className="space-y-4">
        <div>
          <h3 id="notes-heading" className="text-base font-semibold">
            Notes
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The single most useful input to any assessment issued from here on. Nobody but you and the
            assessment sees this.
          </p>
        </div>

        <Field
          label="What you know about them"
          error={fields["profile.adminNotes"]}
          hint="What have they built? Where are they strong, where do they struggle, how do they perform under pressure?"
        >
          {({ id, describedBy, invalid }) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              rows={10}
              value={profile.adminNotes}
              onChange={(e) => update({ adminNotes: e.target.value })}
              className={cn(
                "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground",
                invalid && "border-destructive",
              )}
              placeholder="Two years on our React dashboards. Comfortable with components and hooks, but async JavaScript and error handling are shaky."
            />
          )}
        </Field>
      </section>

      <section aria-labelledby="skills-heading" className="space-y-4">
        <div>
          <h3 id="skills-heading" className="text-base font-semibold">
            Claimed skills
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your estimate, not theirs. The evaluation reports where it agrees and where it doesn't.
          </p>
        </div>

        {profile.claimedSkills.length === 0 ? (
          <p className="text-sm text-muted-foreground">None recorded.</p>
        ) : (
          <ul className="space-y-3">
            {profile.claimedSkills.map((skill, index) => (
              <li key={index} className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <Field label="Area">
                  {({ id }) => (
                    <Input
                      id={id}
                      list="skill-areas"
                      value={skill.area}
                      placeholder="React"
                      onChange={(e) => setSkill(index, { area: e.target.value })}
                    />
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
        )}

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

      <section aria-labelledby="trails-heading" className="space-y-3">
        <div>
          <h3 id="trails-heading" className="text-base font-semibold">
            Target trails
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">Where you want them to end up.</p>
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

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        <Button type="submit" loading={saving} disabled={!dirty}>
          Save profile
        </Button>
        {dirty && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setProfile(saved)}>
            Discard changes
          </Button>
        )}
        {!dirty && !saving && <span className="font-mono text-xs text-muted-foreground">No unsaved changes</span>}
      </div>
    </form>
  );
}
