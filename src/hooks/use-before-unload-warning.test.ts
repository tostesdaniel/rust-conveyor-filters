// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useBeforeUnloadWarning } from "./use-before-unload-warning";

function closeTab() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("useBeforeUnloadWarning", () => {
  it("blocks closing the tab while enabled", () => {
    renderHook(() => useBeforeUnloadWarning(true));

    expect(closeTab()).toBe(true);
  });

  it("lets the tab close while disabled", () => {
    renderHook(() => useBeforeUnloadWarning(false));

    expect(closeTab()).toBe(false);
  });

  it("stops blocking once disabled", () => {
    const { rerender } = renderHook(
      ({ enabled }) => useBeforeUnloadWarning(enabled),
      { initialProps: { enabled: true } },
    );

    rerender({ enabled: false });

    expect(closeTab()).toBe(false);
  });

  it("stops blocking after unmount", () => {
    const { unmount } = renderHook(() => useBeforeUnloadWarning(true));

    unmount();

    expect(closeTab()).toBe(false);
  });
});
