import { useState } from "react";
import { Link } from "react-router";

import AuthForm from "@/components/auth/AuthForm";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthSwitch from "@/components/auth/AuthSwitch";
import EmailField from "@/components/auth/EmailField";
import { Message } from "@/components/auth/Field";
import Notice from "@/components/auth/Notice";
import PasswordField from "@/components/auth/PasswordField";
import { SOLIDS } from "@/components/auth/shapes";
import SubmitButton from "@/components/auth/SubmitButton";
import TextField from "@/components/auth/TextField";
import useAuthForm from "@/hooks/useAuthForm";
import { authMessage } from "@/lib/auth";
import { UNDERLINE } from "@/lib/styles";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function SignUp() {
  const [sentTo, setSentTo] = useState("");

  const { errors, failure, pending, clearError, submit } = useAuthForm(async (data) => {
    const email = String(data.get("email"));
    const { data: result, error } = await supabase.auth.signUp({
      email,
      password: String(data.get("password")),
      options: {
        data: { full_name: String(data.get("name")).trim() },
        emailRedirectTo: `${window.location.origin}/new`,
      },
    });
    if (error) return authMessage(error);
    // No session means the email still needs confirming.
    if (!result.session) setSentTo(email);
  });

  if (sentTo) {
    return (
      <AuthLayout shapes={SOLIDS}>
        <Notice title="Check your inbox" link={{ label: "Back to sign in", to: "/login" }}>
          We sent a link to <span className="text-foreground">{sentTo}</span>. Open it to confirm your email and start
          learning.
        </Notice>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout shapes={SOLIDS}>
      <AuthForm
        title="Create your Lerno account"
        subtitle="Turn any maths topic into a lesson you can watch."
        withGoogle
        onSubmit={submit}
      >
        <div className="flex flex-col gap-4">
          <TextField
            id="name"
            label="Name"
            autoComplete="name"
            placeholder="Your name"
            error={errors.name}
            onChange={() => clearError("name")}
          />
          <EmailField error={errors.email} onChange={() => clearError("email")} />
          <PasswordField
            autoComplete="new-password"
            placeholder="Create a password"
            minLength={8}
            hint="At least 8 characters."
            error={errors.password}
            onChange={() => clearError("password")}
          />
        </div>

        <Message text={failure} error />
        <SubmitButton pending={pending}>{pending ? "Creating account…" : "Create account"}</SubmitButton>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          By creating an account you agree to the{" "}
          <Link to="/terms" className={cn("hover:text-secondary-foreground", UNDERLINE)}>
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className={cn("hover:text-secondary-foreground", UNDERLINE)}>
            Privacy policy
          </Link>
          .
        </p>

        <AuthSwitch prompt="Already have an account?" label="Sign in" to="/login" />
      </AuthForm>
    </AuthLayout>
  );
}
