import { useCallback, useEffect, useRef, useState } from "react";

import useAuth from "@/hooks/useAuth";
import { api, isMaking, type Lesson, type Usage } from "@/lib/api";
import { type LessonCounts, saveCounts, savedCounts } from "@/lib/saved";

const POLL_MS = 5000;
// LESSON_PAGE_SIZE in the backend's config.py: a shorter page means the oldest lesson is loaded.
const PAGE_SIZE = 30;

export interface AppData {
  lessons: Lesson[] | null;
  usage: Usage | null;
  failed: boolean;
  // From this person's last visit on this browser; null on their first.
  lastCounts: LessonCounts | null;
  reload: () => Promise<void>;
  // Older lessons load a page at a time, as the sidebar scrolls near its end.
  hasMore: boolean;
  more: "idle" | "loading" | "failed";
  loadMore: () => void;
}

// The sidebar and the pages share one copy, so a new lesson shows everywhere at once.
export default function useAppData(): AppData {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [failed, setFailed] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [more, setMore] = useState<AppData["more"]>("idle");
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
          setLessons((loaded) => withOlder(next, loaded));
          if (next.length < PAGE_SIZE) setHasMore(false);
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

  const oldest = lessons?.at(-1)?.created_at;
  const loadMore = useCallback(() => {
    if (!oldest || !hasMore || more === "loading") return;
    setMore("loading");
    api<Lesson[]>(`/lessons?before=${encodeURIComponent(oldest)}`).then(
      (page) => {
        if (!alive.current) return;
        setLessons((loaded) => [...loaded!, ...page]);
        if (page.length < PAGE_SIZE) setHasMore(false);
        setMore("idle");
      },
      () => setMore("failed"),
    );
  }, [oldest, hasMore, more]);

  // While a lesson is being made, its spinner must turn into a result without a page refresh.
  const making = lessons?.some(isMaking) ?? false;
  useEffect(() => {
    if (!making) return;
    const timer = setInterval(reload, POLL_MS);
    return () => clearInterval(timer);
  }, [making, reload]);

  return { lessons, usage, failed, lastCounts, reload, hasMore, more, loadMore };
}

// A reload gets the newest page only, so the older pages already loaded stay below it.
function withOlder(newest: Lesson[], loaded: Lesson[] | null) {
  if (!loaded || newest.length < PAGE_SIZE) return newest;
  const end = Date.parse(newest.at(-1)!.created_at);
  return [...newest, ...loaded.filter((lesson) => Date.parse(lesson.created_at) < end)];
}
