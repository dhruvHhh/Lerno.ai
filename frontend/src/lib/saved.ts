import type { Language, Level } from "@/lib/api";

// Browser storage can be blocked (private windows, strict settings), so every read and write may fail quietly.
function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The app still works; it just forgets this choice.
  }
}

export const savedLevel = () => read<Level>("lerno:level", "high_school");
export const saveLevel = (level: Level) => write("lerno:level", level);

// Known before the lesson list loads: the example chips never pop in late, and placeholders match what will come.
// Kept for each person, also after sign-out, so signing back in shows them too; only the numbers, never the lessons.
export interface LessonCounts {
  lessons: number;
  ready: number;
}

export const savedCounts = (userId: string) => read<LessonCounts | null>(`lerno:lesson-counts:${userId}`, null);
export const saveCounts = (userId: string, counts: LessonCounts) => write(`lerno:lesson-counts:${userId}`, counts);

export const savedRail = () => read("lerno:sidebar-rail", false);
export const saveRail = (rail: boolean) => write("lerno:sidebar-rail", rail);

// Watch progress stays in this browser for v1: where the user stopped, which scenes they finished, and their quiz answers.
export interface Progress {
  scene: number;
  time: number;
  watched: number[];
  answers: Record<number, number>;
}

export const savedProgress = (lessonId: string) => read<Progress | null>(`lerno:progress:${lessonId}`, null);
export const saveProgress = (lessonId: string, progress: Progress) => write(`lerno:progress:${lessonId}`, progress);

export const savedScenesRail = () => read("lerno:scenes-rail", false);
export const saveScenesRail = (rail: boolean) => write("lerno:scenes-rail", rail);

// The narration language picked for each lesson. A lesson with no pick uses the last one, which new lessons are
// also voiced in.
export const lastLanguage = () => read<Language | "en">("lerno:language", "en");
export const saveLastLanguage = (language: Language | "en") => write("lerno:language", language);
export const savedLanguage = (lessonId: string) => read(`lerno:language:${lessonId}`, lastLanguage());
export const saveLanguage = (lessonId: string, language: Language | "en") =>
  write(`lerno:language:${lessonId}`, language);
