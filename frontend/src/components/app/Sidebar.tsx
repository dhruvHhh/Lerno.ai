import { Plus, SidebarSimple, SignOut, WarningCircle } from "@phosphor-icons/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import Avatar from "@/components/app/Avatar";
import Placeholder from "@/components/app/Placeholder";
import { LogoIcon } from "@/components/brand/Logo";
import useAuth from "@/hooks/useAuth";
import type { AppData } from "@/hooks/useAppData";
import { isMaking, type Lesson } from "@/lib/api";
import { userName } from "@/lib/auth";
import { prefetchLesson } from "@/lib/lessonStore";
import { savedCounts } from "@/lib/saved";
import { PRESS, RAISED_KEY, SETTLE_MS } from "@/lib/styles";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const EmptyLessons = lazy(() => import("@/components/app/EmptyLessons"));

const SKELETON_ROWS = 8;
// Uneven bars read as titles; equal ones read as a loading bar.
const ROW_WIDTHS = [72, 54, 64, 46, 68, 58, 50, 62];

export const ICON_BUTTON =
  "grid size-8 flex-none place-items-center rounded-[9px] text-muted-foreground transition-colors duration-300 hover:bg-white/5 hover:text-foreground";

// In the rail, words fade out while the sidebar narrows, so nothing wraps mid-animation.
const fades = (rail: boolean) => cn("transition-opacity duration-200", rail && "lg:pointer-events-none lg:opacity-0");

interface SidebarProps {
  data: AppData;
  rail: boolean;
  onToggleRail: () => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ data, rail, onToggleRail, open, onClose }: SidebarProps) {
  return (
    <aside
      aria-label="Lessons"
      className={cn(
        "bg-surface fixed inset-y-2 left-2 z-20 flex w-[min(300px,calc(100vw-48px))] flex-col overflow-hidden rounded-[18px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_30px_80px_rgba(0,0,0,0.7)]",
        "ease-snappy transition-[translate,width] duration-[450ms]",
        open ? "translate-x-0" : "-translate-x-[calc(100%+16px)]",
        "lg:relative lg:inset-auto lg:my-2.5 lg:ml-2.5 lg:translate-x-0 lg:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
        rail ? "lg:w-[60px]" : "lg:w-[272px]",
      )}
    >
      <div
        className={cn(
          "group/head relative flex h-[60px] flex-none items-center gap-2.5 pr-3 pl-4",
          rail && "lg:pl-[17px]",
        )}
      >
        <button
          type="button"
          onClick={rail ? onToggleRail : undefined}
          tabIndex={rail ? 0 : -1}
          className={cn(
            "flex items-center gap-[9px] text-base font-semibold tracking-tight whitespace-nowrap",
            !rail && "cursor-default",
          )}
        >
          <LogoIcon className="size-[26px] flex-none" />
          <span className={fades(rail)}>Lerno</span>
        </button>
        <button
          type="button"
          onClick={onToggleRail}
          aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            ICON_BUTTON,
            "ml-auto hidden lg:grid",
            // In the rail the button sits on the logo and shows on hover.
            rail &&
              "bg-surface absolute top-[14px] left-[14px] m-0 opacity-0 group-hover/head:opacity-100 focus-visible:opacity-100",
          )}
        >
          <SidebarSimple size={18} />
        </button>
      </div>

      <Link
        to="/new"
        onClick={onClose}
        className={cn(
          "mx-3 mt-1 flex h-10 flex-none items-center gap-2.5 rounded-[10px] px-3 font-medium whitespace-nowrap",
          RAISED_KEY,
          PRESS,
          rail && "lg:mx-2.5 lg:w-10",
        )}
      >
        <Plus size={16} weight="bold" className="text-accent-soft flex-none" />
        <span className={fades(rail)}>New lesson</span>
      </Link>

      <p className={cn("text-muted-foreground mx-4 mt-[22px] mb-1.5 text-xs whitespace-nowrap", fades(rail))}>
        Your lessons
      </p>
      <LessonList data={data} onClose={onClose} className={fades(rail)} />

      <div className="grid flex-none gap-2.5 border-t border-white/5 p-3">
        {data.usage && <UsageMeter {...data.usage} className={fades(rail)} />}
        <Account rail={rail} />
      </div>
    </aside>
  );
}

function LessonList({ data, onClose, className }: { data: AppData; onClose: () => void; className: string }) {
  const { pathname } = useLocation();
  // Placeholders only on a cold load, for as many rows as the last visit had.
  const [expected] = useState(() => (data.lessons ? 0 : Math.min(savedCounts().lessons, SKELETON_ROWS)));
  const failed = data.failed && !data.lessons;

  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <ul data-lenis-prevent className="h-full [scrollbar-width:none] overflow-y-auto px-2">
        {failed && (
          <li className="text-muted-foreground px-2 py-1 text-xs whitespace-nowrap">Couldn't load your lessons.</li>
        )}
        {data.lessons?.length === 0 && (
          <li>
            <Suspense>
              <EmptyLessons />
            </Suspense>
          </li>
        )}
        {data.lessons?.map((lesson, index) => {
          const prefetch = lesson.status === "ready" ? () => prefetchLesson(lesson.id) : undefined;
          return (
            <li
              key={lesson.id}
              className={cn(expected > 0 && "motion-safe:animate-enter")}
              style={{ animationDelay: `${SETTLE_MS + Math.min(index, SKELETON_ROWS) * 35}ms` }}
            >
              <Link
                to={`/lesson/${lesson.id}`}
                onClick={onClose}
                onPointerEnter={prefetch}
                onFocus={prefetch}
                title={lesson.status === "failed" ? "Couldn't make this lesson" : lesson.topic}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-[9px] px-2 whitespace-nowrap transition-colors duration-200",
                  pathname === `/lesson/${lesson.id}`
                    ? "text-foreground bg-accent/8 shadow-[inset_0_0_0_1px_rgba(155,124,255,0.18)]"
                    : "text-secondary-foreground hover:text-foreground hover:bg-white/4",
                )}
              >
                <StatusMark lesson={lesson} />
                <span className="flex-1 truncate">{lesson.title ?? lesson.topic}</span>
                {isMaking(lesson) && <span className="text-muted-foreground text-[11px]">Making</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      {expected > 0 && (
        <Placeholder loading={!data.lessons && !data.failed} className="absolute inset-x-2 top-0">
          {Array.from({ length: expected }, (_, index) => (
            <span key={index} className="flex h-9 items-center gap-2.5 px-2">
              <span className="grid size-4 flex-none place-items-center">
                <i className="size-1.5 rotate-45 rounded-[2px] bg-white/8" />
              </span>
              <i
                className="h-2.5 rounded-full bg-white/6 motion-safe:animate-pulse"
                style={{ width: `${ROW_WIDTHS[index % ROW_WIDTHS.length]}%`, animationDelay: `${index * 120}ms` }}
              />
            </span>
          ))}
        </Placeholder>
      )}
    </div>
  );
}

function StatusMark({ lesson }: { lesson: Lesson }) {
  return (
    <span className="grid size-4 flex-none place-items-center">
      {isMaking(lesson) ? (
        <span className="border-accent-soft/25 border-t-accent-soft size-3 animate-spin rounded-full border-[1.5px]" />
      ) : lesson.status === "failed" ? (
        <WarningCircle size={14} className="text-danger" />
      ) : (
        <i className="size-1.5 rotate-45 rounded-[2px] bg-[#2d3040]" />
      )}
    </span>
  );
}

function UsageMeter({ used, limit, className }: { used: number; limit: number; className: string }) {
  const left = Math.max(limit - used, 0);
  return (
    <div className={cn("motion-safe:animate-enter grid gap-[7px] px-1 pt-1 pb-0.5 whitespace-nowrap", className)}>
      <p className="text-secondary-foreground text-xs">
        {left} of {limit} lessons left today
      </p>
      <div className="grid grid-flow-col gap-1">
        {Array.from({ length: limit }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 rounded-[2px]",
              index < left ? "bg-linear-to-r from-[#a996ff] to-[#e2b6ff]" : "bg-white/10",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function Account({ rail }: { rail: boolean }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => !menu.current?.contains(event.target as Node) && setOpen(false);
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!user) return null;
  const name = userName(user);

  return (
    <div ref={menu} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-full min-w-44 rounded-xl bg-[#11131c] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="text-secondary-foreground hover:text-foreground flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/5"
          >
            <SignOut size={16} />
            Sign out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Account"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[10px] px-1 py-1.5 text-left whitespace-nowrap hover:bg-white/4",
          rail && "lg:px-[5px]",
        )}
      >
        <Avatar name={name} />
        <span className={cn("min-w-0", fades(rail))}>
          <b className="block text-[13px] font-medium">{name}</b>
          <small className="text-muted-foreground block truncate text-[11px]">{user.email}</small>
        </span>
      </button>
    </div>
  );
}
