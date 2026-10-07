"use client";

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
    onRestore,
  }: {
    base?: string;
    savedCover?: string;
    onRestore: (loaded: LoadedValues) => void;
  },
) {
  const { data: items } = useGetItems();
  const { draft, restore, discard, clear } = useFormDraft(form, key, { base });

  function restoreDraft() {
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
  }

  return {
    draft,
    isStale: !!draft && base !== undefined && draft.base !== base,
    restore: restoreDraft,
    discard,
    clear,
  };
}
