from typing import Literal

from pydantic import BaseModel, Field, field_validator

Audience = Literal["school", "high_school", "college"]
Role = Literal["user", "assistant"]


class LessonCreate(BaseModel):
    topic: str = Field(min_length=3, max_length=200)
    audience: Audience


class NoteCreate(BaseModel):
    title: str = Field(max_length=120)
    content: str = Field(max_length=5000)


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=120)
    content: str | None = Field(default=None, max_length=5000)


class ChatMessage(BaseModel):
    role: Role
    content: str = Field(min_length=1, max_length=500)


class MessageCreate(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=10)

    @field_validator("messages")
    @classmethod
    def ends_with_user(cls, messages: list[ChatMessage]) -> list[ChatMessage]:
        if messages[0].role != "user" or messages[-1].role != "user":
            raise ValueError("Conversation must start and end with a user message")
        return messages


# Shapes Claude must return (structured output)
class ScenePlan(BaseModel):
    title: str
    narration: str
    animation_description: str
    mcq_question: str
    mcq_choices: list[str]
    mcq_correct_index: int
    fr_question: str
    fr_answer: str


class LessonPlan(BaseModel):
    scenes: list[ScenePlan]


class ManimCode(BaseModel):
    code: str
