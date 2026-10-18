import { ArrowRight } from "@phosphor-icons/react";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

import Card from "@/components/watch/Card";
import Stamp from "@/components/watch/Stamp";
import type useTutor from "@/hooks/useTutor";
import { cn } from "@/lib/utils";

const QUESTION_MAX = 500;
const COUNTER_FROM = 450;

interface TutorCardProps {
  open: boolean;
  onClose: () => void;
  tutor: ReturnType<typeof useTutor>;
  moment: ReactNode;
  onAsk: () => void;
  className?: string;
}

export default function TutorCard({ open, onClose, tutor, moment, onAsk, className }: TutorCardProps) {
  const input = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const { messages, draft, setDraft, pending, error, locked } = tutor;

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages, pending]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    onAsk();
  };

  return (
    <Card
      title="Tutor"
      open={open}
      onClose={onClose}
      chip={<Stamp>{moment}</Stamp>}
      className={className}
      footer={
        <div className="mx-3.5 mb-3.5 grid flex-none gap-1.5">
          {error && <p className="text-danger px-1 text-xs">{error}</p>}
          <form
            onSubmit={send}
            className="relative h-[46px] rounded-full bg-[#05060a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)] transition-[box-shadow] duration-[400ms] focus-within:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_2px_rgba(155,124,255,0.8),0_0_0_5px_rgba(155,124,255,0.2)]"
          >
            <input
              ref={input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={QUESTION_MAX}
              disabled={locked}
              placeholder="Ask about this moment"
              aria-label="Your question"
              autoComplete="off"
              className="text-foreground caret-accent-soft placeholder:text-muted-foreground size-full bg-transparent pr-[52px] pl-[18px] text-sm outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={locked || pending}
              className={cn(
                "absolute top-1.5 right-1.5 grid size-[34px] place-items-center rounded-full transition-[background-color,color] duration-300",
                draft.trim() && !locked ? "bg-foreground text-background" : "text-muted-foreground bg-[#1a1c26]",
              )}
            >
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>
          {draft.length >= COUNTER_FROM && (
            <span
              className={cn(
                "px-1 text-right text-xs tabular-nums",
                draft.length >= QUESTION_MAX ? "text-danger" : "text-muted-foreground",
              )}
            >
              {draft.length} / {QUESTION_MAX}
            </span>
          )}
        </div>
      }
    >
      {!messages.length && !pending && (
        <p className="text-muted-foreground px-2.5 py-8 text-center text-[13px]">
          Ask about what's on screen. The tutor knows which scene you're in and the moment you paused at.
        </p>
      )}
      {messages.map((message, k) =>
        message.role === "user" ? (
          <p
            key={k}
            className="max-w-[85%] justify-self-end rounded-[14px_14px_4px_14px] bg-white/7 px-[13px] py-[9px] text-sm"
          >
            {message.content}
          </p>
        ) : (
          <p key={k} className="text-secondary-foreground text-sm leading-relaxed whitespace-pre-line">
            {message.content}
          </p>
        ),
      )}
      {pending && (
        <div className="flex gap-1" aria-label="The tutor is answering">
          {[0, 1, 2].map((k) => (
            <i
              key={k}
              className="bg-muted-foreground size-1.5 rounded-full motion-safe:animate-pulse"
              style={{ animationDelay: `${k * 0.2}s` }}
            />
          ))}
        </div>
      )}
      <div ref={end} />
    </Card>
  );
}
