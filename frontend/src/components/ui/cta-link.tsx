import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { CtaReveal } from "@/components/ui/cta-reveal";
import { CTA, CTA_POINTER } from "@/lib/cta";
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

export default function CtaLink({ to, size = "md", children }: CtaLinkProps) {
  return (
    <Link
      to={to}
      {...CTA_POINTER}
      className={cn(CTA, "inline-flex items-center gap-2 rounded-full font-medium outline-none", SIZES[size])}
    >
      <CtaReveal />
      {children}
      <ArrowUpRightIcon
        weight="bold"
        className="cta-hover:translate-x-0.5 cta-hover:-translate-y-0.5 ease-snappy size-4 transition-transform duration-350 motion-reduce:transition-none"
      />
    </Link>
  );
}
