from app.schemas import ScenePlan

AUDIENCES = {
    "school": "a school student",
    "high_school": "a high school student",
    "college": "a college student",
}

# Raw string, never .format()-ed, so LaTeX like \vec stays intact.
MANIM_RULES = r"""Write Manim Community Edition v0.19.0 code for one scene of an educational video.

Rules:
- Start with: from manim import *
- Define exactly one class: class LessonScene(Scene)
- 10 to 20 seconds long, at most 7 self.play() calls, with self.wait() between them
- Simple sequential animations only: no loops, comprehensions, custom functions, randomness or if statements
- Use only: Text, MathTex, Axes, NumberPlane, Arrow, Line, DashedLine, Dot, Circle, Square, Rectangle,
  Polygon, SurroundingRectangle, Brace, VGroup
- Animations: Create, Write, FadeIn, FadeOut, Transform, GrowArrow, Indicate
- No images, SVGs, sounds, file access or imports other than manim
- Text: font_size 24-36, at most 10 words per Text, never overlapping; titles use .to_edge(UP, buff=0.5);
  stack several texts in a VGroup with .arrange(DOWN, buff=0.4)
- Keep everything within 3 units of the center; scale large diagrams to 0.7
- Colors: WHITE, YELLOW, BLUE, GREEN, RED, PURPLE, ORANGE
- Arrows: Arrow(start=ORIGIN, end=[2, 1, 0], buff=0, color=YELLOW); never use scale_tips or add_tip()
- 2D points are [x, y, 0]

Example:
from manim import *

class LessonScene(Scene):
    def construct(self):
        axes = Axes(x_range=[-5, 5, 1], y_range=[-3, 3, 1], axis_config={"color": BLUE})
        vector = Arrow(start=ORIGIN, end=[2, 1, 0], buff=0, color=YELLOW)
        label = MathTex(r"\vec{v} = (2, 1)").next_to(vector, UP)
        self.play(Create(axes))
        self.wait(0.5)
        self.play(GrowArrow(vector), Write(label))
        self.wait(1)
"""


def plan_prompt(topic: str, audience: str) -> str:
    return f"""Plan a short animated lesson in the style of 3Blue1Brown that explains "{topic}" to {AUDIENCES[audience]}.

Create exactly 3 scenes that build on each other. Each scene is one simple visual idea that can be
animated in 10-20 seconds, for example drawing two vectors from the origin, then adding them tip to tail.

For each scene give:
- title: at most 5 words
- narration: read aloud to the student, at most 30 words
- animation_description: what appears on screen and where (positions, colors, motion), precise enough to animate
- mcq_question and mcq_choices: exactly 4 choices, the correct one at a random position, its 0-based index in mcq_correct_index
- fr_question and fr_answer: a short free-response question and its model answer"""


def manim_prompt(scene: ScenePlan) -> str:
    return f"{MANIM_RULES}\nScene title: {scene.title}\nNarration: {scene.narration}\nOn screen: {scene.animation_description}"


def fix_prompt(code: str, error: str) -> str:
    return f"{MANIM_RULES}\nThis code failed to render:\n\n{code}\n\nError:\n{error}\n\nReturn the corrected full code."


def tutor_prompt(topic: str, audience: str, narrations: list[str]) -> str:
    lesson = "\n".join(f"- {line}" for line in narrations)
    return f"""You are a friendly tutor helping {AUDIENCES[audience]} with a lesson on "{topic}".
The lesson says:
{lesson}

Answer in 2-4 short sentences of simple language and stay on this topic. Use an example or analogy when it helps.
Reply in the language of the student's question: Hindi or Hinglish questions get answers in Hindi (Devanagari)."""
