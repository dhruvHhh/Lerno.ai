import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
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

export default function CtaLink({ to, size = "md", children }: CtaLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "bg-foreground text-background inline-flex items-center gap-2 rounded-full font-medium shadow-[0_0_32px_rgba(155,124,255,0.3)]",
        SIZES[size],
      )}
    >
      {children} <ArrowUpRightIcon weight="bold" className="size-4" />
    </Link>
  );
}
