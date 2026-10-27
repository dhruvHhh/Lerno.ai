// Goes first inside an element styled with CTA and CTA_POINTER (lib/cta). Touch screens get a quick fade while pressed
// instead of the sweep.
export function CtaReveal() {
  return (
    <span
      aria-hidden="true"
      className="bg-brand-gradient cta-hover:[--reveal-r:150%] touch:opacity-0 touch:transition-opacity touch:duration-120 touch:ease-out touch:[--reveal-r:150%] touch:cta-press:opacity-100 absolute inset-0 -z-10 transition-[--reveal-r] duration-450 ease-in-out [clip-path:circle(var(--reveal-r)_at_var(--reveal-x,50%)_var(--reveal-y,50%))] motion-reduce:transition-none"
    />
  );
}
