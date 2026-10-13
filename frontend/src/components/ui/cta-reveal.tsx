// Needs a button with `cta relative isolate overflow-hidden` that calls trackPointer
// on pointer enter and leave, with this as its first child.
export function CtaReveal() {
  return (
    <span
      aria-hidden="true"
      className="bg-brand-gradient cta-hover:[--reveal-r:150%] absolute inset-0 -z-10 transition-[--reveal-r] duration-450 ease-in-out [clip-path:circle(var(--reveal-r)_at_var(--reveal-x,50%)_var(--reveal-y,50%))] motion-reduce:transition-none"
    />
  );
}
