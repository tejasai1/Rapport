"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getScenarios, type ScenarioSummary } from "@/lib/api";
import { SKILL_LABELS } from "@/lib/skills";

const TRACKS = ["all", "dating", "social", "work"];



const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default function Home() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [track, setTrack] = useState("all");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    getScenarios()
      .then((data) => {
        setScenarios(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const visible = scenarios.filter((s) => track === "all" || s.track === track);

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow-muted">Welcome back</p>
        <h1>What do you want to practice today?</h1>
      </header>

      <div className="pills" role="group" aria-label="Filter by track">
        {TRACKS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={track === t}
            className={track === t ? "pill active" : "pill"}
            onClick={() => setTrack(t)}
          >
            {capitalize(t)}
          </button>
        ))}
      </div>

      {status === "loading" && <p className="muted">Loading scenarios…</p>}
      {status === "error" && (
        <p className="error">Couldn't reach the Rapport API. Is the backend running on port 8000?</p>
      )}

      <div className="card-grid">
        {visible.map((s) => (
          <article key={s.id} className="card">
            <div className="card-top">
              <span className="eyebrow">{s.track}</span>
              <span className="badge">{capitalize(s.difficulty)}</span>
            </div>
            <h2>{s.title}</h2>
            <p className="card-text">{s.setting}</p>
            <div className="character">
              <span className="avatar" aria-hidden="true">{s.character.charAt(0)}</span>
              <span>With {s.character}</span>
            </div>
            <p className="skills">
              Skills: {s.skills_focus.map((k) => SKILL_LABELS[k] ?? k).join(" · ")}
            </p>
            <Link href={`/practice/${s.id}`} className="button-outline">
              Start practice
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}