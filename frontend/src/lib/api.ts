import { supabase } from "@/lib/supabase";

export type Level = "school" | "high_school" | "college";
export type Status = "queued" | "generating" | "ready" | "failed";

export interface Lesson {
  id: string;
  topic: string;
  title: string | null;
  audience: Level;
  status: Status;
  step: number;
  error: string | null;
  created_at: string;
}

export type Language = "hi" | "ta" | "bn";

// The narration in another language: the same video with a new voice, made the first time someone picks it.
export interface SceneVoice {
  position: number;
  status: "making" | "ready" | "failed";
  narration: string | null;
  word_starts_ms: number[] | null;
  video_url: string | null;
}

export interface Scene {
  position: number;
  title: string;
  narration: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  // When each narration word is spoken, one per space-separated word; null for silent scenes.
  word_starts_ms: number[] | null;
  voices: Partial<Record<Language, SceneVoice>>;
  mcq_question: string;
  mcq_choices: string[];
  mcq_correct_index: number;
  fr_question: string;
  fr_answer: string;
}

export interface Usage {
  used: number;
  limit: number;
  tries: number;
  try_limit: number;
}

export const LEVELS: Record<Level, string> = { school: "School", high_school: "High school", college: "College" };
// Who each level is for, in the words students use. The backend's AUDIENCES in prompts.py gives the AI the same ranges.
export const LEVEL_CLASSES: Record<Level, string> = {
  school: "Class 6–8",
  high_school: "Class 9–12",
  college: "University",
};

export type LessonWithScenes = Lesson & { scenes: Scene[] };

export const isMaking = (lesson: Lesson) => lesson.status === "queued" || lesson.status === "generating";

// status is 0 when the server could not be reached at all.
export class ApiError extends Error {
  status: number;
  // A topic the server offers in place of one it turned away.
  suggestion?: string;
  constructor(message: string, status: number, suggestion?: string) {
    super(message);
    this.status = status;
    this.suggestion = suggestion;
  }
}

// Errors carry the server's own message, which is already written for people.
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  let response: Response;
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
    });
  } catch {
    throw new ApiError("Couldn't reach Lerno. Check your connection and try again.", 0);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, body?.suggestion);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
