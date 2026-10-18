import { useEffect, useState } from "react";

// 60% in, where the drawing is mostly done; the server makes no thumbnails.
const STILL_AT = 0.6;
// Wide enough for the player's poster; the small thumbnails share the same image.
const WIDTH = 960;

export interface Still {
  url: string;
  duration: number;
}

// Each scene video is decoded once per visit. A link gets a new token on every fetch, but its path stays the same.
const ready = new Map<string, Still>();
const loading = new Map<string, Promise<Still>>();
const keyOf = (src: string) => new URL(src).pathname;

const once = (video: HTMLVideoElement, event: string) =>
  new Promise<void>((resolve, reject) => {
    video.addEventListener(event, () => resolve(), { once: true });
    video.addEventListener("error", () => reject(new Error("The video didn't load.")), { once: true });
  });

async function capture(src: string): Promise<Still> {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.preload = "auto";
  video.src = src;
  try {
    await once(video, "loadedmetadata");
    video.currentTime = video.duration * STILL_AT;
    await once(video, "seeked");
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = Math.round((WIDTH * video.videoHeight) / video.videoWidth);
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob) throw new Error("The still couldn't be made.");
    return { url: URL.createObjectURL(blob), duration: video.duration };
  } finally {
    // Frees the decoder at once instead of when the element is collected.
    video.removeAttribute("src");
    video.load();
  }
}

function loadStill(src: string) {
  const key = keyOf(src);
  let request = loading.get(key);
  if (!request) {
    request = capture(src).then(
      (still) => {
        ready.set(key, still);
        return still;
      },
      (error) => {
        loading.delete(key);
        throw error;
      },
    );
    loading.set(key, request);
  }
  return request;
}

export function forgetStills() {
  ready.forEach((still) => URL.revokeObjectURL(still.url));
  ready.clear();
  loading.clear();
}

export function useStill(src: string) {
  const key = keyOf(src);
  const [loaded, setLoaded] = useState<{ key: string; still: Still } | null>(null);

  useEffect(() => {
    if (ready.has(key)) return;
    let live = true;
    loadStill(src).then(
      (still) => live && setLoaded({ key, still }),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [key, src]);

  return ready.get(key) ?? (loaded?.key === key ? loaded.still : null);
}
