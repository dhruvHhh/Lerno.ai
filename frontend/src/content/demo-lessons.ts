import { ChartBarIcon, VectorTwoIcon, WaveSineIcon, type Icon } from "@phosphor-icons/react";

export interface Lesson {
  id: string;
  topic: string;
  title: string;
  src: string;
  poster: string;
  label: string;
  icon: Icon;
  start: number;
  duration: number;
  scenes: { at: number; title: string; narration: string }[];
}

// `start` skips the title intro; `at` is when each scene starts (seconds).
export const DEMO_LESSONS: Lesson[] = [
  {
    id: "integrals",
    topic: "Integrals",
    title: "Area under a curve",
    src: "/videos/area-under-curve.mp4",
    poster: "/videos/area-under-curve.webp",
    label: "An AI-generated Lerno lesson on finding the area under a curve",
    icon: ChartBarIcon,
    start: 2.5,
    duration: 37.2,
    scenes: [
      {
        at: 0,
        title: "Shade the area",
        narration:
          "Imagine the curve y equals x squared from x equals 0 to 2. The region between the curve and the x-axis has an area. How can we measure something with a curved edge?",
      },
      {
        at: 10.5,
        title: "Slice into strips",
        narration:
          "Slice the interval into four strips. On each strip, build a rectangle whose height is the curve's value at its left edge. Adding their areas gives a rough estimate.",
      },
      {
        at: 21.2,
        title: "Thinner strips",
        narration:
          "Make the rectangles thinner and thinner. The gaps shrink, and the total approaches a single number, the exact area. This limit is the definite integral, which here equals eight thirds.",
      },
    ],
  },
  {
    id: "derivatives",
    topic: "Derivatives",
    title: "Derivative of sin(x)",
    src: "/videos/sine-derivative.mp4",
    poster: "/videos/sine-derivative.webp",
    label: "An AI-generated Lerno lesson on the derivative of sin(x)",
    icon: WaveSineIcon,
    start: 4.5,
    duration: 36.5,
    scenes: [
      {
        at: 0,
        title: "Tangent slopes",
        narration:
          "Here's the graph of sin(x) in blue. At each point, a tangent line shows the curve's slope, which keeps changing as we move right.",
      },
      {
        at: 15,
        title: "Plot the slopes",
        narration:
          "At the peak, slope is zero. Where sin(x) rises fastest, near x=0, slope is maximum. Let's plot these slope values below.",
      },
      {
        at: 27,
        title: "It's cos(x)",
        narration:
          "The orange slope curve traced below is exactly cos(x)! This proves the derivative of sin(x) is cos(x).",
      },
    ],
  },
  {
    id: "vectors",
    topic: "Vectors",
    title: "Adding vectors tip to tail",
    src: "/videos/vectors.mp4",
    poster: "/videos/vectors.webp",
    label: "An AI-generated Lerno lesson on adding vectors tip to tail",
    icon: VectorTwoIcon,
    start: 3.5,
    duration: 26.6,
    scenes: [
      {
        at: 0,
        title: "Two vectors",
        narration:
          "Here are two vectors, A in blue and B in red, both starting at the origin. Each has a direction and length.",
      },
      {
        at: 7.5,
        title: "Tip to tail",
        narration:
          "Now slide vector B so its tail starts at the tip of A, keeping B's length and direction exactly the same.",
      },
      {
        at: 16.5,
        title: "The sum",
        narration: "Draw a new vector, green, from the start of A to the tip of B. This is the sum, A plus B.",
      },
    ],
  },
];

// Seconds into the area lesson where the demo note is saved.
export const NOTE_AT = 19;

export const shareOf = (seconds: number, lesson: Lesson) => `${(seconds / lesson.duration) * 100}%`;
