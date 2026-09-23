import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import { PASSWORD_MIN_LENGTH } from "@shared/auth";

import { ApiRequestError } from "@/api/client";
import { FormAlert, TextField } from "@/components/form/Field";
import { Logo } from "@/components/layout/Logo";
import { Contours } from "@/components/trail/Contours";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "./AuthProvider";
import { landingPathFor } from "./routing";

export default function ChangePasswordPage() {
  useDocumentTitle("Change your password");
  const { user, loading, changePassword } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const forced = user.mustChangePassword;
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

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
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setFields(err.fields ?? {});
      } else {
        setError("Something went wrong. Try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <Contours className="text-basalt/[0.14] dark:text-basalt/[0.10]" seed={5} rings={14} />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-start">
          <Logo variant="stacked" height={72} />
          <p className="mt-3 font-mono text-xs text-muted-foreground">{user.username}</p>
        </div>

        <h1 className="mt-8 text-2xl font-bold">{forced ? "Set your password" : "Change your password"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {forced
            ? "You are signed in with a temporary password. Choose your own before you continue."
            : "Changing your password signs out every other device."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {error && <FormAlert>{error}</FormAlert>}

          <TextField
            label={forced ? "Temporary password" : "Current password"}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            value={currentPassword}
            error={fields.currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <TextField
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            error={fields.newPassword}
            hint={`At least ${PASSWORD_MIN_LENGTH} characters. Not your username, and not a commonly used password.`}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <TextField
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            error={mismatch ? "The two passwords do not match." : undefined}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || mismatch || !currentPassword || !newPassword || !confirmPassword}
          >
            {submitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {submitting ? "Saving…" : "Save password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
