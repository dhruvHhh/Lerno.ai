import type { User } from "@supabase/supabase-js";
import { createContext } from "react";

// `loading` stays true until Supabase has said whether anyone is signed in.
export const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });
