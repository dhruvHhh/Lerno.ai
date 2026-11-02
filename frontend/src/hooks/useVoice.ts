import { useCallback, useEffect, useState } from "react";

import { api, ApiError, type Language, type LessonWithScenes, type Scene, type SceneVoice } from "@/lib/api";
import { forgetLesson } from "@/lib/lessonStore";
import { saveLanguage, saveLastLanguage, savedLanguage } from "@/lib/saved";

const POLL_MS = 4000;

type Voices = Partial<Record<Language, SceneVoice[]>>;

// The narration language of one lesson. Picking one that is not made yet asks the server to make it, then asks about
// it every 4 seconds. Only that language is fetched, so the lesson's own video links, and so the playing video, stay.
export default function useVoice(lesson: LessonWithScenes) {
  const [language, setLanguage] = useState<Language | "en">(() => {
    const saved = savedLanguage(lesson.id);
    // A saved language whose voice was never made (the limit was reached) falls back to English.
    return saved !== "en" && lesson.scenes.some((scene) => scene.voices[saved]) ? saved : "en";
  });
  const [fetched, setFetched] = useState<Voices>({});
  const [error, setError] = useState<string | null>(null);

  // The lesson's own copy is the freshest once it is ready (its links are new after a reload); before that, the
  // copy fetched while waiting is newer.
  const voiceOf = useCallback(
    (scene: Scene, lang: Language) => {
      const own = scene.voices[lang];
      if (own?.status === "ready") return own;
      return fetched[lang]?.find((voice) => voice.position === scene.position) ?? own;
    },
    [fetched],
  );

  const voiced = lesson.scenes.filter((scene) => scene.word_starts_ms);
  const statuses = language === "en" ? [] : voiced.map((scene) => voiceOf(scene, language)?.status);
  const making = statuses.some((status) => status === "making");
  const failed = statuses.length > 0 && statuses.every((status) => status === "failed");

  const isReady = (lang: Language | "en") =>
    lang === "en" || voiced.every((scene) => voiceOf(scene, lang)?.status === "ready");

  const choose = useCallback(
    (next: Language | "en") => {
      setLanguage(next);
      saveLanguage(lesson.id, next);
    },
    [lesson.id],
  );

  const load = useCallback(
    async (lang: Language) => {
      const voices = await api<SceneVoice[]>(`/lessons/${lesson.id}/voices/${lang}`);
      setFetched((all) => ({ ...all, [lang]: voices }));
      return voices;
    },
    [lesson.id],
  );

  const pick = async (next: Language | "en") => {
    setError(null);
    choose(next);
    // Only the user's own pick: falling back to English after an error must not stop new lessons being voiced.
    saveLastLanguage(next);
    if (next === "en" || isReady(next)) return;
    try {
      await api(`/lessons/${lesson.id}/voices`, { method: "POST", body: JSON.stringify({ language: next }) });
      forgetLesson(lesson.id);
      await load(next);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
      choose("en");
    }
  };

  useEffect(() => {
    if (language === "en" || !making) return;
    const timer = setInterval(() => {
      if (!document.hidden) load(language).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [language, making, load]);

  // The voice to play for a scene: null means the English one, for English or while its own voice is not ready.
  const ready = (scene: Scene) => {
    if (language === "en") return null;
    const voice = voiceOf(scene, language);
    return voice?.status === "ready" ? voice : null;
  };

  // This scene's voice in the picked language: making, ready or failed; undefined for English or before it is asked for.
  const statusOf = (scene: Scene) => (language === "en" ? undefined : voiceOf(scene, language)?.status);

  return { language, pick, ready, isReady, statusOf, failed, error, voiced: voiced.length > 0 };
}
