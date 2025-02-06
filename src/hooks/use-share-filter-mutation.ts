import { toast } from "sonner";

import { shareFilter } from "@/actions/sharedFilters";
import { validateToken } from "@/actions/shareTokens";

import { useServerActionMutation } from "./server-action-hooks";

interface ShareMutationContext {
  isTokenValid: boolean;
}

interface UseShareFilterMutationProps {
  onShareSuccess: (token: string) => void;
  onTokenInvalid: (token: string) => void;
}

export function useShareFilterMutation({
  onShareSuccess,
  onTokenInvalid,
}: UseShareFilterMutationProps) {
  return useServerActionMutation(shareFilter, {
    onMutate: async (variables) => {
      const [data, error] = await validateToken({ token: variables.token });
      if (error || !data) throw error;
      return { isTokenValid: data.valid };
    },
    onSuccess: (_, variables, context) => {
      const mutationContext = context as ShareMutationContext;
      if (mutationContext.isTokenValid) {
        onShareSuccess(variables.token);
        toast.success("Filter shared successfully");
      }
    },
    onError: (error, variables) => {
      const errorData = JSON.parse(error.data);
      switch (error.code) {
        case "INPUT_PARSE_ERROR":
          toast.warning(errorData.name, {
            description: errorData.message,
          });
          break;
        case "NOT_FOUND":
          toast.warning(errorData.name, {
            description: errorData.message,
          });
          if (errorData.name === "Invalid Share Token") {
            onTokenInvalid(variables.token);
          }
          break;
        case "FORBIDDEN":
          toast.warning(errorData.name, {
            description: errorData.message,
          });
          onTokenInvalid(variables.token);
          break;
        case "CONFLICT":
          toast.warning(errorData.name, {
            description: errorData.message,
          });
          break;
        case "INTERNAL_SERVER_ERROR":
          toast.error(errorData.name, {
            description: errorData.message,
          });
          break;
        default:
          toast.error("Something Went Wrong", {
            description:
              "We encountered an unexpected error while sharing your filter. If the problem persists, please contact ohTostt on Discord.  ",
          });
      }
    },
  });
}
