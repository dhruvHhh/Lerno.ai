import { ReactLenis } from "lenis/react";
import { LazyMotion } from "motion/react";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";

import AuthProvider from "@/components/auth/AuthProvider";
import RouteGate from "@/components/auth/RouteGate";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { prefersReducedMotion } from "@/lib/utils";
import Home from "@/pages/Home";

const Login = lazy(() => import("@/pages/Login"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const AppShell = lazy(() => import("@/components/app/AppShell"));
const NewLesson = lazy(() => import("@/pages/NewLesson"));
const Lesson = lazy(() => import("@/pages/Lesson"));
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
        <AuthProvider>
          <ScrollToTop />
          <Suspense>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route element={<RouteGate signedIn={false} />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              <Route element={<RouteGate signedIn />}>
                <Route element={<AppShell />}>
                  <Route path="/new" element={<NewLesson />} />
                  <Route path="/lesson/:id" element={<Lesson />} />
                </Route>
              </Route>
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </LazyMotion>
    </ReactLenis>
  );
}
