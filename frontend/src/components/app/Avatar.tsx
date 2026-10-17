import { Avatar as Face, Style } from "@dicebear/core";
import initialFace from "@dicebear/styles/initial-face.json";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

const FACE = new Style(initialFace);

// Everyone gets the same drawn face, Google users too, so the app never shows a photo it didn't ask for.
export default function Avatar({ name, className }: { name: string; className?: string }) {
  const src = useMemo(() => new Face(FACE, { seed: name, backgroundColor: "#c3b6ff" }).toDataUri(), [name]);
  return (
    <img src={src} alt="" className={cn("block size-[30px] flex-none rounded-lg ring-1 ring-white/14", className)} />
  );
}
