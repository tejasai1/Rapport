"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { getScenario, sendChatMessage, type ChatMessage, type ScenarioDetail } from "@/lib/api";
import { SKILL_LABELS, SKILL_TIPS } from "@/lib/skills";

const MAX_USER_MESSAGES = 20;
const MIN_FOR_FEEDBACK = 3;

function PracticeChat() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load the scenario when the page opens
  useEffect(() => {
    getScenario(id).then(setScenario).catch(() => setLoadError(true));
  }, [id]);

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const userCount = messages.filter((m) => m.role === "user").length;
  const limitReached = userCount >= MAX_USER_MESSAGES;
  const canGetFeedback = userCount >= MIN_FOR_FEEDBACK && !sending;

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || limitReached) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSendError("");
    setSending(true);

    try {
      const reply = await sendChatMessage(id, next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      // Undo the failed message and give the text back so nothing is lost
      setMessages(messages);
      setInput(text);
      setSendError("No reply came back. Check that the backend is running, then try again.");
    } finally {
      setSending(false);
    }
  }

  function handleEnd() {
    // Hand the conversation to the feedback page (built in Step 10)
    sessionStorage.setItem(`rapport-session-${id}`, JSON.stringify(messages));
    router.push(`/practice/${id}/feedback`);
  }

  if (loadError) {
    return (
      <div className="page">
        <p className="error">{"This scenario couldn't be loaded."}</p>
        <Link href="/" className="text-link">Back to scenarios</Link>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  const c = scenario.character;
  const hint = scenario.skills_focus.map((k) => SKILL_TIPS[k]).filter(Boolean).join(" ");

  return (
    <div className="chat-layout">
      <section className="chat-panel" aria-label="Conversation">
        <header className="chat-header">
          <div className="chat-person">
            <span className="avatar avatar-lg" aria-hidden="true">{c.name.charAt(0)}</span>
            <div>
              <p className="chat-name">{c.name}, {c.age}</p>
              <p className="chat-sub">{scenario.title} · {c.mood}</p>
            </div>
          </div>
          <Link href="/" className="text-link">Leave</Link>
        </header>

        <div className="chat-messages" aria-live="polite">
          <p className="chat-setting">{scenario.setting}</p>
          <div className="bubble them">{scenario.opening_line}</div>
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "bubble me" : "bubble them"}>
              {m.content}
            </div>
          ))}
          {sending && (
            <div className="bubble them typing" aria-label={`${c.name} is typing`}>
              <span />
              <span />
              <span />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {sendError && <p className="error chat-error">{sendError}</p>}

        <form className="chat-form" onSubmit={handleSend}>
          <label htmlFor="msg" className="sr-only">Your message</label>
          <input
            id="msg"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={limitReached ? "Message limit reached. Get your feedback!" : "Type your reply…"}
            disabled={limitReached}
            maxLength={2000}
            autoComplete="off"
          />
          <button
            type="submit"
            className="send-button"
            aria-label="Send message"
            disabled={sending || !input.trim() || limitReached}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </section>

      <aside className="chat-side" aria-label="Session">
        <div className="side-card">
          <span className="eyebrow muted-eyebrow">This session</span>
          <span>Skills in focus</span>
          <div className="chips">
            {scenario.skills_focus.map((k) => (
              <span key={k} className="chip">{SKILL_LABELS[k] ?? k}</span>
            ))}
          </div>
          <div className="progress-block">
            <span className="small-muted">Messages: {userCount} of {MAX_USER_MESSAGES}</span>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${(userCount / MAX_USER_MESSAGES) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="side-card">
          <button
            type="button"
            className="button-secondary"
            aria-expanded={showHint}
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? "Hide hint" : "Need a hint?"}
          </button>
          {showHint && <p className="hint">{hint}</p>}
        </div>

        <button type="button" className="button-dark" onClick={handleEnd} disabled={!canGetFeedback}>
          End &amp; get feedback
        </button>
        {!canGetFeedback && (
          <p className="small-muted">Send at least {MIN_FOR_FEEDBACK} messages to unlock feedback.</p>
        )}
      </aside>
    </div>
  );
}
export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <p className="muted">Loading…</p>
        </div>
      }
    >
      <PracticeChat />
    </Suspense>
  );
}