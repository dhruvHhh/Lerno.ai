import { useNavigate } from "react-router-dom";

import planToAnimation from "@/assets/illustrations/plan-to-animation.webp";
import GradientText from "@/components/GradientText";
import SectionHeading from "@/components/home/SectionHeading";
import LessonPlayer from "@/components/LessonPlayer";
import { DEMO_LESSON } from "@/lib/demo-lesson";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

const EXAMPLE_TOPICS = [
  "Explain Bayes' theorem",
  "Adding vectors tip to tail",
  "Derivative of sin(x)",
  "Area under a curve",
];

function TopicInput() {
  const navigate = useNavigate();
  return <PlaceholdersAndVanishInput placeholders={EXAMPLE_TOPICS} onSubmit={() => navigate("/signup")} />;
}

const STEPS = [
  {
    title: "Tell us what you want to learn",
    description: "Enter any topic, concept, or question in your own words.",
    visual: <TopicInput />,
  },
  {
    title: "We plan and generate your lesson",
    description: "Our AI creates a structured plan and generates accurate animations using mathematical notation.",
    visual: (
      <img src={planToAnimation} alt="" width={600} height={236} loading="lazy" decoding="async" className="w-full" />
    ),
  },
  {
    title: "Watch, learn, and explore",
    description: "Get a high-quality animated lesson with clear explanations, and explore further at your own pace.",
    visual: <LessonPlayer lesson={DEMO_LESSON} />,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="page-width pb-24 md:pb-32">
      <SectionHeading
        tag="How it works"
        title={
          <>
            From your question to a <GradientText>visual lesson</GradientText>
          </>
        }
      >
        Tell us what you want to learn, and Lerno.ai turns it into a complete, animated lesson tailored to you.
      </SectionHeading>

      <ol className="mt-16 grid gap-16 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-0">
        {STEPS.map(({ title, description, visual }, index) => (
          <li key={title} className="flex flex-col lg:row-span-4 lg:grid lg:grid-rows-subgrid">
            <span className="border-accent/40 bg-accent/10 grid size-9 place-items-center rounded-full border text-sm font-medium">
              {index + 1}
            </span>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
            <p className="text-secondary-foreground mt-2 text-sm leading-relaxed">{description}</p>
            <div className="mt-8 grid place-items-center lg:h-72">{visual}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
