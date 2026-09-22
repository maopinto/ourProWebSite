import { useEffect, useState } from "react";
import type { RefObject } from "react";

/** Animate examples only while the preview is visible and the reader allows it. */
export default function usePromptRotation<T extends string>(
  containerRef: RefObject<HTMLElement | null>,
  selected: T,
  choices: readonly T[],
  onSelect: (value: T) => void,
  blocked: boolean,
  revision: number,
) {
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(container);
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [containerRef]);

  const running =
    !paused && !reducedMotion && visible && pageVisible && !blocked;

  useEffect(() => {
    setLeaving(false);
    if (!running) return;
    const exitTimer = window.setTimeout(() => setLeaving(true), 4200);
    const changeTimer = window.setTimeout(() => {
      onSelect(choices[(choices.indexOf(selected) + 1) % choices.length]);
      setLeaving(false);
    }, 4420);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(changeTimer);
    };
  }, [selected, choices, onSelect, running, revision]);

  return { leaving, running, paused, setPaused, reducedMotion };
}
