from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.config import SCENES_PER_LESSON

Audience = Literal["school", "high_school", "college"]
Role = Literal["user", "assistant"]


class RequestBody(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)


class LessonCreate(RequestBody):
    topic: str = Field(min_length=3, max_length=200)
    audience: Audience


class PlaybackPosition(RequestBody):
    scene_position: int = Field(ge=1, le=SCENES_PER_LESSON)
    # The cap and allow_inf_nan block values the database column can't hold.
    time_seconds: float = Field(ge=0, le=600, allow_inf_nan=False)


NoteText = Annotated[str, Field(min_length=1, max_length=5000)]


class NoteUpdate(RequestBody):
    content: NoteText


class NoteCreate(PlaybackPosition):
    content: NoteText


class ChatMessage(RequestBody):
    role: Role
    content: str = Field(min_length=1, max_length=2000)

    @model_validator(mode="after")
    def short_questions(self) -> "ChatMessage":
        if self.role == "user" and len(self.content) > 500:
            raise ValueError("Questions can be at most 500 characters")
        return self


# The position tells the tutor what "this" means in the learner's question.
class MessageCreate(PlaybackPosition):
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
    mcq_choices: list[str] = Field(min_length=4, max_length=4)
    mcq_correct_index: int
    fr_question: str
    fr_answer: str

    @model_validator(mode="after")
    def answer_is_a_choice(self) -> "ScenePlan":
        # A bad index would break the quiz in the app, so the lesson fails (for free) instead.
        if not 0 <= self.mcq_correct_index < len(self.mcq_choices):
            raise ValueError("mcq_correct_index must point at one of mcq_choices")
        return self


class LessonPlan(BaseModel):
    title: str
    scenes: list[ScenePlan]


class ManimCode(BaseModel):
    code: str
