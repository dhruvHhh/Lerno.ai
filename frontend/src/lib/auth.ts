export type Errors = Partial<Record<"name" | "email" | "password", string>>;

const EMPTY = { name: "Enter your name.", email: "Enter your email address.", password: "Enter your password." };

// Checks every input in the form; creating accounts and signing in aren't wired up yet.
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
