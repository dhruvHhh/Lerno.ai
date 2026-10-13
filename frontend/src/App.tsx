import { ReactLenis } from "lenis/react";
import { LazyMotion } from "motion/react";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";

import { prefersReducedMotion } from "@/lib/utils";
import Home from "@/pages/Home";

const Login = lazy(() => import("@/pages/Login"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const reduceMotion = prefersReducedMotion();

const SMOOTH_SCROLL = {
  smoothWheel: !reduceMotion,
  anchors: { offset: -100, immediate: reduceMotion },
};

const loadMotion = () => import("@/lib/motion-features").then((module) => module.default);

export default function App() {
  return (
    <ReactLenis root options={SMOOTH_SCROLL}>
      <LazyMotion features={loadMotion} strict>
        <Suspense>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </LazyMotion>
    </ReactLenis>
  );
}
