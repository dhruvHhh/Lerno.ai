import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { PointerEvent, ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

const SIZES = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5",
};

interface CtaLinkProps {
  to: string;
  size?: keyof typeof SIZES;
  children: ReactNode;
}

const trackPointer = (event: PointerEvent<HTMLAnchorElement>) => {
  const link = event.currentTarget;
  const { left, top, width, height } = link.getBoundingClientRect();
  link.style.setProperty("--reveal-x", `${((event.clientX - left) / width) * 100}%`);
  link.style.setProperty("--reveal-y", `${((event.clientY - top) / height) * 100}%`);
};

export default function CtaLink({ to, size = "md", children }: CtaLinkProps) {
  return (
    <Link
      to={to}
      onPointerEnter={trackPointer}
      onPointerLeave={trackPointer}
      className={cn(
        "cta bg-foreground text-background relative isolate inline-flex items-center gap-2 overflow-hidden rounded-full font-medium shadow-[0_0_32px_rgba(155,124,255,0.3)] outline-none",
        SIZES[size],
      )}
    >
      <span
        aria-hidden="true"
        className="bg-brand-gradient cta-hover:[--reveal-r:150%] absolute inset-0 -z-10 transition-[--reveal-r] duration-450 ease-in-out [clip-path:circle(var(--reveal-r)_at_var(--reveal-x,50%)_var(--reveal-y,50%))] motion-reduce:transition-none"
      />
      {children}
      <ArrowUpRightIcon
        weight="bold"
        className="cta-hover:translate-x-0.5 cta-hover:-translate-y-0.5 ease-snappy size-4 transition-transform duration-350 motion-reduce:transition-none"
      />
    </Link>
  );
}
