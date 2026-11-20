import type { FeedbackResult } from "@/lib/api";
import { SKILL_LABELS, SKILL_ORDER } from "@/lib/skills";

type Scores = FeedbackResult["scores"];

const CENTER = 120;
const RADIUS = 100;

// Position of a score on its axis: 5 axes, starting at the top, 72 degrees apart
function point(index: number, value: number): [number, number] {
  const angle = ((-90 + index * 72) * Math.PI) / 180;
  const r = (value / 5) * RADIUS;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

function toPoints(values: number[]) {
  return values.map((v, i) => point(i, v).join(",")).join(" ");
}

export default function SkillRadar({ scores, weakest }: { scores: Scores; weakest: string }) {
  const values = SKILL_ORDER.map((k) => scores[k]);
  const description = SKILL_ORDER.map((k) => `${SKILL_LABELS[k]} ${scores[k]}`).join(", ");

  return (
    <svg role="img" aria-label={`Skill scores out of 5: ${description}`} viewBox="-70 -20 380 270" className="radar">
      {[5, 3, 1].map((level) => (
        <polygon
          key={level}
          points={toPoints(SKILL_ORDER.map(() => level))}
          fill={level === 5 ? "#FBFAF8" : "none"}
          stroke="#E4E0D9"
        />
      ))}
      {SKILL_ORDER.map((k, i) => {
        const [x, y] = point(i, 5);
        return <line key={k} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="#E4E0D9" />;
      })}
      <polygon
        points={toPoints(values)}
        fill="#0F766E"
        fillOpacity="0.22"
        stroke="#0F766E"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {SKILL_ORDER.map((k, i) => {
        const [x, y] = point(i, 6.1);
        const anchor = Math.abs(x - CENTER) < 5 ? "middle" : x > CENTER ? "start" : "end";
        const isWeak = k === weakest;
        return (
          <text
            key={k}
            x={x}
            y={y + 4}
            textAnchor={anchor}
            fontSize="12"
            fill={isWeak ? "#B45309" : "#4A4952"}
            fontWeight={isWeak ? 600 : 400}
          >
            {SKILL_LABELS[k]}
          </text>
        );
      })}
    </svg>
  );
}