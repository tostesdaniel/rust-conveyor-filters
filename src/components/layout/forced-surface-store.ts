import { useSyncExternalStore } from "react";

let forced = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSurfaceForced(next: boolean) {
  if (forced === next) return;
  forced = next;
  listeners.forEach((listener) => listener());
}

export function useSurfaceForced(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => forced,
    () => false,
  );
}
