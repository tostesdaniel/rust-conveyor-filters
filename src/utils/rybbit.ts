/**
 * Safely track events with Rybbit analytics
 * Ensures window.rybbit and its methods are available before calling
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>,
): void {
  if (
    typeof window !== "undefined" &&
    window.rybbit &&
    typeof window.rybbit.event === "function"
  ) {
    window.rybbit.event(eventName, properties);
  }
}


