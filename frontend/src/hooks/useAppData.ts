import { useCallback, useEffect, useState } from "react";

import { api, isMaking, type Lesson, type Usage } from "@/lib/api";
import { saveCounts } from "@/lib/saved";

const POLL_MS = 5000;

export interface AppData {
  lessons: Lesson[] | null;
  usage: Usage | null;
  failed: boolean;
  reload: () => Promise<void>;
}

// The sidebar and the pages share one copy, so a new lesson shows everywhere at once.
export default function useAppData(): AppData {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [failed, setFailed] = useState(false);

  // Two requests, so a slow usage count never holds back the lesson list.
  const reload = useCallback(async () => {
    await Promise.all([
      api<Lesson[]>("/lessons").then(
        (next) => {
          setLessons(next);
          setFailed(false);
          saveCounts({ lessons: next.length, ready: next.filter((lesson) => lesson.status === "ready").length });
        },
        () => setFailed(true),
      ),
      api<Usage>("/usage").then(setUsage, () => {}),
    ]);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // While a lesson is being made, its spinner must turn into a result without a page refresh.
  const making = lessons?.some(isMaking) ?? false;
  useEffect(() => {
    if (!making) return;
    const timer = setInterval(reload, POLL_MS);
    return () => clearInterval(timer);
  }, [making, reload]);

  return { lessons, usage, failed, reload };
}
