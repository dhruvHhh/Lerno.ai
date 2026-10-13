import { SquaresFourIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";

import {
  AnimationsVisual,
  LevelsVisual,
  NotesVisual,
  TopicsVisual,
  TutorVisual,
} from "@/components/home/FeatureVisuals";
import SectionHeading from "@/components/home/SectionHeading";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

interface Feature {
  name: string;
  detail: string;
  Visual: ComponentType;
  className?: string;
}

const FEATURES: Feature[] = [
  {
    name: "Animations",
    detail: "drawn step by step from your question.",
    Visual: AnimationsVisual,
    className: "md:col-span-2",
  },
  { name: "Levels", detail: "for school, high school and college.", Visual: LevelsVisual },
  { name: "A tutor", detail: "that answers questions about the lesson you're watching.", Visual: TutorVisual },
  { name: "Topics", detail: "from calculus to probability, and more.", Visual: TopicsVisual },
  { name: "Notes", detail: "pinned to the moment in the lesson.", Visual: NotesVisual },
];

// One cell of the grid: a one-line caption, then a visual anchored to the cell's bottom edge, so visuals line up
// across a row. It plays once when it scrolls into view.
function FeatureCell({ name, detail, Visual, className }: Feature) {
  return (
    <li className={cn("bg-background flex flex-col p-6 sm:p-8", className)}>
      <p className="max-w-sm leading-relaxed">
        <span className="font-medium">{name}</span> <span className="text-secondary-foreground">{detail}</span>
      </p>
      <Reveal aria-hidden="true" className="mt-8 flex min-h-56 flex-1 flex-col justify-end overflow-hidden">
        <Visual />
      </Reveal>
    </li>
  );
}

export default function Features() {
  return (
    <section id="features" className="page-width py-20 md:py-28">
      <SectionHeading tag="Features" icon={SquaresFourIcon} title="Everything you need to learn visually">
        Animated lessons at your level, with a tutor and notes, in one place.
      </SectionHeading>

      {/* The 1px gaps show the background behind the cells, drawing hairlines between them. */}
      <ul className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCell key={feature.name} {...feature} />
        ))}
      </ul>
    </section>
  );
}
