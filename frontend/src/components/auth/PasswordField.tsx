import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { AnimatePresence, m } from "motion/react";
import { useState, type ReactNode } from "react";

import Field from "@/components/auth/Field";
import { FIELD, SNAPPY } from "@/lib/styles";
import { cn } from "@/lib/utils";
import { EASE_EXPO } from "@/lib/variants";

interface PasswordFieldProps {
  error?: string;
  action?: ReactNode;
  hint?: string;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
  minLength?: number;
  onChange: () => void;
}

export default function PasswordField({ error, action, hint, ...input }: PasswordFieldProps) {
  const [shown, setShown] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const Eye = shown ? EyeSlashIcon : EyeIcon;

  return (
    <Field id="password" label="Password" error={error} action={action} note={capsLock ? "Caps Lock is on." : hint}>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={shown ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={error && "password-error"}
          onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          onBlur={() => setCapsLock(false)}
          className={cn(FIELD, "pr-12")}
          {...input}
        />
        <button
          type="button"
          onClick={() => setShown((value) => !value)}
          aria-label={shown ? "Hide password" : "Show password"}
          className={cn(
            "text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 grid w-12 place-items-center transition-colors",
            SNAPPY,
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={String(shown)}
              initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
              transition={{ duration: 0.25, ease: EASE_EXPO }}
            >
              <Eye className="size-4.5" />
            </m.span>
          </AnimatePresence>
        </button>
      </div>
    </Field>
  );
}
