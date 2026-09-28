from anthropic import Anthropic
from pydantic import BaseModel

from app.schemas import LessonPlan, ManimCode, ScenePlan
from app.services import prompts

PLANNER = "claude-sonnet-5"
TUTOR = "claude-haiku-4-5"

client = Anthropic()


def _ask[T: BaseModel](prompt: str, schema: type[T]) -> T:
    response = client.messages.parse(
        model=PLANNER,
        max_tokens=16000,
        messages=[{"role": "user", "content": prompt}],
        output_format=schema,
    )
    if response.parsed_output is None:
        raise RuntimeError(f"Claude returned no {schema.__name__} (stop_reason={response.stop_reason})")
    return response.parsed_output


def plan_lesson(topic: str, audience: str) -> LessonPlan:
    return _ask(prompts.plan_prompt(topic, audience), LessonPlan)


def write_manim(scene: ScenePlan) -> str:
    return _ask(prompts.manim_prompt(scene), ManimCode).code


def fix_manim(code: str, error: str) -> str:
    return _ask(prompts.fix_prompt(code, error), ManimCode).code


def tutor_reply(system: str, messages: list[dict]) -> str:
    response = client.with_options(timeout=30).messages.create(model=TUTOR, max_tokens=400, system=system, messages=messages)
    text = "".join(block.text for block in response.content if block.type == "text")
    return text or "Sorry, I can't help with that. Try asking about the lesson."
