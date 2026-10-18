import { api, type LessonWithScenes } from "@/lib/api";

// Video links last an hour, so a stored lesson is used only while its links still have time left.
const FRESH_MS = 50 * 60 * 1000;

const stored = new Map<string, { lesson: LessonWithScenes; at: number }>();
const asking = new Map<string, Promise<LessonWithScenes>>();

export function storedLesson(id: string) {
  const entry = stored.get(id);
  return entry && Date.now() - entry.at < FRESH_MS ? entry.lesson : null;
}

// One request per lesson at a time, so a hover, a card and the page never ask twice.
export function fetchLesson(id: string) {
  let request = asking.get(id);
  if (!request) {
    request = api<LessonWithScenes>(`/lessons/${id}`)
      .then((lesson) => {
        // Only ready lessons: one being made changes on every poll.
        if (lesson.status === "ready") stored.set(id, { lesson, at: Date.now() });
        return lesson;
      })
      .finally(() => asking.delete(id));
    asking.set(id, request);
  }
  return request;
}

export const forgetLessons = () => stored.clear();

// Starts loading before the click: a pointer or focus on a link comes a few hundred ms before it.
export const prefetchLesson = (id: string) => {
  if (!storedLesson(id)) fetchLesson(id).catch(() => {});
};
