import json
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "scenarios.json"


def load_scenario(scenario_id):
    with open(DATA_PATH, encoding="utf-8") as f:
        for s in json.load(f):
            if s["id"] == scenario_id:
                return s
    raise ValueError(f"No scenario with id '{scenario_id}'")


def build_system_prompt(scenario):
    c = scenario["character"]
    return f"""You are role-playing as {c['name']}, age {c['age']}, in a conversation practice app.

Scene: {scenario['setting']}
Your personality: {c['personality']}
Your current mood: {c['mood']}
A detail about you: {c['hidden_detail']}
You opened the conversation by saying: "{scenario['opening_line']}"

How to play the role:
- Stay in character as a real person. Never say you are an AI and never give advice about the conversation.
- Keep replies short and natural, usually 1 to 3 sentences, like real speech or texting.
- Only share the detail above if the other person asks questions that naturally lead to it.
- React realistically: warm up if they're friendly and curious; get shorter or cooler if they're rude,
  dull, or only talk about themselves.
- If they're disrespectful or pushy, set a boundary the way a real person would.
- Keep the conversation respectful and non-explicit."""