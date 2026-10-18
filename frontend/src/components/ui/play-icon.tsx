interface PlayIconProps {
  size: number;
  className?: string;
}

// A triangle looks centred when its centre of mass is, not its box: one third in from the flat side. The path puts
// that point at the middle of the 24-unit box (6.67 + 16 / 3 = 12), with rounded corners from the stroke.
export default function PlayIcon({ size, className }: PlayIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M6.67 3.5 22.67 12 6.67 20.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
