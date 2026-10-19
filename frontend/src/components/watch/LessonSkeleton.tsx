import { savedScenesRail } from "@/lib/saved";
import { cn } from "@/lib/utils";

const BAR = "rounded-full bg-white/6 motion-safe:animate-pulse";
const TILE = "bg-white/4 motion-safe:animate-pulse";
// Lessons are made with 3 scenes.
const SCENES = [0, 1, 2];

// The lesson page's shape while it loads: the title, the film and the scenes, each where it will land.
export default function LessonSkeleton() {
  const rail = savedScenesRail();

  return (
    <div className="w-full lg:grid lg:h-full lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 pb-2 lg:px-8 lg:pt-[22px]">
        <div className="mx-auto max-w-[min(1040px,max(440px,calc((100vh-330px)*16/9)))]">
          <div className="flex h-[19.5px] items-center">
            <i className={cn(BAR, "h-2.5 w-20")} />
          </div>
          <div className="mt-0.5 flex h-7 items-center lg:h-8">
            <i className={cn(BAR, "h-4 w-64 max-w-full lg:h-5")} />
          </div>
          <div className="mt-2.5 aspect-video overflow-hidden rounded-xl bg-black shadow-[0_40px_120px_-40px_rgba(120,90,230,0.6),0_0_0_1px_rgba(255,255,255,0.07)] lg:mt-4 lg:rounded-2xl">
            <div className="size-full bg-white/3 motion-safe:animate-pulse" />
          </div>
          <div className="mx-auto mt-3.5 grid max-w-[720px] justify-items-center gap-3 sm:mt-5">
            <i className={cn(BAR, "h-3 w-4/5")} />
            <i className={cn(BAR, "h-3 w-3/5")} />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "bg-surface rounded-panel mt-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] lg:m-2.5 lg:ml-0",
          rail ? "lg:w-[60px]" : "lg:w-[300px]",
        )}
      >
        <div className="flex h-[60px] items-center px-4">
          <i className={cn(BAR, "h-3 w-24", rail && "lg:hidden")} />
        </div>
        <div className={cn("grid gap-1.5 px-2 pb-2", rail && "lg:hidden")}>
          {SCENES.map((scene) => (
            <div key={scene} className="grid grid-cols-[104px_1fr] items-center gap-3 p-2">
              <div className={cn(TILE, "rounded-tight aspect-video")} />
              <div className="grid gap-2">
                <i className={cn(BAR, "h-2.5 w-4/5")} />
                <i className={cn(BAR, "h-2 w-1/3")} />
              </div>
            </div>
          ))}
        </div>
        {rail && (
          <div className="hidden flex-col items-center gap-3.5 py-1.5 lg:flex">
            {SCENES.map((scene) => (
              <div key={scene} className={cn(TILE, "aspect-video w-10 rounded-md")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
