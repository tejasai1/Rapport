"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import SkillRadar from "@/components/SkillRadar";
import { getFeedback, type ChatMessage, type FeedbackResult } from "@/lib/api";
import { SKILL_LABELS, SKILL_ORDER } from "@/lib/skills";

type Status = "loading" | "ready" | "no-session" | "error";

function FeedbackReport() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const requested = useRef(false);

  function load() {
    // Reuse saved feedback so a page refresh doesn't pay for a new AI call
    const cached = sessionStorage.getItem(`rapport-feedback-${id}`);
    if (cached) {
      setFeedback(JSON.parse(cached));
      setStatus("ready");
      return;
    }

    const saved = sessionStorage.getItem(`rapport-session-${id}`);
    if (!saved) {
      setStatus("no-session");
      return;
    }

    setStatus("loading");
    const messages: ChatMessage[] = JSON.parse(saved);
    getFeedback(id, messages)
      .then((data) => {
        sessionStorage.setItem(`rapport-feedback-${id}`, JSON.stringify(data));
        setFeedback(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(() => {
    // React runs this twice in development; the guard makes sure the AI is only called once
    if (requested.current) return;
    requested.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (status === "loading") {
    return (
      <div className="page center-state">
        <p className="muted">{"Your coach is reviewing the conversation…"}</p>
      </div>
    );
  }

  if (status === "no-session") {
    return (
      <div className="page center-state">
        <p className="muted">{"There's no finished conversation to review yet."}</p>
        <Link href={`/practice/${id}`} className="button-primary">Start practicing</Link>
      </div>
    );
  }

  if (status === "error" || !feedback) {
    return (
      <div className="page center-state">
        <p className="error">{"Feedback couldn't be generated. Check that the backend is running."}</p>
        <button type="button" className="button-primary" onClick={load}>Try again</button>
      </div>
    );
  }

  const scores = feedback.scores;
  const values = SKILL_ORDER.map((k) => scores[k]);
  const overall = (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1);
  const weakest = SKILL_ORDER.reduce((low, k) => (scores[k] < scores[low] ? k : low));
  const found = feedback.discovered_hidden_detail;

  return (
    <div className="page">
      <header className="report-header">
        <div>
          <p className="eyebrow-muted">Session feedback</p>
          <h1>Your feedback</h1>
          <p className="report-summary">{feedback.summary}</p>
        </div>
        <div className="actions">
          <Link href={`/practice/${id}`} className="button-primary">Practice again</Link>
          <Link href="/" className="button-light">All scenarios</Link>
        </div>
      </header>

      <div className="report-row">
        <section className="panel" aria-label="Skill scores">
          <div className="panel-title-row">
            <h2>Your skills</h2>
            <span className="overall">Overall <strong>{overall}</strong> / 5</span>
          </div>
          <SkillRadar scores={scores} weakest={weakest} />
          {SKILL_ORDER.map((k) => (
            <div key={k} className={k === weakest ? "score-row weak" : "score-row"}>
              <span>{SKILL_LABELS[k]}</span>
              <div className="bar">
                <div className="score-bar-fill" style={{ width: `${scores[k] * 20}%` }} />
              </div>
              <strong>{scores[k]}</strong>
            </div>
          ))}
        </section>

        <div className="report-col">
          <section className="panel" aria-label="What you did well">
            <span className="eyebrow">What you did well</span>
            <p className="panel-text">{feedback.did_well.point}</p>
            <blockquote className="quote quote-good">“{feedback.did_well.quote}”</blockquote>
          </section>

          <section className="panel" aria-label="One thing to improve">
            <span className="eyebrow eyebrow-amber">One thing to improve</span>
            <p className="panel-text">{feedback.to_improve.point}</p>
            <span className="quote-label">You said</span>
            <blockquote className="quote quote-said">“{feedback.to_improve.quote}”</blockquote>
            <span className="quote-label">Try instead</span>
            <blockquote className="quote quote-better">“{feedback.to_improve.better_example}”</blockquote>
          </section>
        </div>
      </div>

      <div className="report-row">
        <section className="panel panel-dark" aria-label="Hidden detail">
          <h2>{found ? "Hidden detail: discovered" : "Hidden detail: not discovered"}</h2>
          <p className="panel-text">
            {found
              ? "Your questions got them to open up and share something personal. Nice work."
              : "There was more to their story. Open questions about their life would have unlocked it."}
          </p>
        </section>

        <section className="panel" aria-label="Red flags">
          <h2>{feedback.red_flags.length === 0 ? "No red flags" : "Red flags"}</h2>
          {feedback.red_flags.length === 0 ? (
            <p className="panel-text">Respectful and friendly the whole way through.</p>
          ) : (
            <ul className="flag-list">
              {feedback.red_flags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <p className="muted">Loading…</p>
        </div>
      }
    >
      <FeedbackReport />
    </Suspense>
  );
}