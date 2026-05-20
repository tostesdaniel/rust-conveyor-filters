"use client";

import { useEffect, useState } from "react";

// NitroPay's real ads script (ads-2322.js) sets `window.nitroAds.loaded = true`
// once it executes. If a blocker stops the script, `window.nitroAds` stays the
// inline bootstrap stub from src/lib/nitro.tsx and `loaded` is never set.
const POLL_INTERVAL_MS = 500;
const MAX_WAIT_MS = 8000;

/**
 * Detects whether the visitor's ad blocker stopped NitroPay from loading.
 *
 * Catches blockers that block the script outright (uBlock Origin, uBlock Lite,
 * Brave Shields); not those that load the script but block the ad creatives
 * downstream (AdGuard). Resolves once per page load; the result is latched.
 */
export function useAdblockDetected(): boolean {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (window.nitroAds?.loaded === true) return;

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      if (window.nitroAds?.loaded === true) {
        window.clearInterval(interval);
      } else if (Date.now() - startedAt >= MAX_WAIT_MS) {
        window.clearInterval(interval);
        setBlocked(true);
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  return blocked;
}
