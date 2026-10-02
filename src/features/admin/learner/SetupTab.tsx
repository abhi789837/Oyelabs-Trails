import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

import type { LearnerProfile } from "@shared/profile";
import type { LearnerSetup, SaveSetupRequest } from "@shared/setup";

import { ApiRequestError } from "@/api/client";
import { FormAlert, TextField } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { adminApi } from "../api";
import { setupApi } from "../setup/api";
import { describeIssued } from "../setup/issued";
import { SetupForm } from "../setup/SetupForm";

/**
 * The Setup tab: the one place a learner's department, track, priorities and settings are edited.
 * The description in the form is the profile's notes (v4.1), so the notes are not edited twice here;
 * only the role title, a profile field, is saved on its own below.
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
  const profileRef = useRef(profile);
  profileRef.current = profile;

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
      onProfileSaved({ ...profileRef.current, adminNotes: result.setup.description });
      const { message, notice } = describeIssued(result.issued);
      notify.success(message);
      if (notice) notify.info(notice);
      if (result.issued) onAssigned();
    },
    [userId, onSaved, onAssigned, onProfileSaved],
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
        userId={userId}
        onSave={save}
        primaryLabel="Save & assign assessment"
        secondaryLabel="Save"
        addSkill={addSkill}
        onAddHandled={onAddHandled}
        showDirty
      />
      <RoleTitleSection userId={userId} profile={profile} description={setup.description} onSaved={onProfileSaved} />
    </div>
  );
}

/** Role title: a profile field, saved on its own. The notes travel with the setup as its description. */
function RoleTitleSection({
  userId,
  profile,
  description,
  onSaved,
}: {
  userId: string;
  profile: LearnerProfile;
  /** The saved description, so this save never puts back older notes. */
  description: string;
  onSaved: (profile: LearnerProfile) => void;
}) {
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle ?? "");
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const dirty = roleTitle.trim() !== (profile.roleTitle ?? "");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !dirty) return;
    setSaving(true);
    setFields({});
    try {
      const result = await adminApi.updateProfile(userId, {
        ...profile,
        roleTitle: roleTitle.trim() || null,
        adminNotes: description,
      });
      onSaved(result.profile);
      notify.success("Role title saved.");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFields(err.fields ?? {});
        notify.error(err.message);
      } else {
        notify.error("Could not save the role title.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Role title" className="flex max-w-3xl flex-wrap items-end gap-3 border-t pt-8">
      <TextField
        label="Role title"
        value={roleTitle}
        error={fields["profile.roleTitle"]}
        placeholder="Frontend Engineer"
        containerClassName="w-full max-w-sm"
        onChange={(e) => setRoleTitle(e.target.value)}
      />
      <Button type="submit" variant="outline" loading={saving} disabled={!dirty}>
        Save role title
      </Button>
    </form>
  );
}
