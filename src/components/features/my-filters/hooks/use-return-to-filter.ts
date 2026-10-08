import * as React from "react";

const MAX_WAIT_MS = 10_000;

let pending: { filterId: number; at: number } | null = null;

/** Call right before navigating back to /my-filters to bring this filter's card into view. */
export function returnToFilter(filterId: number) {
  pending = { filterId, at: Date.now() };
}

export function useScrollToReturnedFilter() {
  React.useEffect(() => {
    const target = pending;
    if (!target) return;
    const remaining = target.at + MAX_WAIT_MS - Date.now();
    if (remaining <= 0) {
      pending = null;
      return;
    }

    const selector = `[data-filter-id="${target.filterId}"]`;
    function reveal() {
      const card = document.querySelector<HTMLElement>(selector);
      if (!card) return false;
      pending = null;
      card.scrollIntoView({ block: "center" });
      card.animate(
        [
          { outline: "2px solid var(--ring)", outlineOffset: "4px" },
          { outline: "2px solid transparent", outlineOffset: "4px" },
        ],
        { duration: 1600, delay: 200, easing: "ease-in" },
      );
      return true;
    }

    if (reveal()) return;

    const observer = new MutationObserver(() => {
      if (reveal()) stop();
    });
    const timeout = setTimeout(stop, remaining);
    function stop() {
      observer.disconnect();
      clearTimeout(timeout);
    }
    observer.observe(document.body, { childList: true, subtree: true });
    return stop;
  }, []);
}
