import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";

import MakingScreen from "@/components/making/MakingScreen";
import useLesson from "@/hooks/useLesson";
import { UNDERLINE } from "@/lib/styles";

export default function Lesson() {
  const { id } = useParams<{ id: string }>();
  // A new id is a new lesson: nothing carries over from the last one.
  return <LessonScreen key={id} id={id!} />;
}

function LessonScreen({ id }: { id: string }) {
  const { lesson, firstStatus, missing, offline } = useLesson(id);
  // A lesson that was made while the user watched opens after the loader's last slab lights.
  const [opened, setOpened] = useState(false);
  const open = useCallback(() => setOpened(true), []);

  if (missing)
    return (
      <section className="grid flex-1 place-items-center text-center">
        <div>
          <h1 className="text-xl font-semibold">We couldn't find this lesson.</h1>
          <Link to="/new" className={`text-accent-soft mt-3 inline-block text-sm ${UNDERLINE}`}>
            Make a new lesson
          </Link>
        </div>
      </section>
    );
  if (!lesson) return null;
  if (lesson.status !== "ready" || (firstStatus !== "ready" && !opened))
    return <MakingScreen lesson={lesson} offline={offline} onReady={open} />;

  // The lesson page is the next screen to build.
  return (
    <section className="grid flex-1 place-items-center text-center">
      <h1 className="text-xl font-semibold">{lesson.title ?? lesson.topic}</h1>
    </section>
  );
}
