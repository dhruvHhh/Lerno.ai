import { useRef } from "react";

import useAutoPlay from "@/hooks/useAutoPlay";

export default function Demo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  useAutoPlay(videoRef);

  return (
    <section id="demo" className="relative mx-auto -mt-20 max-w-6xl px-4 md:-mt-28 2xl:max-w-7xl">
      <p className="text-center text-lg font-medium sm:text-xl">
        See a real lesson. <span className="text-muted-foreground">Made by Lerno in about a minute.</span>
      </p>

      <div className="relative isolate mt-8">
        <div
          aria-hidden="true"
          className="bg-accent/25 absolute inset-x-12 inset-y-8 -z-10 rounded-full blur-[100px]"
        />
        <div className="rounded-[28px] border border-white/10 bg-white/3 p-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-black">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-xs">
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden="true" className="flex shrink-0 gap-1.5">
                  <span className="size-2.5 rounded-full bg-white/15" />
                  <span className="size-2.5 rounded-full bg-white/15" />
                  <span className="size-2.5 rounded-full bg-white/15" />
                </span>
                <span className="text-muted-foreground truncate">
                  Lerno · <span className="text-foreground">Adding vectors tip to tail</span>
                </span>
              </div>
              <span className="text-muted-foreground shrink-0">3 scenes</span>
            </div>
            <video
              ref={videoRef}
              src="/videos/vectors-demo.mp4"
              poster="/videos/vectors-demo.webp"
              aria-label="An AI-generated Lerno lesson on adding vectors tip to tail"
              width={1280}
              height={720}
              preload="none"
              muted
              loop
              playsInline
              className="aspect-video w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
