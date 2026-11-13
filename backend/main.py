import json
from pathlib import Path

from fastapi import FastAPI, HTTPException

app = FastAPI(title="Rapport API")

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "scenarios.json"


def load_scenarios():
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


def public_view(scenario):
    # Hide the character's hidden detail so users have to discover it by asking
    character = {k: v for k, v in scenario["character"].items() if k != "hidden_detail"}
    return {**scenario, "character": character}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/scenarios")
def list_scenarios():
    return [
        {k: s[k] for k in ("id", "track", "title", "difficulty", "setting")}
        for s in load_scenarios()
    ]


@app.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str):
    for s in load_scenarios():
        if s["id"] == scenario_id:
            return public_view(s)
    raise HTTPException(status_code=404, detail="Scenario not found")