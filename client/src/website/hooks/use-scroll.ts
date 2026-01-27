import { useState, useEffect, useCallback } from "react";

interface ScrollState {
  isScrolled: boolean;
  scrollY: number;
  scrollDirection: "up" | "down" | null;
}

export function useScroll(threshold: number = 50): ScrollState {
  const [scrollState, setScrollState] = useState<ScrollState>({
    isScrolled: false,
    scrollY: 0,
    scrollDirection: null,
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollState = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? "down" : "up";

      setScrollState({
        isScrolled: currentScrollY > threshold,
        scrollY: currentScrollY,
        scrollDirection: currentScrollY === lastScrollY ? null : direction,
      });

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrollState;
}

// Hook for tracking scroll progress (0 to 1)
interface ScrollProgressState {
  progress: number; // 0 to 1 based on total page scroll
  sectionProgress: number; // 0 to 1 for a specific section
  scrollY: number;
}

export function useScrollProgress(sectionHeight: number = 1000): ScrollProgressState {
  const [state, setState] = useState<ScrollProgressState>({
    progress: 0,
    sectionProgress: 0,
    scrollY: 0,
  });

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Overall page progress
      const maxScroll = documentHeight - windowHeight;
      const progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;
      
      // Section-based progress (how far through the first section)
      const sectionProgress = Math.min(scrollY / sectionHeight, 1);

      setState({
        progress,
        sectionProgress,
        scrollY,
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    // Initial calculation
    updateProgress();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionHeight]);

  return state;
}

// Utility function to interpolate values based on scroll
export function interpolate(
  progress: number,
  inputRange: [number, number],
  outputRange: [number, number]
): number {
  const [inputStart, inputEnd] = inputRange;
  const [outputStart, outputEnd] = outputRange;
  
  // Clamp progress to input range
  const clampedProgress = Math.max(inputStart, Math.min(inputEnd, progress));
  
  // Calculate interpolated value
  const ratio = (clampedProgress - inputStart) / (inputEnd - inputStart);
  return outputStart + ratio * (outputEnd - outputStart);
}

// Interpolate colors (hex format)
export function interpolateColor(
  progress: number,
  startColor: string,
  endColor: string
): string {
  const parseHex = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const start = parseHex(startColor);
  const end = parseHex(endColor);

  const r = Math.round(start.r + (end.r - start.r) * progress);
  const g = Math.round(start.g + (end.g - start.g) * progress);
  const b = Math.round(start.b + (end.b - start.b) * progress);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function useScrollLock() {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (isLocked) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
  }, [isLocked]);

  return { isLocked, setIsLocked };
}
