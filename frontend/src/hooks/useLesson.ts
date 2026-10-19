import { useCallback, useEffect, useState } from "react";

import { ApiError, isMaking, type LessonWithScenes, type Status } from "@/lib/api";
import { fetchLesson, storedLesson } from "@/lib/lessonStore";

const POLL_MS = 3000;

interface LessonState {
  lesson: LessonWithScenes | null;
  // The status when the page first loaded: a lesson already ready opens straight away, with no loader.
  firstStatus: Status | null;
  missing: boolean;
  offline: boolean;
}

interface LessonData extends LessonState {
  // Asks once more, for fresh video links when the old ones expire. Rejects if the server can't be reached.
  refresh: () => Promise<void>;
}

// Asks for the lesson every 3 seconds while it is being made. A hidden tab stops asking and asks again when it is seen.
export default function useLesson(id: string): LessonData {
  const [stored] = useState(() => storedLesson(id));
  const [state, setState] = useState<LessonState>({
    lesson: stored,
    firstStatus: stored?.status ?? null,
    missing: false,
    offline: false,
  });

  useEffect(() => {
    // A stored lesson is ready with fresh links; asking again would only swap the links and restart the video.
    if (stored) return;
    let active = true;
    let done = false;
    let timer = 0;

    const load = () => {
      window.clearTimeout(timer);
      fetchLesson(id)
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
  }, [id, stored]);

  const refresh = useCallback(() => fetchLesson(id).then((lesson) => setState((s) => ({ ...s, lesson }))), [id]);

  return { ...state, refresh };
}
