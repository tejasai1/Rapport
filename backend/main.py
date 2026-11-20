import json
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from character import load_scenario
from llm import get_character_reply
from feedback import Feedback, generate_feedback
from db import delete_all_sessions, init_db, list_sessions, save_session

app = FastAPI(title="Rapport API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
init_db()
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
        {
            "id": s["id"],
            "track": s["track"],
            "title": s["title"],
            "difficulty": s["difficulty"],
            "setting": s["setting"],
            "character": f"{s['character']['name']}, {s['character']['age']}",
            "skills_focus": s["skills_focus"],
        }
        for s in load_scenarios()
    ]

@app.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str):
    for s in load_scenarios():
        if s["id"] == scenario_id:
            return public_view(s)
    raise HTTPException(status_code=404, detail="Scenario not found")
# ---------- Chat ----------

class ChatMessage(BaseModel):
    # Only user and assistant messages are allowed; the system prompt is always built here
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    scenario_id: str
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)


class ChatResponse(BaseModel):
    reply: str


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        scenario = load_scenario(request.scenario_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Scenario not found")

    if request.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="The last message must be from the user")

    history = [m.model_dump() for m in request.messages]
    try:
        reply = get_character_reply(scenario, history)
    except Exception as e:
        print(f"AI error: {e}")
        raise HTTPException(status_code=502, detail="The AI service didn't respond. Please try again.")

    return ChatResponse(reply=reply)
# ---------- Feedback ----------

class FeedbackRequest(BaseModel):
    scenario_id: str
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)


@app.post("/feedback", response_model=Feedback)
def feedback(request: FeedbackRequest):
    try:
        scenario = load_scenario(request.scenario_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Scenario not found")

    user_turns = sum(1 for m in request.messages if m.role == "user")
    if user_turns < 3:
        raise HTTPException(
            status_code=400,
            detail="Send at least 3 messages in the conversation before asking for feedback",
        )

    history = [m.model_dump() for m in request.messages]
    try:
        result = generate_feedback(scenario, history)
    except Exception as e:
        print(f"Feedback error: {e}")
        raise HTTPException(status_code=502, detail="Couldn't generate feedback. Please try again.")

    save_session(request.scenario_id, history, result.model_dump())
    return result


# ---------- Sessions ----------

@app.get("/sessions")
def get_sessions():
    scenarios = {s["id"]: s for s in load_scenarios()}
    sessions = list_sessions()
    for s in sessions:
        scenario = scenarios.get(s["scenario_id"], {})
        s["title"] = scenario.get("title", s["scenario_id"])
        s["track"] = scenario.get("track", "")
    return sessions


@app.delete("/sessions")
def clear_sessions():
    return {"deleted": delete_all_sessions()}