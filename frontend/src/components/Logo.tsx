import { useId } from "react";

import { cn } from "@/lib/utils";

export default function Logo({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <span className={cn("inline-flex items-center gap-2 text-lg font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F5F5F7" />
            <stop offset="1" stopColor="#9B7CFF" />
          </linearGradient>
        </defs>
        <path
          d="M12 1C12.9 7.6 16.4 11.1 23 12C16.4 12.9 12.9 16.4 12 23C11.1 16.4 7.6 12.9 1 12C7.6 11.1 11.1 7.6 12 1Z"
          fill={`url(#${gradientId})`}
        />
      </svg>
      Lerno.ai
    </span>
  );
}
