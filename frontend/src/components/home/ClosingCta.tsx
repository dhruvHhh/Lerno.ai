import GradientText from "@/components/brand/GradientText";
import CtaLink from "@/components/ui/cta-link";
import { DotArcs } from "@/components/ui/dot-arcs";

export default function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden px-4 pt-12 pb-48 text-center md:pt-16 md:pb-64">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]"
      >
        <DotArcs />
      </div>

      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
        Ready to see maths <GradientText>come alive?</GradientText>
      </h2>
      <p className="text-secondary-foreground mx-auto mt-4 max-w-xl text-base sm:text-lg">
        Type any topic and get your first animated lesson in about a minute.
      </p>
      <div className="mt-8 flex justify-center">
        <CtaLink to="/signup" size="lg">
          Start learning for free
        </CtaLink>
      </div>
      <p className="text-secondary-foreground mt-4 text-sm">Free to start</p>
    </section>
  );
}
