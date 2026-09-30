import {
  BooksIcon,
  ChatCircleDotsIcon,
  CubeIcon,
  NotePencilIcon,
  StudentIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

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
  wide: { card: "", body: "items-center", media: "w-2/5 shrink-0" },
  tall: { card: "md:row-span-2", body: "flex-col", media: "mt-auto w-full" },
};

interface Feature {
  title: string;
  description: string;
  icon: PhosphorIcon;
  image: string;
  imageWidth: number;
  imageHeight: number;
  layout?: keyof typeof LAYOUTS;
}

const FEATURES: Feature[] = [
  {
    title: "AI-generated animations",
    description: "Turn any maths topic into a short Manim animation, explained step by step.",
    icon: CubeIcon,
    image: animations,
    imageWidth: 360,
    imageHeight: 356,
  },
  {
    title: "Pitched at your level",
    description: "Choose school, high school or college, and every lesson is explained just right for you.",
    icon: StudentIcon,
    image: levels,
    imageWidth: 600,
    imageHeight: 571,
    layout: "tall",
  },
  {
    title: "Ask the AI tutor",
    description: "Stuck on a step? Ask questions about your lesson and get clear answers instantly.",
    icon: ChatCircleDotsIcon,
    image: tutor,
    imageWidth: 360,
    imageHeight: 348,
  },
  {
    title: "Wide range of topics",
    description: "From calculus and linear algebra to probability, all in one place.",
    icon: BooksIcon,
    image: topics,
    imageWidth: 360,
    imageHeight: 352,
  },
  {
    title: "Notes that stay",
    description: "Write notes alongside each lesson so the ideas stick.",
    icon: NotePencilIcon,
    image: notes,
    imageWidth: 360,
    imageHeight: 337,
  },
];

function FeatureCard({ title, description, icon: Icon, image, imageWidth, imageHeight, layout = "wide" }: Feature) {
  const { card, body, media } = LAYOUTS[layout];

  return (
    <li className={cn("relative rounded-2xl", card)}>
      <GlowingEffect />
      <div
        className={cn(
          "relative flex h-full gap-4 overflow-hidden rounded-[inherit] border border-white/7 bg-linear-to-b from-white/4 to-white/1 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
          body,
        )}
      >
        <div className="flex-1">
          <span className="border-accent/25 bg-accent/10 text-accent-soft grid size-10 place-items-center rounded-xl border">
            <Icon weight="light" className="size-5" />
          </span>
          <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
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
            className="w-full object-contain"
          />
        </div>
      </div>
    </li>
  );
}

export default function Features() {
  return (
    <section id="features" className="page-width py-24 md:py-32">
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
