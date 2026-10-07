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
 * visit. Pass a null key until the form holds its starting values. `base`
 * is saved with each draft so callers can tell when the source changed.
 */
export function useFormDraft<T extends FieldValues, TContext, TOutput>(
  form: UseFormReturn<T, TContext, TOutput>,
  key: string | null,
  { base }: { base?: string } = {},
) {
  // Keyed so a new key reads as "loading" on its first render, before the
  // read effect runs.
  const [state, setState] = React.useState<{
    key: string;
    status: Status;
    draft: FormDraft<T> | null;
  } | null>(null);
  const current = key && state?.key === key ? state : null;
  const status = current?.status ?? "loading";
  const draft = current?.draft ?? null;
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
    setState({
      key,
      status: stored ? "pending" : "active",
      draft: stored as FormDraft<T> | null,
    });
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
      if (latest.isDirty) saveDraft(key, latest.values, base);
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
  }, [form, key, status, base]);

  const restore = React.useCallback(
    (values: T | undefined = draft?.values) => {
      if (!key || !values) return;
      for (const name of Object.keys(values) as Path<T>[]) {
        form.setValue(name, values[name] as PathValue<T, Path<T>>, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      setState({ key, status: "active", draft: null });
    },
    [form, key, draft],
  );

  const discard = React.useCallback(() => {
    if (!key) return;
    useFormDraftStore.getState().removeDraft(key);
    setState({ key, status: "active", draft: null });
  }, [key]);

  /** Call after a successful submit. Stops saving until the next visit. */
  const clear = React.useCallback(() => {
    clearedRef.current = true;
    if (!key) return;
    useFormDraftStore.getState().removeDraft(key);
    setState({ key, status: "cleared", draft: null });
  }, [key]);

  return {
    draft: status === "pending" ? draft : null,
    restore,
    discard,
    clear,
  };
}
