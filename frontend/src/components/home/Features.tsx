import {
  BooksIcon,
  ChatCircleDotsIcon,
  CubeIcon,
  NotePencilIcon,
  StudentIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

import calculus from "@/assets/icons/calculus_hero.webp";
import interactive from "@/assets/icons/interactive_concepts_feature.webp";
import notes from "@/assets/icons/notes_practice_feature.webp";
import progression from "@/assets/icons/progression_feature.webp";
import topics from "@/assets/icons/range_of_topics_feature.webp";
import SectionHeading from "@/components/home/SectionHeading";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  description: string;
  icon: PhosphorIcon;
  image: string;
  imageHeight: number;
  tall?: boolean;
}

const FEATURES: Feature[] = [
  {
    title: "AI-generated animations",
    description: "Turn any maths topic into a short Manim animation, explained step by step.",
    icon: CubeIcon,
    image: calculus,
    imageHeight: 594,
  },
  {
    title: "Pitched at your level",
    description: "Choose school, high school or college, and every lesson is explained just right for you.",
    icon: StudentIcon,
    image: progression,
    imageHeight: 571,
    tall: true,
  },
  {
    title: "Ask the AI tutor",
    description: "Stuck on a step? Ask questions about your lesson and get clear answers instantly.",
    icon: ChatCircleDotsIcon,
    image: interactive,
    imageHeight: 580,
  },
  {
    title: "Wide range of topics",
    description: "From calculus and linear algebra to probability, all in one place.",
    icon: BooksIcon,
    image: topics,
    imageHeight: 586,
  },
  {
    title: "Notes that stay",
    description: "Write notes alongside each lesson so the ideas stick.",
    icon: NotePencilIcon,
    image: notes,
    imageHeight: 562,
  },
];

function FeatureCard({ title, description, icon: Icon, image, imageHeight, tall }: Feature) {
  return (
    <li className={cn("relative rounded-2xl", tall && "md:row-span-2")}>
      <GlowingEffect />
      <div
        className={cn(
          "relative flex h-full gap-4 overflow-hidden rounded-[inherit] border border-white/7 bg-linear-to-b from-white/4 to-white/1 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
          tall ? "flex-col" : "items-center",
        )}
      >
        <div className="flex-1">
          <span className="border-accent/25 bg-accent/10 text-accent-soft grid size-10 place-items-center rounded-xl border">
            <Icon weight="light" className="size-5" />
          </span>
          <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-secondary-foreground mt-2 text-sm leading-relaxed">{description}</p>
        </div>
        <div
          className={cn(
            "bg-[radial-gradient(closest-side,rgba(155,124,255,0.18),transparent)]",
            tall ? "mt-auto w-full" : "w-2/5 shrink-0",
          )}
        >
          <img
            src={image}
            alt=""
            width={600}
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
      <SectionHeading tag="Features" title="Everything you need to" highlight="learn visually">
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
