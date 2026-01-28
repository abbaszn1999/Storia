import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ScrollToTop Component
 * Scrolls to the top of the page whenever the route changes.
 * Place this component inside your Router to ensure it works correctly.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top instantly when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, [location]);

  return null;
}

export default ScrollToTop;
