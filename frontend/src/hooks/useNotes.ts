import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";

export interface Note {
  id: string;
  scene_position: number;
  time_seconds: number;
  content: string;
  created_at: string;
  updated_at: string;
}

// The same order as the server's: by scene, then by time, then by when they were written.
const byMoment = (a: Note, b: Note) =>
  a.scene_position - b.scene_position || a.time_seconds - b.time_seconds || a.created_at.localeCompare(b.created_at);

// The lesson's notes. Each change waits for the server, so a failed save leaves the list as it was and throws.
export default function useNotes(lessonId: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const path = `/lessons/${lessonId}/notes`;

  useEffect(() => {
    api<Note[]>(path).then(setNotes, () => setNotes([]));
  }, [path]);

  const add = useCallback(
    async (scene_position: number, time_seconds: number, content: string) => {
      const note = await api<Note>(path, {
        method: "POST",
        body: JSON.stringify({ scene_position, time_seconds, content }),
      });
      setNotes((list) => [...list, note].sort(byMoment));
    },
    [path],
  );

  const edit = useCallback(
    async (id: string, content: string) => {
      const note = await api<Note>(`${path}/${id}`, { method: "PATCH", body: JSON.stringify({ content }) });
      setNotes((list) => list.map((n) => (n.id === id ? note : n)));
    },
    [path],
  );

  const remove = useCallback(
    async (id: string) => {
      await api(`${path}/${id}`, { method: "DELETE" });
      setNotes((list) => list.filter((n) => n.id !== id));
    },
    [path],
  );

  return { notes, add, edit, remove };
}
