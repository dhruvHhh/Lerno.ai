import { useState } from "react";

import AuthForm from "@/components/auth/AuthForm";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthSwitch from "@/components/auth/AuthSwitch";
import EmailField from "@/components/auth/EmailField";
import { Message } from "@/components/auth/Field";
import Notice from "@/components/auth/Notice";
import { SURFACES } from "@/components/auth/shapes";
import SubmitButton from "@/components/auth/SubmitButton";
import useAuthForm from "@/hooks/useAuthForm";
import { authMessage } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState("");

  const { errors, failure, pending, clearError, submit } = useAuthForm(async (data) => {
    const email = String(data.get("email"));
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return authMessage(error);
    setSentTo(email);
  });

  return (
    <AuthLayout shapes={SURFACES}>
      {sentTo ? (
        <Notice title="Check your inbox" link={{ label: "Back to sign in", to: "/login" }}>
          If an account exists for <span className="text-foreground">{sentTo}</span>, we sent it a link to set a new
          password.
        </Notice>
      ) : (
        <AuthForm title="Reset your password" subtitle="We'll email you a link to set a new one." onSubmit={submit}>
          <EmailField error={errors.email} onChange={() => clearError("email")} />

          <Message text={failure} error />
          <SubmitButton pending={pending}>{pending ? "Sending link…" : "Send reset link"}</SubmitButton>

          <AuthSwitch prompt="Remembered it?" label="Sign in" to="/login" />
        </AuthForm>
      )}
    </AuthLayout>
  );
}
