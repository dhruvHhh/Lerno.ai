import type { ReactNode } from "react";
import { Link } from "react-router";

import Logo from "@/components/brand/Logo";
import Footer from "@/components/layout/Footer";

export const CONTACT = "suryanshsingh0987@gmail.com";
export const UPDATED = "3 November 2026";

// Long legal text, set for reading: one narrow column, sections a reader can jump to.
export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: { id: string; title: string; body: ReactNode }[];
}) {
  return (
    <>
      <main className="px-6 pt-6 pb-24 sm:px-12 sm:pt-8">
        <Link to="/" aria-label="Lerno home" className="inline-block">
          <Logo />
        </Link>

        <article className="mx-auto mt-14 max-w-[680px] sm:mt-20">
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.03em] sm:text-[40px]">{title}</h1>
          <p className="text-muted-foreground mt-3 text-sm">Last updated {UPDATED}</p>
          <div className="text-secondary-foreground mt-8 text-[15px] leading-7">{intro}</div>

          <nav aria-label="On this page" className="mt-10 border-y border-white/6 py-5">
            <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-muted-foreground hover:text-foreground transition">
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="mt-12 scroll-mt-24">
              <h2 className="text-foreground text-xl font-semibold tracking-[-0.01em]">
                {index + 1}. {section.title}
              </h2>
              <div className="text-secondary-foreground [&_a]:text-accent-soft [&_b]:text-foreground mt-4 grid gap-4 text-[15px] leading-7 [&_a]:underline [&_a]:underline-offset-2 [&_b]:font-medium [&_li]:pl-1 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}
        </article>
      </main>
      <Footer />
    </>
  );
}
