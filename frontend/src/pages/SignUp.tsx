import { Link } from "react-router";

import AuthLayout from "@/components/auth/AuthLayout";
import PasswordField from "@/components/auth/PasswordField";
import { SOLIDS } from "@/components/auth/shapes";
import SubmitButton from "@/components/auth/SubmitButton";
import TextField from "@/components/auth/TextField";
import useAuthForm from "@/hooks/useAuthForm";
import { UNDERLINE } from "@/lib/styles";
import { cn } from "@/lib/utils";

export default function SignUp() {
  const { errors, clearError, submit } = useAuthForm();

  return (
    <AuthLayout
      shapes={SOLIDS}
      title="Create your Lerno account"
      subtitle="Turn any maths topic into a lesson you can watch."
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
          autoComplete="new-password"
          placeholder="Create a password"
          minLength={8}
          hint="At least 8 characters."
          error={errors.password}
          onChange={() => clearError("password")}
        />
      </div>

      <SubmitButton>Create account</SubmitButton>

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

      <p className="text-secondary-foreground mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className={cn("text-foreground font-medium", UNDERLINE)}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
