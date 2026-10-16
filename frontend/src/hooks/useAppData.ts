import { useCallback, useEffect, useState } from "react";

import { api, isMaking, type Lesson, type Usage } from "@/lib/api";

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

  const reload = useCallback(
    () =>
      Promise.all([api<Lesson[]>("/lessons"), api<Usage>("/usage")]).then(
        ([nextLessons, nextUsage]) => {
          setLessons(nextLessons);
          setUsage(nextUsage);
          setFailed(false);
        },
        () => setFailed(true),
      ),
    [],
  );

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
