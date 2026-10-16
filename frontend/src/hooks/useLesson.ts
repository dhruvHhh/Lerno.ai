import { useEffect, useState } from "react";

import { api, ApiError, isMaking, type LessonWithScenes, type Status } from "@/lib/api";

const POLL_MS = 3000;

export interface LessonState {
  lesson: LessonWithScenes | null;
  // The status when the page first loaded: a lesson already ready opens straight away, with no loader.
  firstStatus: Status | null;
  missing: boolean;
  offline: boolean;
}

// Asks for the lesson every 3 seconds while it is being made. A hidden tab stops asking and asks again when it is seen.
export default function useLesson(id: string): LessonState {
  const [state, setState] = useState<LessonState>({ lesson: null, firstStatus: null, missing: false, offline: false });

  useEffect(() => {
    let active = true;
    let done = false;
    let timer = 0;

    const load = () => {
      window.clearTimeout(timer);
      api<LessonWithScenes>(`/lessons/${id}`)
        .then(
          (lesson) => {
            done = !isMaking(lesson);
            if (active)
              setState((s) => ({ ...s, lesson, firstStatus: s.firstStatus ?? lesson.status, offline: false }));
          },
          (error: ApiError) => {
            // A bad id is not found either. Any other failure keeps the last step and keeps asking.
            const missing = error.status === 404 || error.status === 422;
            done = missing;
            if (active) setState((s) => (missing ? { ...s, missing } : { ...s, offline: true }));
          },
        )
        .then(() => {
          if (active && !done && !document.hidden) timer = window.setTimeout(load, POLL_MS);
        });
    };
    const onVisibility = () => !document.hidden && !done && load();

    load();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [id]);

  return state;
}
