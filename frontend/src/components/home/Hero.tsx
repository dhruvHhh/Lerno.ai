import { ChatCircleDotsIcon, PlayIcon, StackIcon, TimerIcon } from "@phosphor-icons/react";

import CtaLink from "@/components/CtaLink";
import GradientText from "@/components/GradientText";
import { BeyondHorizon } from "@/components/ui/beyond-horizon";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

const VALUES = [
  { icon: StackIcon, label: "3 levels" },
  { icon: TimerIcon, label: "1-minute lessons" },
  { icon: ChatCircleDotsIcon, label: "AI tutor" },
];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[720px] md:h-[880px]">
        <BeyondHorizon
          background="#050609"
          coreColor="#DCD0FF"
          coreSize={0.025}
          brightness={1.4}
          horizonY={0.75}
          speed={0.15}
          breathe={0.08}
        />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pt-32 pb-[300px] text-center md:pt-40 md:pb-[360px]">
        <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl 2xl:text-7xl">
          Turn your curiosity <br className="hidden sm:block" />
          into <GradientText>visual understanding</GradientText>
        </h1>

        <p className="text-secondary-foreground mt-6 max-w-xl text-base sm:text-lg">
          Ask about any maths topic and Lerno builds a short animated lesson that explains it step by step, at your
          level.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <CtaLink to="/signup" size="lg">
            Start learning for free
          </CtaLink>
          <HoverBorderGradient>
            <a
              href="#demo"
              className="bg-accent-surface text-foreground flex items-center gap-3 rounded-full py-2 pr-2 pl-6 font-medium"
            >
              Watch demo
              <span className="grid size-8 place-items-center rounded-full bg-white/10">
                <PlayIcon weight="fill" className="size-3.5" />
              </span>
            </a>
          </HoverBorderGradient>
        </div>

        <ul className="text-foreground mt-10 flex justify-center gap-x-5 text-xs whitespace-nowrap sm:gap-x-6 sm:text-sm">
          {VALUES.map(({ icon: Icon, label }, index) => (
            <li key={label} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="bg-border mr-4 hidden h-4 w-px sm:block" />}
              <Icon weight="light" className="size-4 sm:size-5" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
