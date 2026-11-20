import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "rapport.db"


@contextmanager
def connect():
    # Open the database, save changes when done, and always close it
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scenario_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                messages TEXT NOT NULL,
                feedback TEXT NOT NULL,
                overall REAL NOT NULL,
                discovered_hidden_detail INTEGER NOT NULL
            )
        """)


def save_session(scenario_id, messages, feedback):
    scores = feedback["scores"]
    overall = round(sum(scores.values()) / len(scores), 1)
    with connect() as conn:
        cursor = conn.execute(
            """INSERT INTO sessions
               (scenario_id, created_at, messages, feedback, overall, discovered_hidden_detail)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                scenario_id,
                datetime.now(timezone.utc).isoformat(),
                json.dumps(messages),
                json.dumps(feedback),
                overall,
                int(feedback["discovered_hidden_detail"]),
            ),
        )
        return cursor.lastrowid


def list_sessions():
    with connect() as conn:
        rows = conn.execute(
            """SELECT id, scenario_id, created_at, feedback, overall, discovered_hidden_detail
               FROM sessions ORDER BY created_at DESC"""
        ).fetchall()
    return [
        {
            "id": row["id"],
            "scenario_id": row["scenario_id"],
            "created_at": row["created_at"],
            "overall": row["overall"],
            "discovered_hidden_detail": bool(row["discovered_hidden_detail"]),
            "scores": json.loads(row["feedback"])["scores"],
        }
        for row in rows
    ]


def delete_all_sessions():
    with connect() as conn:
        cursor = conn.execute("DELETE FROM sessions")
        return cursor.rowcount