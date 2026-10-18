import { useCallback, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router";

import Placeholder from "@/components/app/Placeholder";
import MakingScreen from "@/components/making/MakingScreen";
import LessonPage from "@/components/watch/LessonPage";
import LessonSkeleton from "@/components/watch/LessonSkeleton";
import type { AppData } from "@/hooks/useAppData";
import useLesson from "@/hooks/useLesson";
import { UNDERLINE } from "@/lib/styles";

export default function Lesson() {
  const { id } = useParams<{ id: string }>();
  // A new id is a new lesson: nothing carries over from the last one.
  return <LessonScreen key={id} id={id!} />;
}

function LessonScreen({ id }: { id: string }) {
  const { lesson, firstStatus, missing, offline, refresh } = useLesson(id);
  // A lesson that was made while the user watched opens after the loader's last slab lights.
  const [opened, setOpened] = useState(false);
  const open = useCallback(() => setOpened(true), []);
  const { lessons } = useOutletContext<AppData>();
  // A stored lesson opens at once, and one still being made opens on its loader; the rest get the placeholder.
  const [cold] = useState(
    () => lesson === null && (lessons === null || lessons.find((l) => l.id === id)?.status === "ready"),
  );

  let screen = null;
  if (missing)
    screen = (
      <section className="grid flex-1 place-items-center text-center">
        <div>
          <h1 className="text-xl font-semibold">We couldn't find this lesson.</h1>
          <Link to="/new" className={`text-accent-soft mt-3 inline-block text-sm ${UNDERLINE}`}>
            Make a new lesson
          </Link>
        </div>
      </section>
    );
  else if (lesson && (lesson.status !== "ready" || (firstStatus !== "ready" && !opened)))
    screen = <MakingScreen lesson={lesson} offline={offline} onReady={open} />;
  else if (lesson)
    screen = (
      <LessonPage lesson={lesson} refresh={refresh} className={cold ? "motion-safe:animate-fade-in" : undefined} />
    );

  return (
    <>
      {screen}
      {cold && (
        <Placeholder loading={!lesson && !missing} className="absolute inset-x-0 top-14 bottom-0 px-4 lg:top-0 lg:px-0">
          <LessonSkeleton />
        </Placeholder>
      )}
    </>
  );
}
