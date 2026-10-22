import { CornersInIcon } from "@phosphor-icons/react";
import { useLenis } from "lenis/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useRef } from "react";
import { createPortal } from "react-dom";

import VideoControls, { BarButton, CloseButton, POPUP_WIDTH } from "@/components/lesson/VideoControls";
import useVideoControls from "@/hooks/useVideoControls";
import { EASE_EXPO } from "@/lib/variants";

const OPEN = { duration: 0.5, ease: EASE_EXPO };
const CLOSE = { duration: 0.25, ease: "easeIn" } as const;
const STILL = { duration: 0 };

interface DemoDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function DemoDialog({ open, onClose }: DemoDialogProps) {
  return createPortal(<AnimatePresence>{open && <DemoPlayer onClose={onClose} />}</AnimatePresence>, document.body);
}

// The demo film in the same popup player as the lessons. It plays with sound because the visitor's click opened it.
// Mounted only while open, so every opening starts the film and its controls fresh.
function DemoPlayer({ onClose }: { onClose: () => void }) {
  const { videoRef, videoProps, controls } = useVideoControls();
  const closeButton = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();
  const still = useReducedMotion();

  // The film stops at once; the popup fades out after it.
  const close = () => {
    videoRef.current?.pause();
    onClose();
  };

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    lenis?.stop();
    closeButton.current?.focus();
    return () => {
      lenis?.start();
      opener?.focus({ preventScroll: true });
    };
  }, [lenis]);

  // An effect event always calls the latest `close`, so the listener is added once, not on every render.
  const onKey = useEffectEvent((event: KeyboardEvent) => event.key === "Escape" && close());
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: still ? STILL : OPEN }}
      exit={{ opacity: 0, transition: still ? STILL : CLOSE }}
      onPointerDown={(event) => event.target === event.currentTarget && close()}
      className="fixed inset-0 z-70 grid place-items-center bg-black/70 backdrop-blur-sm"
    >
      <m.section
        role="dialog"
        aria-modal="true"
        aria-label="Lerno demo"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: still ? STILL : OPEN }}
        exit={{ opacity: 0, scale: 0.97, y: 8, transition: still ? STILL : CLOSE }}
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black ${POPUP_WIDTH}`}
      >
        <video
          ref={videoRef}
          src="/videos/lerno-film.mp4"
          poster="/videos/lerno-film.webp"
          width={1920}
          height={1080}
          autoPlay
          playsInline
          onClick={controls.toggle}
          {...videoProps}
          className="aspect-video w-full cursor-pointer"
        />
        <CloseButton ref={closeButton} onClick={close} />
        <VideoControls controls={controls}>
          <BarButton label="Shrink" onClick={close}>
            <CornersInIcon className="size-4" />
          </BarButton>
        </VideoControls>
      </m.section>
    </m.div>
  );
}
