import { forgetLessons } from "@/lib/lessonStore";
import { forgetUser } from "@/lib/saved";
import { supabase } from "@/lib/supabase";
import { prefersReducedMotion } from "@/lib/utils";

// The same 250ms as the #root opacity transition in index.css.
const FADE_MS = 250;

// The app fades out, this person's lessons and counts leave the browser, and the sign-in page fades in.
export default async function signOut() {
  const root = document.documentElement;
  root.classList.add("leaving");
  await new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 0 : FADE_MS));
  await supabase.auth.signOut();
  // After sign-out, so nothing fetched with the old session lands after the clean-up.
  forgetLessons();
  forgetUser();
  requestAnimationFrame(() => root.classList.remove("leaving"));
}
