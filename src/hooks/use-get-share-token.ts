import { getShareToken } from "@/actions/shareTokens";

import { useServerActionQuery } from "./server-action-hooks";

export function useGetShareToken() {
  return useServerActionQuery(getShareToken, {
    queryKey: ["share-token"],
    input: undefined,
  });
}
