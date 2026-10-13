"use client";

import * as React from "react";

/** Asks the browser to confirm before closing or reloading the tab. */
export function useBeforeUnloadWarning(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled]);
}
