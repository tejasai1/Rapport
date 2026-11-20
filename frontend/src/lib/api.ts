const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type ScenarioSummary = {
  id: string;
  track: string;
  title: string;
  difficulty: string;
  setting: string;
  character: string;
  skills_focus: string[];
};

export async function getScenarios(): Promise<ScenarioSummary[]> {
  const res = await fetch(`${API_URL}/scenarios`);
  if (!res.ok) throw new Error(`Failed to load scenarios (${res.status})`);
  return res.json();
}