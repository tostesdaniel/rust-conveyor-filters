import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getFiltersWithItems } from "@/lib/queries";
import { MyFilters } from "@/components/my-filters";
import { MyFiltersHeading } from "@/components/my-filters/my-filters-heading";

export const metadata: Metadata = {
  title: "My Filters",
  description: "View and manage your conveyor filters.",
};

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
        <MyFiltersHeading />
        <MyFilters />
      </HydrationBoundary>
    </>
  );
}
