import { lazy, Suspense, type ReactNode } from "react";
import { Link } from "react-router";

import type { ShapeSet } from "@/components/auth/shapes";
import Logo from "@/components/brand/Logo";
import { COPYRIGHT, LEGAL_LINKS } from "@/content/site-links";
import useMediaQuery, { DESKTOP } from "@/hooks/useMediaQuery";
import { UNDERLINE } from "@/lib/styles";
import { cn } from "@/lib/utils";

// three.js is large, so it loads separately.
const MathSurface = lazy(() => import("@/components/auth/MathSurface"));

export default function AuthLayout({ shapes, children }: { shapes: ShapeSet; children: ReactNode }) {
  const wide = useMediaQuery(DESKTOP);

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section className="flex flex-col px-6 py-6 sm:px-12 sm:py-8">
        <Link to="/" aria-label="Lerno home" className="self-start">
          <Logo />
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-4">{children}</div>

        <footer className="text-muted-foreground flex justify-between text-xs">
          <span>{COPYRIGHT}</span>
          <nav className="flex gap-4">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link key={href} to={href} className={cn("hover:text-secondary-foreground", UNDERLINE)}>
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
