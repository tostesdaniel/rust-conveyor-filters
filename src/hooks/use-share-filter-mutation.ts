import { api } from "@/trpc/react";
import { toast } from "sonner";

interface UseShareFilterMutationProps {
  onShareSuccess: (token: string) => void;
  onTokenInvalid: (token: string) => void;
}

export function useShareFilterMutation({
  onShareSuccess,
  onTokenInvalid,
}: UseShareFilterMutationProps) {
  return api.sharedFilter.share.useMutation({
    onSuccess: (_, variables) => {
      onShareSuccess(variables.token);
      toast.success("Filter shared successfully");
    },
    onError: (error, variables) => {
      switch (error.data?.code) {
        case "BAD_REQUEST":
          toast.warning("Invalid Input", {
            description: error.message,
          });
          break;
        case "NOT_FOUND":
          toast.warning("Not Found", {
            description: error.message,
          });
          if (error.message.includes("token")) {
            onTokenInvalid(variables.token);
          }
          break;
        case "FORBIDDEN":
          toast.warning("Forbidden", {
            description: error.message,
          });
          onTokenInvalid(variables.token);
          break;
        case "CONFLICT":
          toast.warning("Conflict", {
            description: error.message,
          });
          break;
        case "INTERNAL_SERVER_ERROR":
          toast.error("Server Error", {
            description: error.message,
          });
          break;
        default:
          toast.error("Something Went Wrong", {
            description:
              "We encountered an unexpected error while sharing your filter. If the problem persists, please contact ohTostt on Discord.",
          });
      }
    },
  });
}
