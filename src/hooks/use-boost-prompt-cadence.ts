"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "boost-prompt-v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const CLICK_SNOOZE_MS = 30 * DAY_MS;
const CONNECT_SNOOZE_MS = DAY_MS;

interface BoostPromptState {
  firstSeenDay: string;
  dismissCount: number;
  nextDueAt: number | null;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function dismissBackoffMs(dismissCount: number): number {
  if (dismissCount <= 1) return 7 * DAY_MS;
  if (dismissCount === 2) return 14 * DAY_MS;
  return 30 * DAY_MS;
}

function freshState(): BoostPromptState {
  return { firstSeenDay: todayUtc(), dismissCount: 0, nextDueAt: null };
}

function readState(): BoostPromptState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw == null ? null : JSON.parse(raw);
}

function writeState(state: BoostPromptState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function evaluateDue(): boolean {
  try {
    let state = readState();
    if (!state) {
      state = freshState();
      writeState(state);
    }
    if (state.firstSeenDay >= todayUtc()) return false;
    return state.nextDueAt == null || Date.now() >= state.nextDueAt;
  } catch {
    return false;
  }
}

function updateState(update: (state: BoostPromptState) => BoostPromptState) {
  try {
    writeState(update(readState() ?? freshState()));
  } catch {
    // Losing the backoff is fine, the session guard still holds.
  }
}

// Not useLocalStorage: it swallows read errors into the default state, and
// blocked storage has to mean "not due".
export function useBoostPromptCadence(eligible: boolean) {
  // Keyed by `eligible` so a stale answer reads as null, meaning pending.
  const [evaluated, setEvaluated] = useState<{
    eligible: boolean;
    due: boolean;
  } | null>(null);

  useEffect(() => {
    setEvaluated({ eligible, due: eligible && evaluateDue() });
  }, [eligible]);

  const due = evaluated?.eligible === eligible ? evaluated.due : null;

  const recordDismiss = useCallback(() => {
    updateState((state) => {
      const dismissCount = state.dismissCount + 1;
      return {
        ...state,
        dismissCount,
        nextDueAt: Date.now() + dismissBackoffMs(dismissCount),
      };
    });
  }, []);

  const recordClick = useCallback(() => {
    updateState((state) => ({
      ...state,
      nextDueAt: Date.now() + CLICK_SNOOZE_MS,
    }));
  }, []);

  const recordConnectClick = useCallback(() => {
    updateState((state) => ({
      ...state,
      nextDueAt: Date.now() + CONNECT_SNOOZE_MS,
    }));
  }, []);

  return { due, recordDismiss, recordClick, recordConnectClick };
}
