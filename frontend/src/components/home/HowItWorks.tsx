import { PathIcon } from "@phosphor-icons/react";
import { useLenis } from "lenis/react";
import {
  AnimatePresence,
  m,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState, type ComponentProps } from "react";

import SectionHeading from "@/components/home/SectionHeading";
import { AskPanel, ExplorePanel, PlanPanel, WatchPanel } from "@/components/home/StepPanels";
import CtaLink from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";
import useMediaQuery, { DESKTOP } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Ask", description: "Type any maths question in your own words and pick your level.", Panel: AskPanel },
  { title: "Plan", description: "Lerno writes a scene-by-scene plan, then animates each scene.", Panel: PlanPanel },
  { title: "Watch", description: "A short animated lesson that explains each step.", Panel: WatchPanel },
  { title: "Explore", description: "Ask the tutor about any step, keep notes, and go deeper.", Panel: ExplorePanel },
];

const stepNumber = (index: number) => String(index + 1).padStart(2, "0");

const LATTICE = "rgba(255,255,255,0.035) 0 1px, transparent 1px 96px";

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E")`;

const PANEL_BACKGROUND = [
  GRAIN,
  `repeating-linear-gradient(45deg, ${LATTICE})`,
  `repeating-linear-gradient(-45deg, ${LATTICE})`,
  "radial-gradient(90% 70% at 0% 0%, rgba(155,124,255,0.42), transparent 70%)",
  "linear-gradient(160deg, #1b1440, #0b0a1a)",
].join(", ");

function VioletPanel({ className, style, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] ring-1 ring-white/8",
        className,
      )}
      style={{ backgroundImage: PANEL_BACKGROUND, ...style }}
      {...props}
    />
  );
}

interface StepItemProps {
  index: number;
  title: string;
  description: string;
  active: boolean;
  progress: MotionValue<number>;
  onSelect: () => void;
}

function StepItem({ index, title, description, active, progress, onSelect }: StepItemProps) {
  const fill = useTransform(progress, [index / STEPS.length, (index + 1) / STEPS.length], [0, 1]);

  return (
    <li className="relative pl-6">
      <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-white/10" />
      <m.span
        style={{ scaleY: fill }}
        className={cn(
          "bg-accent absolute inset-y-0 left-0 w-0.5 origin-top rounded-full transition-opacity duration-300",
          !active && "opacity-0",
        )}
      />
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "step" : undefined}
        className="group flex items-baseline gap-3 py-3 text-2xl font-medium tracking-tight"
      >
        <span
          className={cn(
            "tabular-nums transition-colors duration-300",
            active ? "text-accent-soft" : "text-muted-foreground",
          )}
        >
          {stepNumber(index)}
        </span>
        <span
          className={cn(
            "transition-colors duration-300",
            active ? "text-foreground" : "text-muted-foreground group-hover:text-secondary-foreground",
          )}
        >
          {title}
        </span>
      </button>
      <div
        className={cn(
          "ease-snappy grid transition-[grid-template-rows] duration-500",
          active ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <p className="text-secondary-foreground max-w-sm pb-4 text-lg leading-relaxed">{description}</p>
        </div>
      </div>
    </li>
  );
}

// Scroll per step while pinned, in % of screen height.
const STEP_SCROLL_SVH = 45;

function PinnedSteps() {
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  const seen = useInView(panelRef, { once: true, amount: 0.5 });
  const still = useReducedMotion();
  const lenis = useLenis();

  useMotionValueEvent(scrollYProgress, "change", (progress) =>
    setActive(Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))),
  );

  const jumpTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const target = top + ((index + 0.5) / STEPS.length) * (track.offsetHeight - window.innerHeight);
    if (lenis) lenis.scrollTo(target, { duration: 1 });
    else window.scrollTo({ top: target });
  };

  const { Panel } = STEPS[active];

  return (
    <div ref={trackRef} style={{ height: `${STEPS.length * STEP_SCROLL_SVH + 100}svh` }} className="relative mt-8">
      {/* Sticky makes its own layer, so an expanded lesson can sit above the navbar. */}
      <div className="sticky top-0 flex h-svh items-center pt-16 has-[[role=dialog]]:z-60">
        <div className="page-width grid grid-cols-[2fr_3fr] items-center gap-16">
          <div>
            {/* Fixed height, so the list doesn't jump as descriptions open. */}
            <ol className="flex h-86 flex-col gap-3">
              {STEPS.map(({ title, description }, index) => (
                <StepItem
                  key={title}
                  index={index}
                  title={title}
                  description={description}
                  active={index === active}
                  progress={scrollYProgress}
                  onSelect={() => jumpTo(index)}
                />
              ))}
            </ol>
            <div className="mt-8 pl-6">
              <CtaLink to="/signup">Start learning for free</CtaLink>
            </div>
          </div>
          <VioletPanel ref={panelRef} className="relative h-[min(36rem,calc(100svh-9rem))]">
            <AnimatePresence initial={false}>
              <m.div
                key={active}
                initial={still ? false : "hidden"}
                animate={seen ? "shown" : "hidden"}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                // A mask would clip the expanded lesson, so drop it then.
                className="absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_88%,transparent)] px-10 pt-12 has-[[role=dialog]]:[mask-image:none]"
              >
                <div className="mx-auto h-full max-w-xl">
                  <Panel />
                </div>
              </m.div>
            </AnimatePresence>
          </VioletPanel>
        </div>
      </div>
    </div>
  );
}

function StackedSteps() {
  return (
    <ol className="page-width mt-14 flex flex-col gap-16">
      {STEPS.map(({ title, description, Panel }, index) => (
        <li key={title}>
          <p className="flex items-baseline gap-3 text-2xl font-medium tracking-tight">
            <span className="text-accent-soft tabular-nums">{stepNumber(index)}</span>
            {title}
          </p>
          <p className="text-secondary-foreground mt-2 leading-relaxed">{description}</p>
          <VioletPanel className="mt-6 px-4 pt-6 sm:px-8 sm:pt-8">
            <Reveal className="mx-auto max-w-xl">
              <Panel />
            </Reveal>
          </VioletPanel>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorks() {
  const wide = useMediaQuery(DESKTOP);

  return (
    <section id="how-it-works" className="pt-4 pb-16 md:pb-20">
      <div className="page-width">
        <SectionHeading tag="How it works" icon={PathIcon} title="From your question to a visual lesson">
          Ask a question. Watch it come to life.
        </SectionHeading>
      </div>
      {wide ? <PinnedSteps /> : <StackedSteps />}
    </section>
  );
}
