"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";

export function useUpdatePreferences() {
  const utils = api.useUtils();

  return api.userPreferences.update.useMutation({
    onMutate: async ({ uncategorizedPosition }) => {
      await utils.userPreferences.get.cancel();
      const previous = utils.userPreferences.get.getData();
      utils.userPreferences.get.setData(undefined, (old) => ({
        userId: old?.userId ?? "",
        uncategorizedPosition,
      }));
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        utils.userPreferences.get.setData(undefined, context.previous);
      }
      toast.error(err.message || "Failed to update preference");
    },
    onSettled: () => {
      utils.userPreferences.get.invalidate();
    },
  });
}
