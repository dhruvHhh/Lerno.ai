import useAuth from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

// A stand-in until the New lesson page is built, so signing in and out can be tried end to end.
export default function NewLesson() {
  const { user } = useAuth();

  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New lesson</h1>
        <p className="text-secondary-foreground mt-3">
          Signed in as <span className="text-foreground">{user?.email}</span>.
        </p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="text-secondary-foreground hover:text-foreground mt-8 text-sm transition-colors"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
