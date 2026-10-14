import type { User } from "@supabase/supabase-js";
import { useEffect, useState, type ReactNode } from "react";

import { AuthContext } from "@/lib/auth-context";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; loading: boolean }>({ user: null, loading: true });

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    // Supabase loads after the first paint, so the home page never waits for it.
    import("@/lib/supabase").then(({ supabase }) => {
      if (cancelled) return;
      // Fires once at start with the saved session, then on every sign-in and sign-out.
      const { data } = supabase.auth.onAuthStateChange((_event, session) =>
        setState({ user: session?.user ?? null, loading: false }),
      );
      stop = () => data.subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}
