import type { FormEvent, ReactNode } from "react";

import GoogleButton from "@/components/auth/GoogleButton";

interface AuthFormProps {
  title: string;
  subtitle: string;
  withGoogle?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

export default function AuthForm({ title, subtitle, withGoogle, onSubmit, children }: AuthFormProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-secondary-foreground mt-2 mb-8">{subtitle}</p>

      {withGoogle && (
        <>
          <GoogleButton />
          <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs">
            <span className="h-px flex-1 bg-white/8" />
            or
            <span className="h-px flex-1 bg-white/8" />
          </div>
        </>
      )}

      {children}
    </form>
  );
}
