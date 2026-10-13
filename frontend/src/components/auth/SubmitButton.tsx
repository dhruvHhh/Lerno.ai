import { CtaReveal } from "@/components/ui/cta-reveal";
import { trackPointer } from "@/lib/cta";
import { PRESS } from "@/lib/styles";
import { cn } from "@/lib/utils";

export default function SubmitButton({ children }: { children: string }) {
  return (
    <button
      type="submit"
      onPointerEnter={trackPointer}
      onPointerLeave={trackPointer}
      className={cn(
        "cta bg-foreground text-background rounded-control relative isolate mt-8 h-12 overflow-hidden text-sm font-semibold",
        "shadow-[0_0_32px_rgba(155,124,255,0.3)] transition-[box-shadow,scale] hover:shadow-[0_0_44px_rgba(155,124,255,0.5)]",
        PRESS,
      )}
    >
      <CtaReveal />
      {children}
    </button>
  );
}
