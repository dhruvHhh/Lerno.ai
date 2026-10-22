import { X } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { ICON_BUTTON } from "@/components/app/Sidebar";
import { cn } from "@/lib/utils";

interface CardProps {
  title: string;
  open: boolean;
  onClose: () => void;
  chip?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

// A floating panel the dock opens. It stays mounted when closed, so it can fade out and keep its scroll. On desktop it
// sits beside the scenes panel, at the `--rail-edge` the lesson page sets.
export default function Card({ title, open, onClose, chip, footer, children }: CardProps) {
  return (
    <section
      data-card
      aria-label={title}
      inert={!open}
      className={cn(
        "rounded-panel fixed inset-x-2 bottom-2 z-40 flex h-[72vh] origin-bottom flex-col overflow-hidden lg:inset-x-auto lg:right-(--rail-edge) lg:bottom-24 lg:z-[29] lg:h-[min(540px,calc(100vh-140px))] lg:w-[380px] lg:origin-bottom-right",
        "bg-linear-to-b from-[rgba(20,18,33,0.985)] to-[rgba(10,10,18,0.99)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_0_0_1px_rgba(255,255,255,0.08),0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-[22px]",
        "ease-snappy transition-[opacity,scale,right] duration-[400ms]",
        open ? "opacity-100" : "pointer-events-none scale-[0.94] opacity-0",
      )}
    >
      <div className="flex flex-none items-center gap-2.5 border-b border-white/6 py-3 pr-3 pl-[18px]">
        <b className="text-[15px] font-semibold">{title}</b>
        {chip}
        <button type="button" onClick={onClose} aria-label="Close" className={cn(ICON_BUTTON, "ml-auto")}>
          <X size={18} />
        </button>
      </div>
      <div
        data-lenis-prevent
        className="grid flex-1 [scrollbar-width:thin] content-start gap-3.5 overflow-y-auto px-[18px] py-4"
      >
        {children}
      </div>
      {footer}
    </section>
  );
}
