import { useCallback, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router";

import AskBox, { MAX_QUESTION } from "@/components/app/AskBox";
import ContinueWatching from "@/components/app/ContinueWatching";
import GradientText from "@/components/brand/GradientText";
import { SegmentedControl } from "@/components/ui/segmented-display";
import type { AppData } from "@/hooks/useAppData";
import { api, LEVELS, type Lesson, type Level, type Usage } from "@/lib/api";
import { saveLevel, savedCounts, savedLevel } from "@/lib/saved";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Why is the area under y = x² from 0 to 2 equal to 8/3?",
  "What does a derivative actually measure?",
  "How do eigenvectors stay on their own line?",
  "Why does the harmonic series never stop growing?",
  "What is a Fourier series doing to a square wave?",
];

const CHIPS = ["Area under x² from 0 to 2", "What does a derivative measure?", "Why does e^(iπ) = −1?"];

const DAY_MS = 24 * 60 * 60 * 1000;
const COUNTER_FROM = 180;

export default function NewLesson() {
  const { lessons, usage, failed, reload } = useOutletContext<AppData>();
  const navigate = useNavigate();
  // "Try again" on a failed lesson brings its topic and level here, in the box but not sent.
  const retry = useLocation().state as { topic: string; level: Level } | null;
  const [question, setQuestion] = useState(retry?.topic ?? "");
  const [level, setLevel] = useState(retry?.level ?? savedLevel());
  const [sending, setSending] = useState(false);
  const [madeId, setMadeId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tooShort, setTooShort] = useState(false);

  const limit = limitNotice(lessons, usage);
  const newUser = lessons ? lessons.length === 0 : savedCounts().lessons === 0;

  const submit = async () => {
    const topic = question.trim();
    if (!topic || sending || limit) return;
    if (topic.length < 3) return setTooShort(true);
    setSending(true);
    setError("");
    try {
      const { id } = await api<{ id: string }>("/lessons", {
        method: "POST",
        body: JSON.stringify({ topic, audience: level }),
      });
      saveLevel(level);
      void reload();
      setMadeId(id);
    } catch (failure) {
      // The question stays in the box, so the user can try again without typing it twice.
      setError((failure as Error).message);
      setSending(false);
      void reload();
    }
  };

  const openLesson = useCallback(() => navigate(`/lesson/${madeId}`), [madeId, navigate]);

  const type = (value: string) => {
    setQuestion(value);
    setTooShort(false);
  };

  const full = question.length >= MAX_QUESTION;
  const hint = tooShort
    ? "Ask a little more."
    : question.length >= COUNTER_FROM
      ? `${question.length} / ${MAX_QUESTION}`
      : "";

  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(450px_260px_at_50%_26%,rgba(122,96,230,0.16),transparent)]" />
      <GraphPaper />

      <section className="relative z-[1] mt-[12vh] w-full max-w-[640px] text-center lg:mt-[19vh]">
        <h1 className="text-[30px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance lg:text-[40px]">
          What do you want to <GradientText>understand?</GradientText>
        </h1>
        <p className="text-secondary-foreground mt-2.5 text-sm lg:text-[15px]">
          Ask about any maths idea. We'll animate it into a short lesson.
        </p>

        {newUser && (
          <div
            aria-label="Example questions"
            className="-mx-4 mt-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-[26px] sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
          >
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => type(chip)}
                className="text-secondary-foreground hover:text-foreground hover:bg-accent/8 flex-none rounded-full bg-white/[0.025] px-[13px] py-[7px] text-[13px] whitespace-nowrap shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[color,background-color,box-shadow] duration-250 hover:shadow-[inset_0_0_0_1px_rgba(155,124,255,0.4)]"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <div className={newUser ? "mt-3" : "mt-[30px]"}>
          <AskBox
            value={question}
            onChange={type}
            onSubmit={submit}
            examples={EXAMPLES}
            locked={sending || !!limit}
            vanishing={!!madeId}
            onVanished={openLesson}
          />
        </div>

        <div className="mt-3.5 flex flex-col items-center gap-2.5 px-1.5 sm:flex-row sm:justify-between sm:gap-4">
          <SegmentedControl label="Level" options={LEVELS} value={level} onChange={setLevel} />
          <span className={cn("text-xs tabular-nums", tooShort || full ? "text-danger" : "text-muted-foreground")}>
            {hint}
          </span>
        </div>

        {(limit || error) && (
          <p role="status" className="text-secondary-foreground mt-3.5 text-[13px]">
            {limit ? (
              <>
                {limit.time ? (
                  <>
                    {limit.text} at <b className="text-foreground font-medium">{limit.time}</b>.
                  </>
                ) : (
                  `${limit.text} later.`
                )}
              </>
            ) : (
              error
            )}
          </p>
        )}
      </section>

      <ContinueWatching lessons={lessons} failed={failed} />
    </>
  );
}

// Which limit locks the box, and when the oldest lesson that counts drops out of the 24 hours.
function limitNotice(lessons: Lesson[] | null, usage: Usage | null) {
  if (!lessons || !usage) return null;
  const recent = lessons.filter((lesson) => Date.parse(lesson.created_at) > Date.now() - DAY_MS);
  if (usage.used >= usage.limit)
    return {
      text: `You've used today's ${usage.limit} lessons. You get one back`,
      time: backAt(recent.filter((lesson) => lesson.status !== "failed")),
    };
  if (usage.tries >= usage.try_limit)
    return { text: "Too many lessons failed today. You can try again", time: backAt(recent) };
  return null;
}

// Empty when the user's clock runs ahead of the server's; the message then leaves the time out.
function backAt(lessons: Lesson[]) {
  if (!lessons.length) return "";
  const oldest = Math.min(...lessons.map((lesson) => Date.parse(lesson.created_at)));
  return new Date(oldest + DAY_MS).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Faint graph paper behind the ask box, faded out at the edges so it never widens the column.
function GraphPaper() {
  const columns = Array.from({ length: 15 }, (_, index) => 120 + index * 60);
  const rows = Array.from({ length: 10 }, (_, index) => 40 + index * 60);
  return (
    <svg
      viewBox="0 0 1100 640"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
      className="pointer-events-none absolute top-[2vh] left-0 h-[640px] w-full [mask-image:radial-gradient(40%_42%_at_50%_40%,#000_20%,transparent_100%)] stroke-[rgba(183,164,255,0.065)]"
    >
      {columns.map((x) => (
        <path key={`x${x}`} d={`M${x} 40V600`} />
      ))}
      {rows.map((y) => (
        <path key={`y${y}`} d={`M120 ${y}H980`} />
      ))}
    </svg>
  );
}
