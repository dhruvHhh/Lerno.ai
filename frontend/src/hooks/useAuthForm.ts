import { useState, type FormEvent } from "react";

import { validate, type Errors } from "@/lib/auth";

// `action` gets the form's values once they're valid, and returns a message if it failed.
export default function useAuthForm(action: (data: FormData) => Promise<string | void>) {
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState("");
  const [pending, setPending] = useState(false);

  const clearError = (field: keyof Errors) => {
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
    setFailure("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const found = validate(form);
    setErrors(found);
    const first = [...form.querySelectorAll("input")].find((input) => found[input.name as keyof Errors]);
    if (first) return first.focus();

    setPending(true);
    setFailure("");
    setFailure((await action(new FormData(form))) ?? "");
    setPending(false);
  };

  return { errors, failure, pending, clearError, submit };
}
