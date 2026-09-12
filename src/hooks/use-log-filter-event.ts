import { api } from "@/trpc/react";

export const useLogFilterEvent = () => {
  const { mutateAsync, isPending } = api.filter.logEvent.useMutation();

  const logEvent = async (eventType: "view" | "export", filterId: number) => {
    try {
      const result = await mutateAsync({ filterId, eventType });

      return result.success;
    } catch (error) {
      console.error("Error logging event:", error);
      return false;
    }
  };

  return { logEvent, isPending };
};
