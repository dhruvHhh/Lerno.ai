import { cn } from "@/lib/utils";

export const KEY =
  "bg-linear-to-b from-[#1d2030] to-[#141723] shadow-[0_1px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/7";

export const RAISED_KEY =
  "bg-linear-to-b from-[#1d2030] to-[#141723] shadow-[0_1px_3px_rgba(0,0,0,0.5),0_0_14px_rgba(155,124,255,0.12),inset_0_1px_0_rgba(183,164,255,0.22)] ring-1 ring-white/7";

export const SNAPPY = "duration-300 ease-snappy";

// The long background transition keeps autofilled fields dark.
export const FIELD = cn(
  "placeholder:text-muted-foreground caret-accent-soft h-12 w-full rounded-control bg-[#05060a] px-4 text-sm outline-none",
  "shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_0_rgba(155,124,255,0)] ring-1 ring-white/10",
  "hover:ring-2 hover:ring-accent/55 hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_3px_rgba(155,124,255,0.12)]",
  "focus:ring-2 focus:ring-accent/80 focus:bg-[#08090f] focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_6px_rgba(155,124,255,0.22)]",
  "aria-invalid:ring-danger/70 aria-invalid:focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_6px_rgba(255,127,122,0.18)]",
  "ease-spring transition-[box-shadow,background-color] duration-[400ms]",
  "autofill:[-webkit-text-fill-color:#f5f5f7] autofill:[transition:background-color_99999s,box-shadow_400ms_cubic-bezier(0.34,1.56,0.64,1)]",
);

export const UNDERLINE = cn(
  "bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat pb-px",
  "transition-[background-size] hover:bg-[length:100%_1px]",
  SNAPPY,
);

export const PRESS = cn("active:scale-[0.985]", SNAPPY);
