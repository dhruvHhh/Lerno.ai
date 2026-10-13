import { useState, type FormEvent } from "react";

import { validate, type Errors } from "@/lib/auth";

export default function useAuthForm() {
  const [errors, setErrors] = useState<Errors>({});

  const clearError = (field: keyof Errors) => {
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const found = validate(form);
    setErrors(found);
    [...form.querySelectorAll("input")].find((input) => found[input.name as keyof Errors])?.focus();
  };

  return { errors, clearError, submit };
}
