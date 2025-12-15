import type { Metadata } from "next";
import {
  getBookmarkedFilters,
  getSharedFilters,
  getUserCategories,
  getUserCategoryHierarchy,
  getUserFiltersByCategory,
} from "@/services/queries";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getShareToken } from "@/actions/shareTokens";
import { MyFiltersHeading } from "@/components/features/my-filters/components/my-filters-heading";
import { MyFiltersTabs } from "@/components/features/my-filters/components/my-filters-tabs";

export const metadata: Metadata = {
  title: "My Filters",
  description: "View and manage your conveyor filters.",
};

export default async function MyFiltersPage() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["bookmarked-filters"],
      queryFn: async () => {
        const [data] = await getBookmarkedFilters();
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["user-filters-by-category", null],
      queryFn: async () => {
        const [data] = await getUserFiltersByCategory({ categoryId: null });
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["user-categories"],
      queryFn: async () => {
        const [data] = await getUserCategories();
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["user-category-hierarchy"],
      queryFn: async () => {
        const [data] = await getUserCategoryHierarchy();
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["share-token"],
      queryFn: async () => {
        const [data] = await getShareToken();
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["shared-filters"],
      queryFn: async () => {
        const [data] = await getSharedFilters();
        return data;
      },
    }),
  ]);

  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MyFiltersHeading />
        <MyFiltersTabs />
      </HydrationBoundary>
    </>
  );
}
