import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { ApiRequestError } from "@/api/client";
import { PasswordField } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "./AuthProvider";
import { AuthFormAlert, CapsLockWarning, PasswordMatchLine } from "./AuthFeedback";
import { AuthLayout } from "./AuthLayout";
import { landingPathFor } from "./routing";
import { useCapsLock } from "./useCapsLock";

export default function ChangePasswordPage() {
  useDocumentTitle("Change your password");
  const { user, loading, changePassword } = useAuth();
  const navigate = useNavigate();

  // One per field: the warning belongs under the input being typed into, not above the form.
  const capsCurrent = useCapsLock();
  const capsNew = useCapsLock();
  const capsConfirm = useCapsLock();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  /* The mismatch message waits for a blur. Shown from the first keystroke it is wrong far more
     often than it is right, and a red line that is correct only once you finish typing teaches
     people to ignore it. */
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState(0);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const forced = user.mustChangePassword;
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const matched = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || mismatch) return;
    setSubmitting(true);
    setError(null);
    setFields({});
    try {
      const updated = await changePassword(currentPassword, newPassword);
      navigate(landingPathFor(updated), { replace: true });
    } catch (err) {
      /* Unlike login, this route is already authenticated, so a field-level message here reveals
         nothing an attacker does not already have. `fields` is kept and shown. */
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setFields(err.fields ?? {});
      } else {
        setError("Something went wrong. Try again.");
      }
      setAttempt((n) => n + 1);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={user.username}
      title={forced ? "Set your password" : "Change your password"}
      description={
        forced
          ? "You are signed in with a temporary password. Choose your own before you continue."
          : "Changing your password signs out every other device."
      }
      aside={
        <>
          {/* Deliberately a `<p>`, not an `<h2>` — see `LoginPage` for why. */}
          <p className="text-balance font-brand text-2xl font-bold">A password only you know.</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The one you were given was typed into a chat message or read out loud, so it is not
            yours yet. The checklist beside the new password is the server's own rule set — clear
            all of it and the change will be accepted.
          </p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthFormAlert message={error} attempt={attempt} />

        <div className="space-y-1.5">
          <PasswordField
            label={forced ? "Temporary password" : "Current password"}
            name="currentPassword"
            autoComplete="current-password"
            required
            autoFocus
            value={currentPassword}
            error={fields.currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            onKeyDown={capsCurrent.onKeyEvent}
            onKeyUp={capsCurrent.onKeyEvent}
            onBlur={capsCurrent.onBlur}
          />
          <CapsLockWarning show={capsCurrent.capsLock} />
        </div>

        <div className="space-y-1.5">
          <PasswordField
            label="New password"
            name="newPassword"
            autoComplete="new-password"
            required
            meter
            username={user.username}
            differentFrom={currentPassword}
            value={newPassword}
            error={fields.newPassword}
            hint="The server also rejects commonly used passwords, even with digits tacked on the end."
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={capsNew.onKeyEvent}
            onKeyUp={capsNew.onKeyEvent}
            onBlur={capsNew.onBlur}
          />
          <CapsLockWarning show={capsNew.capsLock} />
        </div>

        <div className="space-y-1.5">
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmPassword}
            error={confirmTouched && mismatch ? "The two passwords do not match." : undefined}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={capsConfirm.onKeyEvent}
            onKeyUp={capsConfirm.onKeyEvent}
            onBlur={() => {
              capsConfirm.onBlur();
              setConfirmTouched(true);
            }}
          />
          <CapsLockWarning show={capsConfirm.capsLock} />
          <PasswordMatchLine matched={matched} />
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={submitting}
          disabled={mismatch || !currentPassword || !newPassword || !confirmPassword}
        >
          Save password
        </Button>
      </form>
    </AuthLayout>
  );
}
