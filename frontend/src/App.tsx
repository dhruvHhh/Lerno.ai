import { ReactLenis } from "lenis/react";
import { LazyMotion } from "motion/react";
import { Route, Routes } from "react-router-dom";

import Home from "@/pages/Home";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SMOOTH_SCROLL = {
  smoothWheel: !reduceMotion,
  anchors: { offset: -100, immediate: reduceMotion },
};

const loadMotion = () => import("@/lib/motion-features").then((module) => module.default);

export default function App() {
  return (
    <ReactLenis root options={SMOOTH_SCROLL}>
      <LazyMotion features={loadMotion} strict>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </LazyMotion>
    </ReactLenis>
  );
}
