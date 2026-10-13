import { lazy, Suspense, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";

import GoogleButton from "@/components/auth/GoogleButton";
import type { ShapeSet } from "@/components/auth/shapes";
import Logo from "@/components/brand/Logo";
import useMediaQuery from "@/hooks/useMediaQuery";
import { UNDERLINE } from "@/lib/styles";
import { cn } from "@/lib/utils";

// three.js is large, so it loads separately.
const MathSurface = lazy(() => import("@/components/auth/MathSurface"));

const LEGAL = [
  { label: "Terms", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
];

interface AuthLayoutProps {
  title: string;
  shapes: ShapeSet;
  subtitle: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

export default function AuthLayout({ title, shapes, subtitle, onSubmit, children }: AuthLayoutProps) {
  const wide = useMediaQuery("(min-width: 64rem)");

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section className="flex flex-col px-6 py-6 sm:px-12 sm:py-8">
        <Link to="/" aria-label="Lerno home" className="self-start">
          <Logo />
        </Link>

        <div className="flex flex-1 flex-col justify-center py-4">
          <form noValidate onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-secondary-foreground mt-2 mb-8">{subtitle}</p>

            <GoogleButton />

            <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs">
              <span className="h-px flex-1 bg-white/8" />
              or
              <span className="h-px flex-1 bg-white/8" />
            </div>

            {children}
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

      {/* Wide screens only, so phones never download three.js. */}
      {wide && (
        <Suspense>
          <MathSurface
            shapes={shapes}
            className="overflow-hidden border-l border-white/8 bg-[#07080d] bg-[radial-gradient(80%_60%_at_50%_45%,rgba(155,124,255,0.14),transparent_70%)]"
          />
        </Suspense>
      )}
    </main>
  );
}
