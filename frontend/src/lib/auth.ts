import type { AuthError, User } from "@supabase/supabase-js";

// Sign-up and Google both store the name as full_name; the email is the fallback.
export const userName = (user: User) =>
  (user.user_metadata.full_name as string | undefined) || user.email!.split("@")[0];

export type Errors = Partial<Record<"name" | "email" | "password", string>>;

const EMPTY = { name: "Enter your name.", email: "Enter your email address.", password: "Enter your password." };

// Checks every input in the form before anything is sent.
export function validate(form: HTMLFormElement): Errors {
  const errors: Errors = {};
  for (const input of form.querySelectorAll("input")) {
    const name = input.name as keyof Errors;
    if (!input.value.trim()) errors[name] = EMPTY[name];
    else if (input.type === "email" && !input.validity.valid)
      errors[name] = "Enter a valid email address, like name@example.com.";
    else if (input.value.length < input.minLength) errors[name] = `Use at least ${input.minLength} characters.`;
  }
  return errors;
}

// Supabase's error codes, in words people can act on.
const MESSAGES: Record<string, string> = {
  invalid_credentials: "Email or password is incorrect.",
  email_not_confirmed: "Confirm your email first, using the link we sent when you signed up.",
  user_already_exists: "An account with this email already exists. Sign in instead.",
  weak_password: "Choose a stronger password.",
  same_password: "Choose a password you haven't used before.",
  over_email_send_rate_limit: "Too many emails sent. Wait a few minutes and try again.",
  over_request_rate_limit: "Too many tries. Wait a few minutes and try again.",
};

export const authMessage = (error: AuthError) =>
  (error.code && MESSAGES[error.code]) || "Something went wrong. Check your connection and try again.";
