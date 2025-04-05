import { logFilterEvent } from "@/actions/filterMetrics";
import { useServerActionMutation } from "@/hooks/server-action-hooks";

export const useLogFilterEvent = () => {
  const { mutateAsync, isPending } = useServerActionMutation(logFilterEvent);

  const logEvent = async (eventType: "view" | "export", filterId: number) => {
    try {
      const rateLimitResponse = await fetch("api/log-event", {
        method: "POST",
        body: JSON.stringify({ filterId, eventType }),
      });
      const { success, userId, ip } = (await rateLimitResponse.json()) as {
        success: boolean;
        userId: string;
        ip: string;
      };

      const result = await mutateAsync({
        filterId,
        eventType,
        success,
        userId,
        ip,
      });

      return result.success;
    } catch (error) {
      console.error("Error logging event:", error);
      return false;
    }
  };

  return { logEvent, isPending };
};
