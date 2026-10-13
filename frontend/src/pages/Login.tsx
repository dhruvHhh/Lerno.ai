import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { AnimatePresence, m } from "motion/react";
import { lazy, Suspense, useState, type FormEvent } from "react";
import { Link } from "react-router";

import Field from "@/components/auth/Field";
import GoogleButton from "@/components/auth/GoogleButton";
import Logo from "@/components/brand/Logo";
import { CtaReveal } from "@/components/ui/cta-reveal";
import useMediaQuery from "@/hooks/useMediaQuery";
import { validate, type Errors } from "@/lib/auth";
import { trackPointer } from "@/lib/cta";
import { EASE, FIELD, PRESS, UNDERLINE } from "@/lib/styles";
import { cn } from "@/lib/utils";

// three.js is large, so the 3D panel loads on its own and the form appears without waiting for it.
const MathSurface = lazy(() => import("@/components/auth/MathSurface"));

const LEGAL = [
  { label: "Terms", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const EyeToggle = showPassword ? EyeSlashIcon : EyeIcon;
  const wide = useMediaQuery("(min-width: 64rem)");
  const [errors, setErrors] = useState<Errors>({});
  const [capsLock, setCapsLock] = useState(false);

  const clearError = (field: keyof Errors) => errors[field] && setErrors({ ...errors, [field]: undefined });

  // Shows what's missing and puts the cursor in the first field to fix.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(event.currentTarget);
    setErrors(found);
    const first = (["email", "password"] as const).find((field) => found[field]);
    if (first) document.getElementById(first)?.focus();
  };

  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section className="flex flex-col px-6 py-6 sm:px-12 sm:py-8">
        <Link to="/" aria-label="Lerno home" className="self-start">
          <Logo />
        </Link>

        <div className="flex flex-1 flex-col justify-center py-12">
          <form noValidate onSubmit={submit} className="mx-auto flex w-full max-w-sm flex-col">
            <h1 className="text-3xl font-semibold tracking-tight">Sign in to Lerno</h1>
            <p className="text-secondary-foreground mt-2 mb-8">Pick up your lessons where you left off.</p>

            <GoogleButton />

            <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs">
              <span className="h-px flex-1 bg-white/8" />
              or
              <span className="h-px flex-1 bg-white/8" />
            </div>

            <div className="flex flex-col gap-4">
              <Field id="email" label="Email" error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="name@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email && "email-error"}
                  onChange={() => clearError("email")}
                  className={FIELD}
                />
              </Field>

              <Field
                id="password"
                label="Password"
                error={errors.password}
                action={
                  <Link
                    to="/reset-password"
                    className={cn("text-secondary-foreground hover:text-foreground text-sm", UNDERLINE)}
                  >
                    Forgot password?
                  </Link>
                }
                note={capsLock && <p className="text-secondary-foreground mt-2 text-sm">Caps Lock is on.</p>}
              >
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password && "password-error"}
                    onChange={() => clearError("password")}
                    onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLock(false)}
                    className={cn(FIELD, "pr-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className={cn(
                      "text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 grid w-12 place-items-center transition-colors",
                      EASE,
                    )}
                  >
                    {/* The eye swaps with a quick turn and fade, so the change reads as one motion. */}
                    <AnimatePresence mode="popLayout" initial={false}>
                      <m.span
                        key={String(showPassword)}
                        initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <EyeToggle className="size-4.5" />
                      </m.span>
                    </AnimatePresence>
                  </button>
                </div>
              </Field>
            </div>

            {/* The same hover as the home page's main buttons. */}
            <button
              type="submit"
              onPointerEnter={trackPointer}
              onPointerLeave={trackPointer}
              className={cn(
                "cta bg-foreground text-background rounded-control relative isolate mt-8 h-12 overflow-hidden text-sm font-semibold",
                "shadow-[0_0_32px_rgba(155,124,255,0.3)] transition-[box-shadow,scale] hover:shadow-[0_0_44px_rgba(155,124,255,0.5)]",
                PRESS,
              )}
            >
              <CtaReveal />
              Sign in
            </button>

            <p className="text-secondary-foreground mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className={cn("text-foreground font-medium", UNDERLINE)}>
                Sign up
              </Link>
            </p>
          </form>
        </div>

        <footer className="text-muted-foreground flex justify-between text-xs">
          <span>© 2026 Lerno</span>
          <nav className="flex gap-4">
            {LEGAL.map(({ label, to }) => (
              <Link key={to} to={to} className={cn("hover:text-secondary-foreground", UNDERLINE)}>
                {label}
              </Link>
            ))}
          </nav>
        </footer>
      </section>

      {/* Only on wide screens, so phones never download the 3D code; there the form fills the screen. */}
      {wide && (
        <div className="p-3 pl-0">
          <Suspense>
            <MathSurface className="h-full overflow-hidden rounded-2xl border border-white/8 bg-[#07080d] bg-[radial-gradient(80%_60%_at_50%_45%,rgba(155,124,255,0.14),transparent_70%)]" />
          </Suspense>
        </div>
      )}
    </main>
  );
}
