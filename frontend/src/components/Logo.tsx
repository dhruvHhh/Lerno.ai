import { useId } from "react";

import { LOGO_FACES } from "@/content/logo-shape";

const TONES = {
  front: ["#a996ff", "#e2b6ff"],
  top: ["#c3b6ff", "#ebccff"],
  side: ["#7056da", "#8763da"],
};

function LogoMark() {
  const id = useId();

  return (
    <>
      <defs>
        {Object.entries(TONES).map(([tone, [from, to]]) => (
          <linearGradient key={tone} id={`${id}-${tone}`} gradientUnits="userSpaceOnUse" x1="25.5" x2="230.5">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        ))}
      </defs>
      {LOGO_FACES.map(({ tone, points }) => (
        <polygon key={points} points={points} fill={`url(#${id}-${tone})`} />
      ))}
    </>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
      <LogoMark />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoIcon className="block size-10" />
      <span className="text-xl font-semibold tracking-tight">Lerno</span>
    </span>
  );
}
