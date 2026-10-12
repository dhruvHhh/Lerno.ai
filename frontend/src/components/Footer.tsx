import { useEffect, useId, useRef, type PointerEvent } from "react";
import { Link } from "react-router";

import { LOGO_FACES } from "@/content/logo-shape";
import { SECTION_LINKS } from "@/content/site-links";

const COLUMNS = [
  { title: "Product", links: SECTION_LINKS },
  {
    title: "Account",
    links: [
      { label: "Create account", href: "/signup" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const YEAR = new Date().getFullYear();

const LINK_CLASS = "text-muted-foreground hover:text-foreground inline-block py-1 text-sm transition";

function FooterLink({ label, href }: { label: string; href: string }) {
  return href.startsWith("#") ? (
    <a href={href} className={LINK_CLASS}>
      {label}
    </a>
  ) : (
    <Link to={href} className={LINK_CLASS}>
      {label}
    </Link>
  );
}

const WORDMARK = { x: 280, y: 246, fontSize: 330, fontWeight: 600, letterSpacing: -12, fontFamily: "Geist Variable" };

const VIEW_BOX = "20 5 1100 246";

function LogoOutline({ stroke, fill, weight }: { stroke: string; fill: string; weight: number }) {
  return (
    <g stroke={stroke} strokeLinejoin="round">
      {LOGO_FACES.map(({ points }) => (
        <polygon key={points} points={points} fill={fill} strokeWidth={weight} vectorEffect="non-scaling-stroke" />
      ))}
      <text
        {...WORDMARK}
        strokeWidth={weight * 2}
        paintOrder="stroke"
        vectorEffect="non-scaling-stroke"
        className="fill-background"
      >
        Lerno
      </text>
      <text {...WORDMARK} fill={fill} stroke="none">
        Lerno
      </text>
    </g>
  );
}

// Base layer: outline (its inside covered by a background fill so overlapping glyph parts don't show) plus a faint fill.
// Hover layer: the same outline in the brand gradient, revealed only in a soft circle around the pointer.
function GiantLogo() {
  const id = useId();

  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // At most one layout read and style write per animation frame, however fast the pointer moves.
  const moveSpotlight = (event: PointerEvent<HTMLDivElement>) => {
    const { currentTarget: spot, clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const { left, top } = spot.getBoundingClientRect();
      spot.style.setProperty("--spot-x", `${clientX - left}px`);
      spot.style.setProperty("--spot-y", `${clientY - top}px`);
    });
  };

  return (
    <div onPointerMove={moveSpotlight} className="group relative select-none">
      <svg viewBox={VIEW_BOX} className="block w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-stroke`} gradientUnits="userSpaceOnUse" x1="20" x2="1120">
            <stop offset="0" stopColor="#35394a" />
            <stop offset="0.6" stopColor="#4a3f80" />
            <stop offset="1" stopColor="#b7a4ff" />
          </linearGradient>
          <linearGradient id={`${id}-fill`} gradientUnits="userSpaceOnUse" y1="10" y2="246" x1="0" x2="0">
            <stop offset="0" stopColor="#9b7cff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#9b7cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <LogoOutline stroke={`url(#${id}-stroke)`} fill={`url(#${id}-fill)`} weight={1} />
      </svg>

      <svg
        viewBox={VIEW_BOX}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full [mask-image:radial-gradient(circle_16rem_at_var(--spot-x)_var(--spot-y),#000,transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        <defs>
          <linearGradient id={`${id}-brand`} gradientUnits="userSpaceOnUse" x1="20" x2="1120">
            <stop offset="0" stopColor="#a996ff" />
            <stop offset="0.4" stopColor="#efeaff" />
            <stop offset="1" stopColor="#e2b6ff" />
          </linearGradient>
        </defs>
        <LogoOutline stroke={`url(#${id}-brand)`} fill={`url(#${id}-fill)`} weight={2} />
      </svg>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/7">
      <div className="page-width pt-16 pb-8">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <p className="text-secondary-foreground max-w-xs text-lg leading-snug">
            Maths you can see. Short animated lessons on any topic, at your level.
          </p>
          <nav aria-label="Footer" className="grid grid-cols-3 gap-8 sm:gap-20">
            {COLUMNS.map(({ title, links }) => (
              <div key={title}>
                <h2 className="text-sm font-medium">{title}</h2>
                <ul className="mt-3 space-y-1">
                  {links.map((link) => (
                    <li key={link.href}>
                      <FooterLink {...link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-20">
          <GiantLogo />
        </div>

        <p className="text-muted-foreground mt-8 border-t border-white/7 pt-6 text-sm">
          © {YEAR} Lerno.ai. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
