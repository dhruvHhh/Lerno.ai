import { List } from "@phosphor-icons/react";
import { useState } from "react";
import { Outlet } from "react-router";

import Avatar from "@/components/app/Avatar";
import Sidebar, { ICON_BUTTON } from "@/components/app/Sidebar";
import { LogoIcon } from "@/components/brand/Logo";
import useAppData from "@/hooks/useAppData";
import useAuth from "@/hooks/useAuth";
import { userName } from "@/lib/auth";
import { saveRail, savedRail } from "@/lib/saved";
import { cn } from "@/lib/utils";

// The frame around every signed-in page: the lessons sidebar, and on phones a top bar that opens it as a drawer.
export default function AppShell() {
  const data = useAppData();
  const { user } = useAuth();
  const [rail, setRail] = useState(savedRail);
  const [drawer, setDrawer] = useState(false);

  const toggleRail = () => {
    saveRail(!rail);
    setRail(!rail);
  };

  return (
    <div className="h-svh overflow-hidden lg:grid lg:grid-cols-[auto_1fr]">
      <div
        onClick={() => setDrawer(false)}
        className={cn(
          "fixed inset-0 z-10 bg-black/55 transition-opacity duration-300 lg:hidden",
          drawer ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <Sidebar data={data} rail={rail} onToggleRail={toggleRail} open={drawer} onClose={() => setDrawer(false)} />

      <main
        data-lenis-prevent
        className="relative flex h-svh min-w-0 [scrollbar-width:thin] [scrollbar-color:#2a2b38_transparent] flex-col items-center overflow-x-clip overflow-y-auto px-4 pb-10 lg:px-6 lg:pb-12"
      >
        <div className="flex h-14 w-full flex-none items-center justify-between lg:hidden">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Open lessons" className={ICON_BUTTON}>
            <List size={18} />
          </button>
          <span className="flex items-center gap-2 font-semibold">
            <LogoIcon className="size-6" />
            Lerno
          </span>
          {user && <Avatar name={userName(user)} />}
        </div>
        <Outlet context={data} />
      </main>
    </div>
  );
}
