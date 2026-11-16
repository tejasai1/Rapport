import os

from dotenv import load_dotenv
from openai import OpenAI

from character import build_system_prompt, load_scenario

load_dotenv()
client = OpenAI(
    base_url="https://api.meta.ai/v1",
    api_key=os.environ["MODEL_API_KEY"],
)
MODEL = os.getenv("MODEL_NAME", "muse-spark-1.3")

scenario = load_scenario("dating-coffee-first-date")
name = scenario["character"]["name"]
messages = [{"role": "system", "content": build_system_prompt(scenario)}]

print(f"\nScene: {scenario['setting']}")
print("(Type 'quit' to end)\n")
print(f"{name}: {scenario['opening_line']}\n")

while True:
    user_input = input("You: ").strip()
    if user_input.lower() in ("quit", "exit"):
        break
    if not user_input:
        continue

    messages.append({"role": "user", "content": user_input})
    response = client.chat.completions.create(model=MODEL, messages=messages)
    reply = response.choices[0].message.content
    messages.append({"role": "assistant", "content": reply})
    print(f"\n{name}: {reply}\n")