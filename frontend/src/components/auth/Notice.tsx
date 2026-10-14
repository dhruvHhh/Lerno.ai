import type { ReactNode } from "react";
import { Link } from "react-router";

import { UNDERLINE } from "@/lib/styles";
import { cn } from "@/lib/utils";

interface NoticeProps {
  title: string;
  link: { label: string; to: string };
  children: ReactNode;
}

// Shown in place of a form once it has done its job, or when a link no longer works.
export default function Notice({ title, link, children }: NoticeProps) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-secondary-foreground mt-3">{children}</p>
      <Link to={link.to} className={cn("text-foreground mt-8 inline-block text-sm font-medium", UNDERLINE)}>
        {link.label}
      </Link>
    </div>
  );
}
