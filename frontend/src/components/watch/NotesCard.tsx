import { useState } from "react";

import Card from "@/components/watch/Card";
import { BUTTON, NOTE_MAX, SOLID, STAMP } from "@/components/watch/shared";
import type { Note } from "@/hooks/useNotes";
import type { Scene } from "@/lib/api";
import { formatTime } from "@/lib/utils";

interface NotesCardProps {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  scenes: Scene[];
  onOpenNote: (note: Note) => void;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  className?: string;
}

export default function NotesCard({
  open,
  onClose,
  notes,
  scenes,
  onOpenNote,
  onEdit,
  onDelete,
  className,
}: NotesCardProps) {
  return (
    <Card
      title="Notes"
      open={open}
      onClose={onClose}
      chip={notes.length > 0 && <span className="text-accent-soft text-xs">{notes.length} saved</span>}
      className={className}
    >
      {!notes.length && (
        <p className="text-muted-foreground px-2.5 py-8 text-center text-[13px]">
          No notes yet. Use the note button in the player to save a thought at the current moment.
        </p>
      )}
      {scenes.map((scene) => {
        const mine = notes.filter((note) => note.scene_position === scene.position);
        if (!mine.length) return null;
        return (
          <div key={scene.position} className="grid gap-2">
            <h3 className="text-muted-foreground text-xs font-medium">
              Scene {scene.position}: {scene.title}
            </h3>
            {mine.map((note) => (
              <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note)} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        );
      })}
    </Card>
  );
}

const TOOL = "text-muted-foreground hover:text-foreground rounded-md px-1.5 py-0.5 text-xs hover:bg-white/6";

interface NoteRowProps {
  note: Note;
  onOpen: () => void;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function NoteRow({ note, onOpen, onEdit, onDelete }: NoteRowProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.content);
  const [error, setError] = useState("");

  const run = async (action: () => Promise<void>, failure: string) => {
    setError("");
    try {
      await action();
      setEditing(false);
    } catch {
      setError(failure);
    }
  };

  if (editing)
    return (
      <div className="grid gap-2 rounded-xl bg-white/3 p-2.5 shadow-[inset_0_0_0_1px_rgba(155,124,255,0.3)]">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={NOTE_MAX}
          autoFocus
          aria-label="Edit note"
          className="text-foreground caret-accent-soft h-20 resize-none rounded-lg bg-[#05060a] px-2.5 py-2 text-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] outline-none"
        />
        {error && <p className="text-danger text-xs">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className={BUTTON}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => run(() => onEdit(note.id, text.trim()), "Couldn't save your note. Try again.")}
            className={SOLID}
          >
            Save
          </button>
        </div>
      </div>
    );

  return (
    <div className="group hover:bg-accent/6 relative grid gap-1 rounded-xl bg-white/3 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors duration-250">
      <button
        type="button"
        onClick={onOpen}
        className="grid gap-1 text-left"
        aria-label={`Play from ${formatTime(note.time_seconds)}`}
      >
        <span className={`${STAMP} justify-self-start`}>{formatTime(note.time_seconds)}</span>
        <p className="text-sm leading-normal whitespace-pre-line">{note.content}</p>
      </button>
      {error && <p className="text-danger text-xs">{error}</p>}
      <span className="absolute top-2 right-2 flex gap-0.5 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" onClick={() => setEditing(true)} className={TOOL}>
          Edit
        </button>
        <button
          type="button"
          onClick={() => run(() => onDelete(note.id), "Couldn't delete this note. Try again.")}
          className={TOOL}
        >
          Delete
        </button>
      </span>
    </div>
  );
}
