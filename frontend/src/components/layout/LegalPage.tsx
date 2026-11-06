import { ArrowLeft } from "@phosphor-icons/react";
import { type ReactNode, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import Logo from "@/components/brand/Logo";
import Footer from "@/components/layout/Footer";
import { PhoneIndex, RailIndex } from "@/components/layout/LegalIndex";
import useReading from "@/hooks/useReading";

export const CONTACT = "support@lerno.dev";
export const UPDATED = "6 November 2026";

// Long legal text, set for reading: one narrow column, with an index that follows the reader.
export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: { id: string; title: string; body: ReactNode }[];
}) {
  const ids = useMemo(() => sections.map((section) => section.id), [sections]);
  const { active, minutes, position, jump } = useReading(ids);
  const index = { sections, active, minutes, position, onJump: jump };
  const navigate = useNavigate();
  // The router's first page has this key: there is no earlier Lerno page to go back to, so Back goes home.
  const cameFromLerno = useLocation().key !== "default";

  return (
    <>
      <header className="bg-background sticky top-0 z-20 flex h-14 items-center justify-between px-6 sm:px-12">
        <Link to="/" aria-label="Lerno home" className="inline-block">
          <Logo />
        </Link>
        <Link
          to="/"
          onClick={(event) => {
            if (!cameFromLerno) return;
            event.preventDefault();
            void navigate(-1);
          }}
          className="text-secondary-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
      </header>

      <main className="mx-auto grid max-w-[1040px] gap-16 px-6 pt-10 pb-24 sm:px-12 sm:pt-14 lg:grid-cols-[minmax(0,680px)_minmax(0,240px)] lg:justify-between">
        <article className="min-w-0">
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.03em] sm:text-[40px]">{title}</h1>
          <p className="text-muted-foreground mt-3 text-sm">Last updated {UPDATED}</p>
          <div className="text-secondary-foreground mt-8 text-[15px] leading-7">{intro}</div>

          <PhoneIndex {...index} />

          {sections.map((section, number) => (
            <section key={section.id} id={section.id} className="mt-12 scroll-mt-[120px] lg:scroll-mt-20">
              <h2 tabIndex={-1} className="text-foreground text-xl font-semibold tracking-[-0.01em] outline-none">
                {number + 1}. {section.title}
              </h2>
              <div className="text-secondary-foreground [&_a]:text-accent-soft [&_b]:text-foreground mt-4 grid gap-4 text-[15px] leading-7 [&_a]:underline [&_a]:underline-offset-2 [&_b]:font-medium [&_li]:pl-1 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}
        </article>

        <RailIndex {...index} />
      </main>
      <Footer />
    </>
  );
}
