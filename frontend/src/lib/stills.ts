import { useEffect, useState } from "react";

// 60% in, where the drawing is mostly done; the server makes no thumbnails.
const STILL_AT = 0.6;
// Wide enough for the player's poster; the small thumbnails share the same image.
const WIDTH = 960;

interface Still {
  url: string;
  duration: number;
}

// Each scene video is decoded once per visit. A link gets a new token on every fetch, but its path stays the same.
const ready = new Map<string, Still>();
const loading = new Map<string, Promise<Still>>();
const keyOf = (src: string) => new URL(src).pathname;

// Captures run one by one, so a video that never answers gives up instead of holding up the rest.
const WAIT_MS = 15000;

const once = (video: HTMLVideoElement, event: string) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("The video took too long.")), WAIT_MS);
    video.addEventListener(event, () => (clearTimeout(timer), resolve()), { once: true });
    video.addEventListener("error", () => (clearTimeout(timer), reject(new Error("The video didn't load."))), {
      once: true,
    });
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
    // Some phones report the seek before the frame is decoded, and would draw a black still.
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) await once(video, "loadeddata");
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

// One video at a time: phones run only a few video decoders at once, so captures started together failed there.
let queue: Promise<unknown> = Promise.resolve();

function loadStill(src: string) {
  const key = keyOf(src);
  let request = loading.get(key);
  if (!request) {
    // One more try covers a dropped connection.
    request = queue.then(() => capture(src).catch(() => capture(src)));
    queue = request.catch(() => {});
    request = request.then(
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
