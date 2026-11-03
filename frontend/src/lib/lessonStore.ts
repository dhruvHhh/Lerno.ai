import { api, type Lesson, type LessonWithScenes } from "@/lib/api";

// Video links last an hour, so a stored lesson is used only while its links still have time left.
const FRESH_MS = 50 * 60 * 1000;

const stored = new Map<string, { lesson: LessonWithScenes; at: number }>();
const asking = new Map<string, Promise<LessonWithScenes>>();
// A lesson just made, kept until its page opens, so the page shows the loader at once instead of asking first.
const made = new Map<string, Lesson>();

export const rememberMade = (lesson: Lesson) => made.set(lesson.id, lesson);
export function madeLesson(id: string): LessonWithScenes | null {
  const lesson = made.get(id);
  return lesson ? { ...lesson, scenes: [] } : null;
}
export const forgetMade = (id: string) => made.delete(id);

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

export const forgetLessons = () => {
  stored.clear();
  made.clear();
};
// After a change the stored copy doesn't have, such as a new voice, so the next visit asks again.
export const forgetLesson = (id: string) => stored.delete(id);

// Starts loading before the click: a pointer or focus on a link comes a few hundred ms before it.
export const prefetchLesson = (id: string) => {
  if (!storedLesson(id)) fetchLesson(id).catch(() => {});
};
