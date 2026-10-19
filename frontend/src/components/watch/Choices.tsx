import { cn } from "@/lib/utils";

interface ChoicesProps {
  choices: string[];
  correct: number;
  picked: number | undefined;
  onPick: (choice: number) => void;
  small?: boolean;
}

// Once a choice is picked, all lock: the right one turns green, a wrong pick turns red.
export default function Choices({ choices, correct, picked, onPick, small }: ChoicesProps) {
  const answered = picked !== undefined;
  return (
    <div className="grid gap-2">
      {choices.map((choice, k) => (
        <button
          key={k}
          type="button"
          disabled={answered}
          onClick={() => onPick(k)}
          className={cn(
            "text-foreground rounded-tight flex items-center gap-3 bg-white/4 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-[background-color,box-shadow] duration-250",
            small ? "px-2.5 py-2 text-[13px]" : "px-3.5 py-3 text-[13px] sm:text-[15px]",
            !answered && "hover:bg-accent/8 hover:shadow-[inset_0_0_0_1px_rgba(155,124,255,0.45)]",
            answered && k === correct && "bg-[rgba(120,220,170,0.1)] shadow-[inset_0_0_0_1px_rgba(120,220,170,0.55)]",
            answered && k === picked && k !== correct && "bg-danger/8 shadow-[inset_0_0_0_1px_rgba(255,127,122,0.5)]",
          )}
        >
          <span
            className={cn(
              "text-secondary-foreground rounded-tight grid flex-none place-items-center text-xs shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]",
              small ? "size-5 text-[11px]" : "size-6",
            )}
          >
            {"ABCD"[k]}
          </span>
          {choice}
        </button>
      ))}
    </div>
  );
}
