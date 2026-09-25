interface Rybbit {
  /**
   * Tracks a page view
   */
  pageview: () => void;

  /**
   * Tracks a custom event
   * @param name Name of the event
   * @param properties Optional properties for the event
   */
  event: (name: string, properties?: Record<string, string | number>) => void;

  /**
   * Tracks a caught error
   * @param error The error to report
   * @param properties Optional properties for the error
   */
  error: (error: Error, properties?: Record<string, string | number>) => void;

  /**
   * Sets a custom user ID for tracking logged-in users
   * @param userId The user ID to set (will be stored in localStorage)
   * @param traits Optional user metadata (email, name, custom fields)
   */
  identify: (userId: string, traits?: Record<string, unknown>) => void;

  /**
   * Updates traits for the currently identified user
   * @param traits User metadata to merge with existing traits
   */
  setTraits: (traits: Record<string, unknown>) => void;

  /**
   * Clears the stored user ID
   */
  clearUserId: () => void;

  /**
   * Gets the currently set user ID
   * @returns The current user ID or null if not set
   */
  getUserId: () => string | null;

  /**
   * Manually tracks outbound link clicks
   * @param url The URL of the outbound link
   * @param text Optional text content of the link
   * @param target Optional target attribute of the link
   */
  trackOutbound: (url: string, text?: string, target?: string) => void;

  /**
   * Runs the callback once the script has loaded its site config
   */
  onReady: (callback: (api: Rybbit) => void) => void;
}

declare global {
  interface Window {
    rybbit: Rybbit;
  }
}

export {};
