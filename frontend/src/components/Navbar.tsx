import { ListIcon, XIcon } from "@phosphor-icons/react";
import { m, MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CtaLink from "@/components/CtaLink";
import Logo from "@/components/Logo";
import { SECTION_LINKS } from "@/content/site-links";
import { cn } from "@/lib/utils";

const SHRINK = { type: "spring", stiffness: 260, damping: 34 } as const;

const LINK_CLASS = "text-secondary-foreground hover:text-foreground py-2 text-sm transition";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return SECTION_LINKS.map((link) => (
    <a key={link.href} href={link.href} onClick={onNavigate} className={LINK_CLASS}>
      {link.label}
    </a>
  ));
}

function NavActions() {
  return (
    <>
      <Link to="/login" className={LINK_CLASS}>
        Sign in
      </Link>
      <CtaLink to="/signup">Get started</CtaLink>
    </>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <MotionConfig transition={SHRINK}>
      <header className="fixed inset-x-0 top-0 z-50 px-4">
        <m.nav
          layout
          style={{ borderRadius: 9999 }}
          className={cn(
            "border-foreground/10 bg-foreground/5 mx-auto mt-6 flex max-w-6xl items-center justify-between border px-5 py-3 2xl:max-w-7xl",
            scrolled && "mt-3 max-w-4xl py-2 backdrop-blur-lg 2xl:max-w-4xl",
          )}
        >
          <m.div layout="position">
            <Link to="/" aria-label="Lerno.ai home">
              <Logo />
            </Link>
          </m.div>

          <m.div layout="position" className="hidden items-center gap-10 md:flex">
            <NavLinks />
          </m.div>

          <m.div layout="position" className="hidden items-center gap-6 md:flex">
            <NavActions />
          </m.div>

          <m.button
            layout="position"
            type="button"
            onClick={() => setOpen((isOpen) => !isOpen)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="text-foreground rounded-lg p-2 md:hidden"
          >
            {open ? <XIcon className="size-5" /> : <ListIcon className="size-5" />}
          </m.button>
        </m.nav>

        {open && (
          <m.div
            layout="position"
            className="border-border bg-surface mt-2 flex flex-col gap-4 rounded-2xl border p-5 md:hidden"
          >
            <NavLinks onNavigate={() => setOpen(false)} />
            <NavActions />
          </m.div>
        )}
      </header>
    </MotionConfig>
  );
}
