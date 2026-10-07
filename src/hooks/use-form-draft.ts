"use client";

import * as React from "react";
import {
  isExpired,
  useFormDraftStore,
  type FormDraft,
} from "@/stores/form-drafts";
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from "react-hook-form";

const SAVE_DELAY_MS = 500;

type Status = "loading" | "pending" | "active" | "cleared";

/**
 * Saves unsubmitted changes under `key` and offers them back on the next
 * visit. Pass a null key until the form holds its starting values.
 */
export function useFormDraft<T extends FieldValues, TContext, TOutput>(
  form: UseFormReturn<T, TContext, TOutput>,
  key: string | null,
) {
  const [status, setStatus] = React.useState<Status>("loading");
  const [draft, setDraft] = React.useState<FormDraft<T> | null>(null);
  const clearedRef = React.useRef(false);

  // Read once in an effect rather than subscribing, so the server render and
  // the first client render agree.
  React.useEffect(() => {
    if (!key) return;
    clearedRef.current = false;
    const { drafts, removeDraft } = useFormDraftStore.getState();
    let stored: FormDraft | null = drafts[key] ?? null;
    if (stored && isExpired(stored)) {
      removeDraft(key);
      stored = null;
    }
    setDraft(stored as FormDraft<T> | null);
    setStatus(stored ? "pending" : "active");
  }, [key]);

  // Only subscribe once the stored draft is settled, so the form's own
  // startup resets can't overwrite or delete it.
  React.useEffect(() => {
    if (!key || status !== "active") return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let latest: { values: T; isDirty: boolean } | null = null;

    const flush = () => {
      clearTimeout(timer);
      timer = undefined;
      if (!latest || clearedRef.current) return;
      const { saveDraft, removeDraft } = useFormDraftStore.getState();
      if (latest.isDirty) saveDraft(key, latest.values);
      else removeDraft(key);
      latest = null;
    };

    const unsubscribe = form.subscribe({
      formState: { values: true, isDirty: true },
      callback: ({ values, isDirty }) => {
        latest = { values, isDirty: !!isDirty };
        clearTimeout(timer);
        timer = setTimeout(flush, SAVE_DELAY_MS);
      },
    });

    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      unsubscribe();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [form, key, status]);

  const restore = React.useCallback(
    (values: T | undefined = draft?.values) => {
      if (!values) return;
      for (const name of Object.keys(values) as Path<T>[]) {
        form.setValue(name, values[name] as PathValue<T, Path<T>>, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      setDraft(null);
      setStatus("active");
    },
    [form, draft],
  );

  const discard = React.useCallback(() => {
    if (key) useFormDraftStore.getState().removeDraft(key);
    setDraft(null);
    setStatus("active");
  }, [key]);

  /** Call after a successful submit. Stops saving until the next visit. */
  const clear = React.useCallback(() => {
    clearedRef.current = true;
    if (key) useFormDraftStore.getState().removeDraft(key);
    setDraft(null);
    setStatus("cleared");
  }, [key]);

  return {
    draft: status === "pending" ? draft : null,
    restore,
    discard,
    clear,
  };
}
