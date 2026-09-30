import { useId } from "react";

const TONES = {
  front: ["#a996ff", "#e2b6ff"],
  top: ["#c3b6ff", "#ebccff"],
  side: ["#7056da", "#8763da"],
};

const FACES = [
  { tone: "side", points: "230.5,166.0 184.4,192.7 184.4,246.0 230.5,219.3" },
  { tone: "top", points: "230.5,166.0 117.8,101.0 117.8,154.3 184.4,192.7" },
  { tone: "front", points: "184.4,246.0 184.4,192.7 117.8,154.3 117.8,193.5 105.6,200.5" },
  { tone: "side", points: "117.8,36.7 71.6,63.3 71.6,220.1 117.8,193.5" },
  { tone: "top", points: "117.8,36.7 71.6,10.0 25.5,36.7 71.6,63.3" },
  { tone: "front", points: "25.5,193.5 71.6,220.1 71.6,63.3 25.5,36.7" },
] as const;

export default function Logo() {
  const id = useId();

  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 256 256" className="block size-10" aria-hidden="true">
        <defs>
          {Object.entries(TONES).map(([tone, [from, to]]) => (
            <linearGradient key={tone} id={`${id}-${tone}`} gradientUnits="userSpaceOnUse" x1="25.5" x2="230.5">
              <stop offset="0" stopColor={from} />
              <stop offset="1" stopColor={to} />
            </linearGradient>
          ))}
        </defs>
        {FACES.map(({ tone, points }) => (
          <polygon key={points} points={points} fill={`url(#${id}-${tone})`} />
        ))}
      </svg>
      <span className="text-xl font-semibold tracking-tight">Lerno</span>
    </span>
  );
}
