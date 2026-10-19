import { useState } from "react";

import { api, ApiError } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// The server takes at most 10 messages, starting with a question, and replies of at most 2000 characters.
const HISTORY = 10;
const REPLY_MAX = 2000;

// The chat lives with the page, not the card: an answer still arrives after the card closes. Nothing is saved.
export default function useTutor(lessonId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);

  const ask = async (scene_position: number, time_seconds: number) => {
    const question = draft.trim();
    if (!question || pending || locked) return;
    const history: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(history);
    setDraft("");
    setPending(true);
    setError("");
    let recent = history.slice(-HISTORY).map((m) => ({ ...m, content: m.content.slice(0, REPLY_MAX) }));
    if (recent[0].role !== "user") recent = recent.slice(1);
    try {
      const reply = await api<ChatMessage>(`/lessons/${lessonId}/messages`, {
        method: "POST",
        body: JSON.stringify({ scene_position, time_seconds, messages: recent }),
      });
      setMessages([...history, reply]);
    } catch (failure) {
      // The question goes back into the input, so it can be sent again; the daily limit locks the input.
      setMessages(messages);
      setDraft(question);
      setError((failure as ApiError).message);
      if ((failure as ApiError).status === 429) setLocked(true);
    } finally {
      setPending(false);
    }
  };

  return { messages, draft, setDraft, pending, error, locked, ask };
}
