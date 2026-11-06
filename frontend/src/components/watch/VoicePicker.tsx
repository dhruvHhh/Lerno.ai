import Picker from "@/components/ui/picker";
import type useVoice from "@/hooks/useVoice";
import type { Language } from "@/lib/api";
import { cn } from "@/lib/utils";

// Each language in its own script, so a student finds theirs at a glance, and in English for everyone else.
const OPTIONS: [Language | "en", string][] = [
  ["en", "English"],
  ["hi", "हिन्दी (Hindi)"],
  ["ta", "தமிழ் (Tamil)"],
  ["bn", "বাংলা (Bengali)"],
];
export const LANGUAGE_NAMES: Record<Language, string> = { hi: "Hindi", ta: "Tamil", bn: "Bengali" };

export default function VoicePicker({
  voice,
  onPick,
  className,
}: {
  voice: ReturnType<typeof useVoice>;
  onPick: (language: Language | "en") => void;
  className?: string;
}) {
  const name = voice.language === "en" ? "" : LANGUAGE_NAMES[voice.language];

  return (
    <div className={cn("mt-3 flex flex-col items-end gap-1.5 sm:mt-4", className)}>
      <Picker label="Voice" options={OPTIONS} value={voice.language} onPick={onPick} />

      <p aria-live="polite" className="text-muted-foreground text-xs empty:hidden">
        {voice.error ??
          (voice.failed && (
            <>
              Couldn't make the {name} voice.{" "}
              <button
                type="button"
                onClick={() => onPick(voice.language)}
                className="text-foreground cursor-pointer underline"
              >
                Try again
              </button>
            </>
          ))}
      </p>
    </div>
  );
}
