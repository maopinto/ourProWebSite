import { useEffect } from "react";
import type { RefObject } from "react";

/** Reveal content once, without scroll listeners or React renders on scroll. */
export default function useScrollReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;

    const elements = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let observer: IntersectionObserver | undefined;

    function reveal(element: HTMLElement) {
      element.dataset.revealState = "visible";
      observer?.unobserve(element);
    }

    function start() {
      observer?.disconnect();
      if (motionPreference.matches) {
        elements.forEach(reveal);
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) reveal(entry.target as HTMLElement);
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
      );

      elements.forEach((element) => {
        if (element.dataset.revealState === "visible") return;
        // Keep restored scroll positions and deep links immediately readable.
        if (element.getBoundingClientRect().bottom <= 0) {
          reveal(element);
          return;
        }
        element.dataset.revealState = "waiting";
        observer?.observe(element);
      });
    }

    function onFocus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-reveal]");
      if (element && root?.contains(element)) reveal(element);
    }

    start();
    root.addEventListener("focusin", onFocus);
    motionPreference.addEventListener("change", start);

    return () => {
      observer?.disconnect();
      root.removeEventListener("focusin", onFocus);
      motionPreference.removeEventListener("change", start);
      elements.forEach((element) => delete element.dataset.revealState);
    };
  }, [rootRef]);
}
