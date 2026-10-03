import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import PlanDiagram from "@/components/home/PlanDiagram";
import SectionHeading from "@/components/home/SectionHeading";
import LessonPlayer from "@/components/LessonPlayer";
import { DEMO_LESSONS } from "@/lib/demo-lessons";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { KEY } from "@/lib/styles";
import { cn } from "@/lib/utils";

const EXAMPLE_TOPICS = [
  "Explain Bayes' theorem",
  "Adding vectors tip to tail",
  "Derivative of sin(x)",
  "Area under a curve",
];

const LEVELS = ["School", "High school", "College"];

function TopicInput() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <PlaceholdersAndVanishInput placeholders={EXAMPLE_TOPICS} onSubmit={() => navigate("/signup")} />
      <SegmentedControl options={LEVELS} selected={level} onSelect={setLevel} label="Level" />
    </div>
  );
}

// The same 16:9 black frame as the lesson player, so all three steps line up.
function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("aspect-video w-full overflow-hidden rounded-[16px] bg-black", className)}>{children}</div>;
}

// Step 3 opens on the strips scene, so the result picks up where the step 2 plan leaves off.
const STRIPS_LESSON = { ...DEMO_LESSONS[0], start: 10.5, poster: "/videos/area-under-curve-strips.webp" };

const STEPS = [
  {
    title: "Tell us what you want to learn",
    description: "Enter any topic, concept, or question in your own words.",
    visual: (
      <Stage className="grid place-items-center bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[24px_24px] px-5">
        <TopicInput />
      </Stage>
    ),
  },
  {
    title: "We plan and generate your lesson",
    description: "Our AI creates a structured plan and generates accurate animations using mathematical notation.",
    visual: (
      <Stage>
        <PlanDiagram />
      </Stage>
    ),
  },
  {
    title: "Watch, learn, and explore",
    description: "Get a high-quality animated lesson with clear explanations, and explore further at your own pace.",
    visual: <LessonPlayer lesson={STRIPS_LESSON} />,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="page-width pb-16 md:pb-20">
      <SectionHeading tag="How it works" title="From your question to a visual lesson">
        Tell us what you want to learn, and Lerno turns it into a complete, animated lesson tailored to you.
      </SectionHeading>

      <ol className="mt-16 grid gap-16 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-0">
        {STEPS.map(({ title, description, visual }, index) => (
          <li key={title} className="flex flex-col lg:row-span-4 lg:grid lg:grid-rows-subgrid">
            <span className={cn("grid size-9 place-items-center rounded-full text-sm font-medium", KEY)}>
              {index + 1}
            </span>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
            <p className="text-secondary-foreground mt-2 text-sm leading-relaxed">{description}</p>
            <div className="mt-8">{visual}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
