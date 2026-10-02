import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

import type { LearnerProfile } from "@shared/profile";
import type { LearnerSetup, SaveSetupRequest } from "@shared/setup";

import { ApiRequestError } from "@/api/client";
import { Field, FormAlert, TextField } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { adminApi } from "../api";
import { setupApi } from "../setup/api";
import { SetupForm } from "../setup/SetupForm";

/**
 * The Setup tab: the one place a learner's department, track, priorities and settings are edited,
 * plus the free-text notes and role title the assessment blueprint reads.
 */
export function SetupTab({
  userId,
  profile,
  addSkill,
  onAddHandled,
  onSaved,
  onAssigned,
  onProfileSaved,
}: {
  userId: string;
  profile: LearnerProfile;
  addSkill: string | null;
  onAddHandled: () => void;
  /** After any setup save: the header's years and level may have changed. */
  onSaved: () => void;
  /** After a save that issued an assessment. */
  onAssigned: () => void;
  onProfileSaved: (profile: LearnerProfile) => void;
}) {
  const [setup, setSetup] = useState<LearnerSetup | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setupApi
      .get(userId, controller.signal)
      .then((result) => setSetup(result.setup))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load their setup.");
      });
    return () => controller.abort();
  }, [userId]);

  const save = useCallback(
    async (request: SaveSetupRequest) => {
      const result = await setupApi.save(userId, request);
      setSetup(result.setup);
      // Remount the form on the saved record: the server may have dropped an archived stack or skill.
      setVersion((v) => v + 1);
      onSaved();
      if (result.issued) {
        notify.success("Setup saved and the assessment is being built. It waits for your approval.");
        onAssigned();
      } else {
        notify.success("Setup saved.");
      }
    },
    [userId, onSaved, onAssigned],
  );

  if (error) return <FormAlert>{error}</FormAlert>;
  if (!setup) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Loading their setup…
      </p>
    );
  }

  return (
    <div className="space-y-12">
      <SetupForm
        key={version}
        initial={setup}
        onSave={save}
        primaryLabel="Save & assign assessment"
        secondaryLabel="Save"
        addSkill={addSkill}
        onAddHandled={onAddHandled}
        showDirty
      />
      <NotesSection userId={userId} profile={profile} onSaved={onProfileSaved} />
    </div>
  );
}

/** Role title and notes: free text, saved on their own because they are a different record. */
function NotesSection({
  userId,
  profile,
  onSaved,
}: {
  userId: string;
  profile: LearnerProfile;
  onSaved: (profile: LearnerProfile) => void;
}) {
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle ?? "");
  const [notes, setNotes] = useState(profile.adminNotes);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const dirty = roleTitle !== (profile.roleTitle ?? "") || notes !== profile.adminNotes;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !dirty) return;
    setSaving(true);
    setFields({});
    try {
      const result = await adminApi.updateProfile(userId, {
        ...profile,
        roleTitle: roleTitle.trim() || null,
        adminNotes: notes,
      });
      onSaved(result.profile);
      notify.success("Notes saved.");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFields(err.fields ?? {});
        notify.error(err.message);
      } else {
        notify.error("Could not save the notes.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="notes-heading" className="max-w-3xl space-y-4 border-t pt-8">
      <h2 id="notes-heading" className="font-display text-base font-semibold">
        Notes
      </h2>
      <TextField
        label="Role title"
        value={roleTitle}
        error={fields["profile.roleTitle"]}
        placeholder="Frontend Engineer"
        containerClassName="max-w-sm"
        onChange={(e) => setRoleTitle(e.target.value)}
      />
      <Field label="What you know about them" hint="The assessment reads this. Nobody else sees it." error={fields["profile.adminNotes"]}>
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={cn(
              "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
              invalid && "border-destructive",
            )}
            placeholder="Two years on our React dashboards. Comfortable with hooks; async error handling is shaky."
          />
        )}
      </Field>
      <Button type="submit" variant="outline" loading={saving} disabled={!dirty}>
        Save notes
      </Button>
    </form>
  );
}
