import { useEffect, useRef, useState, type FormEvent } from "react";

import { BUTTON, NOTE_MAX, SOLID, STAMP } from "@/components/watch/shared";
import { cn, formatTime } from "@/lib/utils";

const COUNTER_FROM = 4800;

interface NotepadProps {
  time: number;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

// A small card over the video, stamped with the moment the note belongs to.
export default function Notepad({ time, onSave, onCancel }: NotepadProps) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    field.current?.focus();
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(text.trim());
    } catch {
      // The notepad stays open with the text, so nothing typed is lost.
      setError("Couldn't save your note. Try again.");
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="absolute bottom-[46px] left-4 z-10 grid w-[min(340px,calc(100%-32px))] gap-2.5 rounded-[14px] bg-[rgba(14,13,24,0.9)] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-[16px] sm:bottom-[60px]"
    >
      <header className="text-secondary-foreground flex items-center gap-2 text-xs">
        <span>New note</span>
        <span className={STAMP}>{formatTime(time)}</span>
        {text.length >= COUNTER_FROM && (
          <span className={cn("ml-auto tabular-nums", text.length >= NOTE_MAX && "text-danger")}>
            {text.length} / {NOTE_MAX}
          </span>
        )}
      </header>
      <textarea
        ref={field}
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={NOTE_MAX}
        placeholder="What do you want to remember?"
        className="text-foreground caret-accent-soft h-[76px] w-full resize-none rounded-[10px] bg-[#05060a] px-3 py-2.5 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)] outline-none focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_2px_rgba(155,124,255,0.7)]"
      />
      {error && <p className="text-danger text-xs">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={BUTTON}>
          Cancel
        </button>
        <button type="submit" disabled={!text.trim() || saving} className={SOLID}>
          Save
        </button>
      </div>
    </form>
  );
}
