import { Link } from "react-router";

import Logo from "@/components/brand/Logo";
import CtaLink from "@/components/ui/cta-link";
import { HairlineFigure } from "@/components/ui/hairline-figure";
import placeValue from "@/vendor/hairline/place-value.js";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col px-6 py-6 sm:px-12 sm:py-8">
      <Link to="/" aria-label="Lerno home" className="self-start">
        <Logo />
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <HairlineFigure figure={placeValue} className="w-full max-w-md" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-secondary-foreground mt-3 max-w-sm">This page doesn&apos;t exist or has moved.</p>
        <div className="mt-8">
          <CtaLink to="/">Back to home</CtaLink>
        </div>
      </div>
    </main>
  );
}
