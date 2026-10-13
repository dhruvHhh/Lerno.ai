import { Link } from "react-router";

import AuthLayout from "@/components/auth/AuthLayout";
import PasswordField from "@/components/auth/PasswordField";
import { SURFACES } from "@/components/auth/shapes";
import SubmitButton from "@/components/auth/SubmitButton";
import TextField from "@/components/auth/TextField";
import useAuthForm from "@/hooks/useAuthForm";
import { UNDERLINE } from "@/lib/styles";
import { cn } from "@/lib/utils";

export default function Login() {
  const { errors, clearError, submit } = useAuthForm();

  return (
    <AuthLayout
      shapes={SURFACES}
      title="Sign in to Lerno"
      subtitle="Pick up your lessons where you left off."
      onSubmit={submit}
    >
      <div className="flex flex-col gap-4">
        <TextField
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="name@example.com"
          error={errors.email}
          onChange={() => clearError("email")}
        />
        <PasswordField
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password}
          onChange={() => clearError("password")}
          action={
            <Link
              to="/reset-password"
              className={cn("text-secondary-foreground hover:text-foreground text-sm", UNDERLINE)}
            >
              Forgot password?
            </Link>
          }
        />
      </div>

      <SubmitButton>Sign in</SubmitButton>

      <p className="text-secondary-foreground mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className={cn("text-foreground font-medium", UNDERLINE)}>
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
