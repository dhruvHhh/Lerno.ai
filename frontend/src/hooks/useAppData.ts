import { useCallback, useEffect, useRef, useState } from "react";

import useAuth from "@/hooks/useAuth";
import { api, isMaking, type Lesson, type Usage } from "@/lib/api";
import { type LessonCounts, saveCounts, savedCounts } from "@/lib/saved";

const POLL_MS = 5000;

export interface AppData {
  lessons: Lesson[] | null;
  usage: Usage | null;
  failed: boolean;
  // From this person's last visit on this browser; null on their first.
  lastCounts: LessonCounts | null;
  reload: () => Promise<void>;
}

// The sidebar and the pages share one copy, so a new lesson shows everywhere at once.
export default function useAppData(): AppData {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [failed, setFailed] = useState(false);
  // The app only shows to a signed-in person. Kept from the first render, as the user is gone during sign-out.
  const { user } = useAuth();
  const [userId] = useState(() => user!.id);
  const [lastCounts] = useState(() => savedCounts(userId));
  // An answer that comes back after sign-out must not save the last person's counts again.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Two requests, so a slow usage count never holds back the lesson list.
  const reload = useCallback(async () => {
    await Promise.all([
      api<Lesson[]>("/lessons").then(
        (next) => {
          if (!alive.current) return;
          setLessons(next);
          setFailed(false);
          saveCounts(userId, {
            lessons: next.length,
            ready: next.filter((lesson) => lesson.status === "ready").length,
          });
        },
        () => setFailed(true),
      ),
      api<Usage>("/usage").then(setUsage, () => {}),
    ]);
  }, [userId]);

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

  return { lessons, usage, failed, lastCounts, reload };
}
