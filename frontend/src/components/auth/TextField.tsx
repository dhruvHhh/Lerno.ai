import type { ComponentProps } from "react";

import Field from "@/components/auth/Field";
import { FIELD } from "@/lib/styles";

interface TextFieldProps extends ComponentProps<"input"> {
  id: string;
  label: string;
  error?: string;
}

export default function TextField({ id, label, error, ...input }: TextFieldProps) {
  return (
    <Field id={id} label={label} error={error}>
      <input
        id={id}
        name={id}
        aria-invalid={!!error}
        aria-describedby={error && `${id}-error`}
        className={FIELD}
        {...input}
      />
    </Field>
  );
}
