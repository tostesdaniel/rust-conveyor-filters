import { useQueryStates, type UseQueryStatesOptions } from "nuqs";

import { searchParams, urlKeys } from "@/config/search-params";

export const useSearchParams = (
  opts?: Partial<UseQueryStatesOptions<typeof searchParams>>,
) => {
  return useQueryStates(searchParams, {
    ...opts,
    urlKeys,
  });
};
