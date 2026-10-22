import { useEffect, useRef, useState } from "react";

import ActionButton, { type ActionState } from "@/components/watch/ActionButton";
import Card from "@/components/watch/Card";
import { BUTTON, DONE_MS, FOLD, FOLD_MS, FOLDED, NOTE_MAX, SOLID, wait } from "@/components/watch/shared";
import Stamp from "@/components/watch/Stamp";
import type { Note } from "@/hooks/useNotes";
import type { Scene } from "@/lib/api";
import { cn, formatTime } from "@/lib/utils";

interface NotesCardProps {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  scenes: Scene[];
  onOpenNote: (note: Note) => void;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDropped: (id: string) => void;
  // Notes picked from a marker on the bar: the card shows them and lights them once. `at` replays the light.
  focus: { ids: string[]; at: number } | null;
}

export default function NotesCard({
  open,
  onClose,
  notes,
  scenes,
  onOpenNote,
  onEdit,
  onDelete,
  onDropped,
  focus,
}: NotesCardProps) {
  // Deleted notes fold away first, then leave the list. A scene whose notes are all folding folds with them.
  const [folding, setFolding] = useState<string[]>([]);
  const fold = async (id: string) => {
    setFolding((list) => [...list, id]);
    await wait(FOLD_MS);
    onDropped(id);
    setFolding((list) => list.filter((other) => other !== id));
  };

  return (
    <Card
      title="Notes"
      open={open}
      onClose={onClose}
      chip={notes.length > 0 && <span className="text-accent-soft text-xs">{notes.length} saved</span>}
    >
      {!notes.length && (
        <p className="text-muted-foreground px-2.5 py-8 text-center text-[13px]">
          No notes yet. Use the note button in the player to save a thought at the current moment.
        </p>
      )}
      {notes.length > 0 && (
        // A flex column, not a grid: only here can a folding item's negative margin take its gap away.
        <div className="flex flex-col gap-3.5">
          {scenes.map((scene) => {
            const mine = notes.filter((note) => note.scene_position === scene.position);
            if (!mine.length) return null;
            const gone = mine.every((note) => folding.includes(note.id));
            return (
              <div key={scene.position} className={cn(FOLD, gone && cn(FOLDED, "-mb-3.5"))}>
                <div className={cn("flex min-h-0 flex-col gap-2", gone && "overflow-hidden")}>
                  <h3 className="text-muted-foreground text-xs font-medium">
                    Scene {scene.position}: {scene.title}
                  </h3>
                  {mine.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      flash={focus?.ids.includes(note.id) ? focus.at : null}
                      first={focus?.ids[0] === note.id}
                      folded={folding.includes(note.id)}
                      onOpen={() => onOpenNote(note)}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDeleted={() => fold(note.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

const TOOL = "text-muted-foreground hover:text-foreground rounded-tight px-1.5 py-0.5 text-xs hover:bg-white/6";

interface NoteRowProps {
  note: Note;
  flash: number | null;
  first: boolean;
  folded: boolean;
  onOpen: () => void;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleted: () => void;
}

function NoteRow({ note, flash, first, folded, onOpen, onEdit, onDelete, onDeleted }: NoteRowProps) {
  const row = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.content);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<ActionState>("idle");
  const [deleting, setDeleting] = useState<ActionState>("idle");

  useEffect(() => {
    if (flash && first) row.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [flash, first]);

  // Busy while the server works, then a tick for a moment. On a failure the error shows and nothing changes.
  const run = async (setState: (state: ActionState) => void, action: () => Promise<void>, failure: string) => {
    setError("");
    setState("busy");
    try {
      await action();
    } catch {
      setError(failure);
      setState("idle");
      return false;
    }
    setState("done");
    await wait(DONE_MS);
    return true;
  };

  const save = async () => {
    if (!(await run(setSaving, () => onEdit(note.id, text.trim()), "Couldn't save your note. Try again."))) return;
    setEditing(false);
    setSaving("idle");
  };

  const remove = async () => {
    if (await run(setDeleting, () => onDelete(note.id), "Couldn't delete this note. Try again.")) onDeleted();
  };

  if (editing)
    return (
      <div className="rounded-tight grid gap-2 bg-white/3 p-2.5 shadow-[inset_0_0_0_1px_rgba(155,124,255,0.3)]">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          readOnly={saving !== "idle"}
          maxLength={NOTE_MAX}
          autoFocus
          aria-label="Edit note"
          className="text-foreground caret-accent-soft rounded-tight h-20 resize-none bg-[#05060a] px-2.5 py-2 text-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] outline-none"
        />
        {error && <p className="text-danger text-xs">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} disabled={saving !== "idle"} className={BUTTON}>
            Cancel
          </button>
          <ActionButton
            type="button"
            state={saving}
            labels={["Save", "Saving…", "Saved"]}
            disabled={!text.trim()}
            onClick={save}
            className={SOLID}
          />
        </div>
      </div>
    );

  return (
    <div className={cn(FOLD, folded && cn(FOLDED, "-mb-2"))}>
      <div className={cn("min-h-0", folded && "overflow-hidden")}>
        <div
          ref={row}
          className="group rounded-tight relative grid gap-1 bg-white/3 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors duration-250 hover:bg-white/5"
        >
          {flash && (
            <span
              key={flash}
              aria-hidden="true"
              className="animate-note-flash rounded-tight pointer-events-none absolute inset-0"
            />
          )}
          <button
            type="button"
            onClick={onOpen}
            className="grid gap-1 text-left"
            aria-label={`Play from ${formatTime(note.time_seconds)}`}
          >
            <Stamp note className="justify-self-start">
              {formatTime(note.time_seconds)}
            </Stamp>
            <p className="text-sm leading-normal whitespace-pre-line">{note.content}</p>
          </button>
          {error && <p className="text-danger text-xs">{error}</p>}
          <span
            className={cn(
              // A touch screen has no hover, so there the tools always show.
              "absolute top-2 right-2 flex gap-0.5 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100",
              deleting !== "idle" && "opacity-100",
            )}
          >
            <button type="button" onClick={() => setEditing(true)} disabled={deleting !== "idle"} className={TOOL}>
              Edit
            </button>
            <ActionButton
              type="button"
              state={deleting}
              labels={["Delete", "Deleting…", "Deleted"]}
              onClick={remove}
              className={TOOL}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
