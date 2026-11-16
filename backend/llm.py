import os

from dotenv import load_dotenv
from openai import OpenAI

from character import build_system_prompt

load_dotenv()

client = OpenAI(
    base_url="https://api.meta.ai/v1",
    api_key=os.environ["MODEL_API_KEY"],
)
MODEL = os.getenv("MODEL_NAME", "muse-spark-1.3")


def get_character_reply(scenario, history):
    """history is a list of {"role": "user"|"assistant", "content": "..."} dicts."""
    messages = [{"role": "system", "content": build_system_prompt(scenario)}] + history
    response = client.chat.completions.create(model=MODEL, messages=messages)
    return response.choices[0].message.content