import { SquaresFourIcon } from "@phosphor-icons/react";
import { useInView } from "motion/react";
import { useRef, useState, type ComponentType } from "react";

import {
  AnimationScenes,
  AnimationsVisual,
  LevelsVisual,
  NotesVisual,
  TopicsVisual,
  TutorVisual,
  type VisualProps,
} from "@/components/home/FeatureVisuals";
import SectionHeading from "@/components/home/SectionHeading";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  description: string;
  Visual: ComponentType<VisualProps>;
  Aside?: ComponentType<VisualProps>;
  className?: string;
}

const FEATURES: Feature[] = [
  {
    title: "AI-generated animations",
    description: "Clear, precise maths animations, built step by step from your question.",
    Visual: AnimationsVisual,
    Aside: AnimationScenes,
    className: "md:col-span-2",
  },
  {
    title: "Pitched at your level",
    description: "Pick school, high school or college, and every lesson is explained at that level.",
    Visual: LevelsVisual,
  },
  {
    title: "Ask the AI tutor",
    description: "Stuck on a step? Ask the tutor about the lesson you're watching and get an answer in seconds.",
    Visual: TutorVisual,
  },
  {
    title: "Wide range of topics",
    description: "Calculus, linear algebra, probability, geometry and more, all in one place.",
    Visual: TopicsVisual,
  },
  {
    title: "Notes that stay",
    description: "Keep notes next to each lesson, so the idea is there when you come back.",
    Visual: NotesVisual,
  },
];

// The visual plays the first time the card is on screen and replays whenever it is hovered.
// A card with an `Aside` sits side by side from md up: text and aside on the left, the visual on the right.
function FeatureCard({ title, description, Visual, Aside, className }: Feature) {
  const ref = useRef<HTMLLIElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  const [replays, setReplays] = useState(0);
  const run = seen ? replays + 1 : 0;

  return (
    <li
      ref={ref}
      onPointerEnter={() => seen && setReplays((count) => count + 1)}
      className={cn("relative rounded-2xl", className)}
    >
      <GlowingEffect />
      <div
        className={cn(
          "relative flex h-full flex-col gap-6 overflow-hidden rounded-[inherit] border border-white/7 bg-linear-to-b from-white/4 to-white/1 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
          Aside && "md:grid md:grid-cols-[2fr_3fr] md:gap-8",
        )}
      >
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
            <p className="text-secondary-foreground mt-2 text-sm leading-relaxed">{description}</p>
          </div>
          {Aside && (
            <div className="mt-auto hidden md:block">
              <Aside run={run} />
            </div>
          )}
        </div>
        <div className={Aside ? "md:h-full" : "mt-auto"}>
          <Visual run={run} />
        </div>
      </div>
    </li>
  );
}

export default function Features() {
  return (
    <section id="features" className="page-width py-20 md:py-28">
      <SectionHeading tag="Features" icon={SquaresFourIcon} title="Everything you need to learn visually">
        Every part of a lesson is built to help you see the idea, not just read about it.
      </SectionHeading>

      <ul className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </ul>
    </section>
  );
}
