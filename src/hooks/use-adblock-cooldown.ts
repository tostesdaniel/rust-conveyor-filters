"use client";

import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

const STORAGE_KEY = "adblock-appeal-v1";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

interface AdblockAppealState {
  shownAt: number | null;
}

const INITIAL_STATE: AdblockAppealState = { shownAt: null };

/**
 * Persists when the ad-block appeal modal was last shown and exposes whether
 * the 7-day cooldown is still active. The timestamp is written on `markShown`
 * (i.e. when the modal renders), so the user sees the modal at most once per
 * 7 days regardless of how they close it.
 */
export function useAdblockCooldown() {
  const [state, setState] = useLocalStorage<AdblockAppealState>(
    STORAGE_KEY,
    INITIAL_STATE,
    { initializeWithValue: false },
  );

  const current = state ?? INITIAL_STATE;
  const inCooldown =
    current.shownAt != null && Date.now() - current.shownAt < COOLDOWN_MS;

  const markShown = useCallback(() => {
    setState({ shownAt: Date.now() });
  }, [setState]);

  return { inCooldown, markShown };
}
