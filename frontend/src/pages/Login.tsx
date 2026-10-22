import { Link } from "react-router";

import AuthForm, { GoogleSignIn } from "@/components/auth/AuthForm";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthSwitch from "@/components/auth/AuthSwitch";
import EmailField from "@/components/auth/EmailField";
import { Message } from "@/components/auth/Field";
import PasswordField from "@/components/auth/PasswordField";
import { SURFACES } from "@/components/auth/shapes";
import SubmitButton from "@/components/auth/SubmitButton";
import useAuthForm from "@/hooks/useAuthForm";
import { authMessage } from "@/lib/auth";
import { UNDERLINE } from "@/lib/styles";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// On success the route gate moves the reader on to the app.
async function signIn(data: FormData) {
  const { error } = await supabase.auth.signInWithPassword({
    email: String(data.get("email")),
    password: String(data.get("password")),
  });
  if (error) return authMessage(error);
}

export default function Login() {
  const { errors, failure, pending, clearError, submit } = useAuthForm(signIn);

  return (
    <AuthLayout shapes={SURFACES}>
      <AuthForm title="Sign in to Lerno" subtitle="Pick up your lessons where you left off." onSubmit={submit}>
        <GoogleSignIn />
        <div className="flex flex-col gap-4">
          <EmailField error={errors.email} onChange={() => clearError("email")} />
          <PasswordField
            autoComplete="current-password"
            placeholder="Your password"
            error={errors.password}
            onChange={() => clearError("password")}
            action={
              <Link
                to="/forgot-password"
                className={cn("text-secondary-foreground hover:text-foreground text-sm", UNDERLINE)}
              >
                Forgot password?
              </Link>
            }
          />
        </div>

        <Message text={failure} error />
        <SubmitButton pending={pending}>{pending ? "Signing in…" : "Sign in"}</SubmitButton>

        <AuthSwitch prompt="Don't have an account?" label="Sign up" to="/signup" />
      </AuthForm>
    </AuthLayout>
  );
}
