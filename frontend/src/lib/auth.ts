export type Errors = Partial<Record<"email" | "password", string>>;

// Checks the sign-in fields in the browser; signing in itself is not wired up yet.
export function validate(form: HTMLFormElement): Errors {
  const { email, password } = form.elements as unknown as Record<"email" | "password", HTMLInputElement>;
  const errors: Errors = {};
  if (!email.value) errors.email = "Enter your email address.";
  else if (!email.validity.valid) errors.email = "Enter a valid email address, like name@example.com.";
  if (!password.value) errors.password = "Enter your password.";
  return errors;
}
