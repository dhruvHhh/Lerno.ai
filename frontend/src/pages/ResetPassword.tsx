import { useState } from "react";

import AuthForm from "@/components/auth/AuthForm";
import AuthLayout from "@/components/auth/AuthLayout";
import { Message } from "@/components/auth/Field";
import Notice from "@/components/auth/Notice";
import PasswordField from "@/components/auth/PasswordField";
import { SURFACES } from "@/components/auth/shapes";
import SubmitButton from "@/components/auth/SubmitButton";
import useAuth from "@/hooks/useAuth";
import useAuthForm from "@/hooks/useAuthForm";
import { authMessage } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// The emailed link signs the reader in, so a session here means the link worked.
export default function ResetPassword() {
  const { user, loading } = useAuth();
  const [changed, setChanged] = useState(false);

  const { errors, failure, pending, clearError, submit } = useAuthForm(async (data) => {
    const { error } = await supabase.auth.updateUser({ password: String(data.get("password")) });
    if (error) return authMessage(error);
    setChanged(true);
  });

  if (loading) return null;

  return (
    <AuthLayout shapes={SURFACES}>
      {changed ? (
        <Notice title="Password changed" link={{ label: "Continue to Lerno", to: "/new" }}>
          Use your new password the next time you sign in.
        </Notice>
      ) : user ? (
        <AuthForm title="Set a new password" subtitle="Choose one you haven't used here before." onSubmit={submit}>
          <PasswordField
            label="New password"
            autoComplete="new-password"
            placeholder="Create a password"
            minLength={8}
            hint="At least 8 characters."
            error={errors.password}
            onChange={() => clearError("password")}
          />

          <Message text={failure} error />
          <SubmitButton pending={pending}>{pending ? "Saving…" : "Save password"}</SubmitButton>
        </AuthForm>
      ) : (
        <Notice title="This reset link doesn't work" link={{ label: "Send a new link", to: "/forgot-password" }}>
          Reset links work once and only for a short time. Ask for a new one and use it straight away.
        </Notice>
      )}
    </AuthLayout>
  );
}
