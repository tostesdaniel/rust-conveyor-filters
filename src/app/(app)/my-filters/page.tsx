import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getFiltersWithItems } from "@/lib/queries";
import { MyFilters } from "@/components/my-filters";

export default async function MyFiltersPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["user-filters"],
    queryFn: async () => {
      const [data] = await getFiltersWithItems();
      return data;
    },
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
      <MyFilters />
      </HydrationBoundary>
    </>
  );
}
