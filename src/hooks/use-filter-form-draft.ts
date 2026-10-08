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
import { reconcileFilterDraft } from "@/lib/utils/filter-draft";
import type { LoadedValues } from "@/components/features/conveyor/output-container-split";

export function useFilterFormDraft(
  form: UseFormReturn<CreateFilterInput, unknown, CreateFilter>,
  key: string | null,
  {
    base,
    savedCover,
    autoRestore = false,
    onRestore,
  }: {
    base?: string;
    savedCover?: string;
    /** Restore without asking, unless the filter changed since the draft. */
    autoRestore?: boolean;
    onRestore: (loaded: LoadedValues) => void;
  },
) {
  const { data: items } = useGetItems();
  const { draft, restore, discard, clear } = useFormDraft(form, key, { base });
  const isStale = !!draft && base !== undefined && draft.base !== base;

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
    restore(values);
    if (droppedCount > 0) {
      toast.info(
        droppedCount === 1
          ? "Left out 1 item that is no longer insertable."
          : `Left out ${droppedCount} items that are no longer insertable.`,
      );
    }
  }, [draft, items, savedCover, onRestore, restore]);

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
