import { CtaReveal } from "@/components/ui/cta-reveal";
import { CTA, CTA_POINTER } from "@/lib/cta";
import { PRESS } from "@/lib/styles";
import { cn } from "@/lib/utils";

export default function SubmitButton({ pending, children }: { pending?: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      {...CTA_POINTER}
      className={cn(
        CTA,
        "rounded-control mt-8 h-12 text-sm font-semibold transition-[box-shadow,scale,opacity] hover:shadow-[0_0_44px_rgba(155,124,255,0.5)] disabled:cursor-wait disabled:opacity-70",
        PRESS,
      )}
    >
      <CtaReveal />
      {children}
    </button>
  );
}
