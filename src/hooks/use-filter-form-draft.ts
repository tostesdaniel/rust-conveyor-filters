"use client";

import * as React from "react";
import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { useFormDraft } from "@/hooks/use-form-draft";
import { useGetItems } from "@/hooks/use-get-items";
import {
  isFilterDraftStale,
  reconcileFilterDraft,
} from "@/lib/utils/filter-draft";
import type { LoadedValues } from "@/components/features/conveyor/output-container-split";

function perfectSmeltingOf(extra: unknown) {
  if (typeof extra !== "object" || extra === null) return true;
  const { perfectSmelting } = extra as { perfectSmelting?: unknown };
  return typeof perfectSmelting === "boolean" ? perfectSmelting : true;
}

export function useFilterFormDraft(
  form: UseFormReturn<CreateFilterInput, unknown, CreateFilter>,
  key: string | null,
  {
    base,
    savedCover,
    autoRestore = false,
    perfectSmelting,
    onRestore,
    onRestorePerfectSmelting,
  }: {
    base?: string;
    savedCover?: string;
    /** Restore without asking, unless the filter changed since the draft. */
    autoRestore?: boolean;
    perfectSmelting: boolean;
    onRestore: (loaded: LoadedValues) => void;
    onRestorePerfectSmelting: (on: boolean) => void;
  },
) {
  const { data: items } = useGetItems();
  const extra = React.useMemo(() => ({ perfectSmelting }), [perfectSmelting]);
  const { draft, restore, discard, clear } = useFormDraft(form, key, {
    base,
    extra,
  });
  const isStale =
    !!draft &&
    base !== undefined &&
    (items ? isFilterDraftStale(draft.base, base, items) : draft.base !== base);

  const restoreDraft = React.useCallback(() => {
    if (!draft) return;
    const { values, droppedCount } = reconcileFilterDraft(
      draft.values,
      items ?? [],
      savedCover,
    );
    onRestore({
      outputContainer: values.outputContainer ?? null,
      items: values.items,
    });
    onRestorePerfectSmelting(perfectSmeltingOf(draft.extra));
    restore(values);
    if (droppedCount > 0) {
      toast.info(
        droppedCount === 1
          ? "Left out 1 item that is no longer insertable."
          : `Left out ${droppedCount} items that are no longer insertable.`,
      );
    }
  }, [draft, items, savedCover, onRestore, onRestorePerfectSmelting, restore]);

  const autoRestoredRef = React.useRef(false);
  React.useEffect(() => {
    if (!autoRestore || autoRestoredRef.current) return;
    if (!draft || isStale || !items) return;
    autoRestoredRef.current = true;
    restoreDraft();
    const url = new URL(window.location.href);
    url.searchParams.delete("draft");
    window.history.replaceState(window.history.state, "", url);
  }, [autoRestore, draft, isStale, items, restoreDraft]);

  return {
    draft,
    isStale,
    restore: restoreDraft,
    discard,
    clear,
  };
}
