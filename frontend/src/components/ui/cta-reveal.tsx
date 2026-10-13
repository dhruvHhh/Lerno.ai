// The site's main-button hover: the brand gradient grows out of the point where the cursor enters, then shrinks back
// toward where it leaves. The button needs the `cta` class plus `relative isolate overflow-hidden`, calls
// `trackPointer` (from @/lib/cta) on pointer enter and leave, and renders `CtaReveal` as its first child.
export function CtaReveal() {
  return (
    <span
      aria-hidden="true"
      className="bg-brand-gradient cta-hover:[--reveal-r:150%] absolute inset-0 -z-10 transition-[--reveal-r] duration-450 ease-in-out [clip-path:circle(var(--reveal-r)_at_var(--reveal-x,50%)_var(--reveal-y,50%))] motion-reduce:transition-none"
    />
  );
}
