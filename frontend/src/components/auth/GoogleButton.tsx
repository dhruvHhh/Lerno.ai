import googleIcon from "@/assets/google.svg";
import { PRESS } from "@/lib/styles";
import { cn } from "@/lib/utils";

export default function GoogleButton() {
  return (
    <button
      type="button"
      className={cn(
        "rounded-control flex h-12 items-center justify-center gap-2.5 border border-white/10 bg-white/4 text-sm font-medium",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_0_0_0_rgba(155,124,255,0),0_0_0_0_rgba(155,124,255,0),inset_0_0_0_0_rgba(155,124,255,0)]",
        "hover:border-accent/50 hover:bg-white/6 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_0_14px_-2px_rgba(155,124,255,0.4),0_0_48px_-4px_rgba(155,124,255,0.35),inset_0_0_28px_-8px_rgba(155,124,255,0.45)]",
        PRESS,
        // Must come after PRESS so this duration wins.
        "transition-[background-color,border-color,box-shadow,scale] duration-500",
      )}
    >
      {/* Google's brand rules require the full-colour logo. */}
      <img src={googleIcon} alt="" className="size-4.5" />
      Continue with Google
    </button>
  );
}
