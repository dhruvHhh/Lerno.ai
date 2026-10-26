import { useState } from "react";

import { cn } from "@/lib/utils";

// A failed image hides itself, so the dark tile behind it shows instead.
export default function Thumbnail({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("block size-full object-cover", className)}
    />
  );
}
