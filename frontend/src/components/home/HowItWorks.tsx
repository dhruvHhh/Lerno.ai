import { ArrowRightIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

import planToAnimation from "@/assets/icons/step_2_how_it_works.webp";
import SectionHeading from "@/components/home/SectionHeading";
import LessonPlayer from "@/components/LessonPlayer";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

const EXAMPLE_TOPICS = [
  "Explain Bayes' theorem",
  "Adding vectors tip to tail",
  "Derivative of sin(x)",
  "Area under a curve",
];

export default function HowItWorks() {
  const navigate = useNavigate();

  const steps = [
    {
      title: "Tell us what you want to learn",
      description: "Enter any topic, concept, or question in your own words.",
      visual: <PlaceholdersAndVanishInput placeholders={EXAMPLE_TOPICS} onSubmit={() => navigate("/signup")} />,
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
      visual: (
        <LessonPlayer
          src="/videos/vectors-demo.mp4"
          poster="/videos/vectors-demo.webp"
          label="An AI-generated Lerno lesson on adding vectors tip to tail"
          autoPlay
        />
      ),
    },
  ];

  return (
    <section id="how-it-works" className="page-width pb-24 md:pb-32">
      <SectionHeading tag="How it works" title="From your question to a" highlight="visual lesson">
        Tell us what you want to learn, and Lerno.ai turns it into a complete, animated lesson tailored to you.
      </SectionHeading>

      <ol className="mt-16 grid gap-16 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-0">
        {steps.map(({ title, description, visual }, index) => (
          <li key={title} className="flex flex-col lg:row-span-4 lg:grid lg:grid-rows-subgrid">
            <span className="border-accent/40 bg-accent/10 grid size-9 place-items-center rounded-full border text-sm font-medium">
              {index + 1}
            </span>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
            <p className="text-secondary-foreground mt-2 text-sm leading-relaxed">{description}</p>
            <div className="relative mt-8 grid place-items-center lg:h-72">
              {visual}
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="border-accent/30 bg-accent-surface text-accent-soft absolute -bottom-12 left-1/2 z-10 grid size-9 -translate-x-1/2 rotate-90 place-items-center rounded-full border lg:top-1/2 lg:-right-8 lg:bottom-auto lg:left-auto lg:translate-x-1/2 lg:-translate-y-1/2 lg:rotate-0"
                >
                  <ArrowRightIcon weight="bold" className="size-4" />
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
