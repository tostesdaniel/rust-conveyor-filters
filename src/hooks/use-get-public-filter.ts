import { api } from "@/trpc/react";

export function useGetPublicFilter(filterId?: number) {
  return api.filter.getPublic.useQuery(
    { filterId: filterId! },
    { enabled: !!filterId },
  );
}
