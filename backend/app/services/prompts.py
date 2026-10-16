from app.config import SCENES_PER_LESSON
from app.schemas import ScenePlan

AUDIENCES = {
    "school": "a school student",
    "high_school": "a high school student",
    "college": "a college student",
}

# Raw string, never .format()-ed, so LaTeX like \vec stays intact.
MANIM_RULES = r"""Write Manim Community Edition v0.19.0 code for one scene of an educational video.

Rules:
- Start with: from lerno_theme import *
  (it includes all of manim and sets Lerno's fonts, colours, background and line style; never override them)
- Define exactly one class: class LessonScene(Scene)
- 10 to 20 seconds long, at most 7 self.play() calls, with self.wait() between them
- Simple sequential animations only: no loops, comprehensions, custom functions, randomness or if statements
- Use only: scene_label, Text, MathTex, Axes, NumberPlane, Arrow, Line, DashedLine, Dot, Circle, Square, Rectangle,
  Polygon, SurroundingRectangle, Brace, VGroup
- Animations: Create, Write, FadeIn, FadeOut, Transform, GrowArrow, Indicate
- No images, SVGs, sounds, file access or imports other than lerno_theme
- Title: the first line of construct is title = scene_label("Scene title") in sentence case, shown with
  self.play(FadeIn(title)); never make a title with Text or put any text at the top centre
- Text: font_size 32-44, at most 10 words per Text, never overlapping and never on top of a line or curve;
  put labels and equations beside the diagram with .next_to(diagram, RIGHT, buff=0.5) or below it;
  stack several texts in a VGroup with .arrange(DOWN, buff=0.4); text beside a wide diagram has little room,
  so keep it to 4 words per line or put it below; the render stops with an error if any text leaves the screen
- Numbers: show only values given in the scene description or exact simple ones; never work out new decimals;
  round any approximation to 2 decimal places and write it with \approx
- Layout: the safe area is x from -6 to 6 and y from -3.4 to 2.7; the main diagram fills most of it
  (about 9 units wide or 5 units tall) and nothing leaves it; keep the bottom-right corner empty for the logo
- Axes: size them with x_length and y_length (for example x_length=10, y_length=5) and place points on them
  with axes.c2p(x, y)
- Colors: WHITE, YELLOW, BLUE, GREEN, RED, PURPLE, ORANGE, PINK, GRAY (they are Lerno's palette); never set a
  background colour
- Arrows: Arrow(start=ORIGIN, end=[2, 1, 0], buff=0, color=YELLOW); never use scale_tips or add_tip()
- 2D points are [x, y, 0]

Example:
from lerno_theme import *

class LessonScene(Scene):
    def construct(self):
        title = scene_label("A vector on the plane")
        axes = Axes(x_range=[-5, 5, 1], y_range=[-3, 3, 1], x_length=10, y_length=5)
        axes.shift(DOWN * 0.4)
        vector = Arrow(start=axes.c2p(0, 0), end=axes.c2p(2, 1), buff=0, color=YELLOW)
        label = MathTex(r"\vec{v} = (2, 1)", font_size=40).next_to(vector.get_end(), UR, buff=0.2)
        self.play(FadeIn(title), Create(axes))
        self.wait(0.5)
        self.play(GrowArrow(vector), Write(label))
        self.wait(1)
"""


def plan_prompt(topic: str, audience: str) -> str:
    return f"""Plan a short animated lesson in the style of 3Blue1Brown that explains "{topic}" to {AUDIENCES[audience]}.

Create exactly {SCENES_PER_LESSON} scenes that build on each other. Each scene is one simple visual idea that can be
animated in 10-20 seconds, for example drawing two vectors from the origin, then adding them tip to tail.

Give the whole lesson a title: a short name of at most 5 words in plain text, for example "Area under y = x²".

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


def tutor_prompt(topic: str, audience: str, scenes: list[dict], scene_position: int, time_seconds: float) -> str:
    lesson = "\n".join(f"Scene {i}, {scene['title']}: {scene['narration']}" for i, scene in enumerate(scenes, 1))
    minutes, seconds = divmod(int(time_seconds), 60)
    title = scenes[scene_position - 1]["title"]
    return f"""You are a friendly tutor helping {AUDIENCES[audience]} with a lesson on "{topic}".
The lesson has these scenes:
{lesson}

The student paused at {minutes}:{seconds:02d} in scene {scene_position}, "{title}". When they say "this" or "here", they mean that moment. Do not mention the time in your answer.

Answer in 2-4 short sentences of simple language and stay on this topic. Use an example or analogy when it helps.
Reply in the same language and script as the student's question: English gets English, Hinglish (Hindi in English letters) gets Hinglish, Hindi in Devanagari gets Devanagari.
Write plain text only: no markdown, bold, bullet points or headings."""
