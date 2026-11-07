import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "@/App";
import "@/index.css";

// After a deploy, an open tab still asks for the old page files, which no longer exist. One reload fetches the new
// ones; the 10s guard stops a reload loop if the files are really broken.
const RELOADED_AT = "lerno:reloaded-at";
window.addEventListener("vite:preloadError", (event) => {
  if (Date.now() - Number(sessionStorage.getItem(RELOADED_AT)) < 10_000) return;
  event.preventDefault();
  sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  window.location.reload();
});

// Every lesson link counts as one page, and link data such as password reset codes never leaves.
const countedUrl = (event: BeforeSendEvent) => {
  const { origin, pathname } = new URL(event.url);
  return { ...event, url: origin + (pathname.startsWith("/lesson/") ? "/lesson" : pathname) };
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <Analytics mode={import.meta.env.DEV ? "development" : "production"} beforeSend={countedUrl} />
  </StrictMode>,
);
