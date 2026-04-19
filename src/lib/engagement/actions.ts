export const ENGAGEMENT_ACTIONS = {
  filterCopy: { weight: 1 },
  bookmarkOn: { weight: 1 },
  filterCreate: { weight: 2 },
  filterEdit: { weight: 2 },
  session: { weight: 1 },
} as const satisfies Record<string, { weight: number }>;

export type EngagementAction = keyof typeof ENGAGEMENT_ACTIONS;

export const BANNER_INITIAL_THRESHOLD = 8;
export const BANNER_STEP = 15;
export const MODAL_INITIAL_THRESHOLD = 30;
export const MODAL_STEP = 50;
export const PROMPT_DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
export const ACTION_DEBOUNCE_MS = 1000;
