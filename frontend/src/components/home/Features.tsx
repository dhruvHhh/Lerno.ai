import animations from "@/assets/illustrations/animations.webp";
import levels from "@/assets/illustrations/levels.webp";
import notes from "@/assets/illustrations/notes.webp";
import topics from "@/assets/illustrations/topics.webp";
import tutor from "@/assets/illustrations/tutor.webp";
import GradientText from "@/components/GradientText";
import SectionHeading from "@/components/home/SectionHeading";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

const LAYOUTS = {
  wide: { card: "", body: "items-center", media: "w-1/3 shrink-0" },
  tall: { card: "md:row-span-2", body: "flex-col", media: "mt-auto w-full" },
};

interface Feature {
  title: string;
  description: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  layout?: keyof typeof LAYOUTS;
}

const FEATURES: Feature[] = [
  {
    title: "AI-generated animations",
    description: "Turn any maths topic into a short Manim animation, explained step by step.",
    image: animations,
    imageWidth: 360,
    imageHeight: 356,
  },
  {
    title: "Pitched at your level",
    description: "Choose school, high school or college, and every lesson is explained just right for you.",
    image: levels,
    imageWidth: 600,
    imageHeight: 571,
    layout: "tall",
  },
  {
    title: "Ask the AI tutor",
    description: "Stuck on a step? Ask questions about your lesson and get clear answers instantly.",
    image: tutor,
    imageWidth: 360,
    imageHeight: 348,
  },
  {
    title: "Wide range of topics",
    description: "From calculus and linear algebra to probability, all in one place.",
    image: topics,
    imageWidth: 360,
    imageHeight: 352,
  },
  {
    title: "Notes that stay",
    description: "Write notes alongside each lesson so the ideas stick.",
    image: notes,
    imageWidth: 360,
    imageHeight: 337,
  },
];

function FeatureCard({ title, description, image, imageWidth, imageHeight, layout = "wide" }: Feature) {
  const { card, body, media } = LAYOUTS[layout];

  return (
    <li className={cn("relative rounded-2xl", card)}>
      <GlowingEffect />
      <div
        className={cn(
          "relative flex h-full gap-4 overflow-hidden rounded-[inherit] border border-white/7 bg-linear-to-b from-white/4 to-white/1 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
          body,
        )}
      >
        <div className="flex-1">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-secondary-foreground mt-2 text-sm leading-relaxed">{description}</p>
        </div>
        <div className={cn("bg-[radial-gradient(closest-side,rgba(155,124,255,0.18),transparent)]", media)}>
          <img
            src={image}
            alt=""
            width={imageWidth}
            height={imageHeight}
            loading="lazy"
            decoding="async"
            className="mx-auto max-h-64 w-full object-contain"
          />
        </div>
      </div>
    </li>
  );
}

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24 md:py-32 2xl:max-w-7xl">
      <SectionHeading
        tag="Features"
        title={
          <>
            Everything you need to <GradientText>learn visually</GradientText>
          </>
        }
      >
        Powerful AI, beautiful animations, and a learning experience designed around you.
      </SectionHeading>

      <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </ul>
    </section>
  );
}
