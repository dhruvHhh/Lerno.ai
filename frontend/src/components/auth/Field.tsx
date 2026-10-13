import type { ReactNode } from "react";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  action?: ReactNode;
  note?: ReactNode;
  children: ReactNode;
}

// A labelled field with room for a link beside the label and a message underneath.
export default function Field({ id, label, error, action, note, children }: FieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-secondary-foreground text-sm">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-danger mt-2 text-sm">
          {error}
        </p>
      ) : (
        note
      )}
    </div>
  );
}
