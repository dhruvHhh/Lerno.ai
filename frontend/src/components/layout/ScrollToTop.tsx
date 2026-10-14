import { useLenis } from "lenis/react";
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router";

// A new page starts at the top; Back, Forward and reload keep the browser's own scroll position.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigation = useNavigationType();
  const lenis = useLenis();

  useEffect(() => {
    if (navigation === "POP") return;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname, navigation, lenis]);

  return null;
}
