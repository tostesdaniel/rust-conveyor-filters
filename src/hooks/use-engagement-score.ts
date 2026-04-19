"use client";

import { useCallback, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";

import {
  ACTION_DEBOUNCE_MS,
  BANNER_INITIAL_THRESHOLD,
  BANNER_STEP,
  ENGAGEMENT_ACTIONS,
  MODAL_INITIAL_THRESHOLD,
  MODAL_STEP,
  PROMPT_DISMISS_COOLDOWN_MS,
  type EngagementAction,
} from "@/lib/engagement/actions";

const STORAGE_KEY = "engagement-score-v1";

interface EngagementState {
  score: number;
  lastSessionDay: string | null;
  lastBannerShownAtScore: number | null;
  bannerDismissedAt: number | null;
  lastModalShownAtScore: number | null;
  modalDismissedAt: number | null;
  modalSuppressed: boolean;
}

const INITIAL_STATE: EngagementState = {
  score: 0,
  lastSessionDay: null,
  lastBannerShownAtScore: null,
  bannerDismissedAt: null,
  lastModalShownAtScore: null,
  modalDismissedAt: null,
  modalSuppressed: false,
};

// Module-level guards so a surface that mounted in the current session does
// not keep re-rendering on every navigation. They reset on full reload.
// A surface that was shown but never dismissed will reappear next session at
// the same threshold; dismissing advances the threshold and starts cooldown.
let bannerShownThisSession = false;
let modalShownThisSession = false;

// A surface only "advances" once it's been dismissed. Plain renders (which set
// lastShownAtScore) without a dismiss should not push the next threshold out.
function nextBannerThreshold(state: EngagementState): number {
  if (state.bannerDismissedAt == null || state.lastBannerShownAtScore == null) {
    return BANNER_INITIAL_THRESHOLD;
  }
  return state.lastBannerShownAtScore + BANNER_STEP;
}

function nextModalThreshold(state: EngagementState): number {
  if (state.modalDismissedAt == null || state.lastModalShownAtScore == null) {
    return MODAL_INITIAL_THRESHOLD;
  }
  return state.lastModalShownAtScore + MODAL_STEP;
}

function pastCooldown(dismissedAt: number | null): boolean {
  if (dismissedAt == null) return true;
  return Date.now() - dismissedAt >= PROMPT_DISMISS_COOLDOWN_MS;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useEngagementScore() {
  const [state, setState] = useLocalStorage<EngagementState>(
    STORAGE_KEY,
    INITIAL_STATE,
    { initializeWithValue: false },
  );

  const lastActionAtRef = useRef<Record<string, number>>({});

  const trackAction = useCallback(
    (action: EngagementAction) => {
      const now = Date.now();
      const last = lastActionAtRef.current[action] ?? 0;
      if (now - last < ACTION_DEBOUNCE_MS) return;
      lastActionAtRef.current[action] = now;

      setState((prev) => {
        const current = prev ?? INITIAL_STATE;

        if (action === "session") {
          const today = todayUtc();
          if (current.lastSessionDay === today) return current;
          return {
            ...current,
            score: current.score + ENGAGEMENT_ACTIONS.session.weight,
            lastSessionDay: today,
          };
        }

        return {
          ...current,
          score: current.score + ENGAGEMENT_ACTIONS[action].weight,
        };
      });
    },
    [setState],
  );

  const markBannerShown = useCallback(() => {
    bannerShownThisSession = true;
  }, []);

  const dismissBanner = useCallback(() => {
    bannerShownThisSession = true;
    setState((prev) => {
      const current = prev ?? INITIAL_STATE;
      return {
        ...current,
        lastBannerShownAtScore: current.score,
        bannerDismissedAt: Date.now(),
      };
    });
  }, [setState]);

  const markModalShown = useCallback(() => {
    modalShownThisSession = true;
  }, []);

  const dismissModal = useCallback(() => {
    modalShownThisSession = true;
    setState((prev) => {
      const current = prev ?? INITIAL_STATE;
      return {
        ...current,
        lastModalShownAtScore: current.score,
        modalDismissedAt: Date.now(),
      };
    });
  }, [setState]);

  const suppressModalForever = useCallback(() => {
    modalShownThisSession = true;
    setState((prev) => {
      const current = prev ?? INITIAL_STATE;
      return {
        ...current,
        modalSuppressed: true,
        modalDismissedAt: Date.now(),
      };
    });
  }, [setState]);

  const current = state ?? INITIAL_STATE;

  const modalDue =
    !modalShownThisSession &&
    !current.modalSuppressed &&
    current.score >= nextModalThreshold(current) &&
    pastCooldown(current.modalDismissedAt);

  const bannerDue =
    !bannerShownThisSession &&
    !modalShownThisSession &&
    !modalDue &&
    current.score >= nextBannerThreshold(current) &&
    pastCooldown(current.bannerDismissedAt);

  return {
    score: current.score,
    bannerDue,
    modalDue,
    trackAction,
    markBannerShown,
    dismissBanner,
    markModalShown,
    dismissModal,
    suppressModalForever,
  };
}
