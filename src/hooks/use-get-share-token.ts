import { api } from "@/trpc/react";

export function useGetShareToken() {
  return api.shareToken.get.useQuery();
}
