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
export type ScenarioDetail = {
  id: string;
  track: string;
  title: string;
  difficulty: string;
  setting: string;
  character: { name: string; age: number; personality: string; mood: string };
  opening_line: string;
  skills_focus: string[];
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function getScenario(id: string): Promise<ScenarioDetail> {
  const res = await fetch(`${API_URL}/scenarios/${id}`);
  if (!res.ok) throw new Error(`Failed to load scenario (${res.status})`);
  return res.json();
}

export async function sendChatMessage(scenarioId: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_id: scenarioId, messages }),
  });
  if (!res.ok) throw new Error(`Chat failed (${res.status})`);
  const data: { reply: string } = await res.json();
  return data.reply;
}