import { Link } from "react-router";

import { UNDERLINE } from "@/lib/styles";
import { cn } from "@/lib/utils";

// The line under a form that points to the other way in, like "Don't have an account? Sign up".
export default function AuthSwitch({ prompt, label, to }: { prompt: string; label: string; to: string }) {
  return (
    <p className="text-secondary-foreground mt-6 text-center text-sm">
      {prompt}{" "}
      <Link to={to} className={cn("text-foreground font-medium", UNDERLINE)}>
        {label}
      </Link>
    </p>
  );
}
