import type { Level } from "@/lib/api";

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

// Known before the lesson list loads, so the example chips never pop in late.
export const savedHasLessons = () => read("lerno:has-lessons", false);
export const saveHasLessons = (hasLessons: boolean) => write("lerno:has-lessons", hasLessons);

export const savedRail = () => read("lerno:sidebar-rail", false);
export const saveRail = (rail: boolean) => write("lerno:sidebar-rail", rail);

export interface Progress {
  scene: number;
  time: number;
}

export const savedProgress = (lessonId: string) => read<Progress | null>(`lerno:progress:${lessonId}`, null);
