import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface FormDraft<T = unknown> {
  values: T;
  savedAt: number;
  /** What the form started from when the draft was saved. */
  base?: string;
  /** Form state that lives outside the form values. */
  extra?: unknown;
}

interface FormDraftState {
  drafts: Record<string, FormDraft>;
  saveDraft: (
    key: string,
    values: unknown,
    base?: string,
    extra?: unknown,
  ) => void;
  removeDraft: (key: string) => void;
}

export function isExpired(draft: FormDraft, now = Date.now()) {
  return now - draft.savedAt > MAX_AGE_MS;
}

export const useFormDraftStore = create<FormDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      saveDraft: (key, values, base, extra) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [key]: { values, savedAt: Date.now(), base, extra },
          },
        })),
      removeDraft: (key) =>
        set((state) => {
          if (!(key in state.drafts)) return state;
          const { [key]: _removed, ...drafts } = state.drafts;
          return { drafts };
        }),
    }),
    {
      name: "form-drafts",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        drafts: Object.fromEntries(
          Object.entries(state.drafts).filter(([, draft]) => !isExpired(draft)),
        ),
      }),
    },
  ),
);
