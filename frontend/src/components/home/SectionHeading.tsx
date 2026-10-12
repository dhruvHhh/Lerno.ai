import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  tag: string;
  icon: Icon;
  title: ReactNode;
  children: ReactNode;
}

// The tag is a small chip: an icon on a tile in the logo's violet, then the section's name.
export default function SectionHeading({ tag, icon: TagIcon, title, children }: SectionHeadingProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/4 py-1 pr-3 pl-1 text-sm font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <span className="grid size-6 place-items-center rounded-md bg-linear-to-br from-[#9f8cf5] to-[#6a55cf] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]">
          <TagIcon weight="fill" className="size-3.5" />
        </span>
        {tag}
      </p>
      <h2 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="text-secondary-foreground mt-4 max-w-2xl text-base sm:text-lg">{children}</p>
    </div>
  );
}
