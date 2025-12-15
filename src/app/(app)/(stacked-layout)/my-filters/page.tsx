import type { Metadata } from "next";
import { api } from "@/trpc/server";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

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
      queryKey: [["bookmark", "getAll"], { type: "query" }],
      queryFn: async () => await api.bookmark.getAll(),
    }),
    queryClient.prefetchQuery({
      queryKey: [
        ["filter", "getByCategory"],
        { input: { categoryId: null }, type: "query" },
      ],
      queryFn: async () => await api.filter.getByCategory({ categoryId: null }),
    }),
    queryClient.prefetchQuery({
      queryKey: [["category", "getAll"], { type: "query" }],
      queryFn: async () => await api.category.getAll(),
    }),
    queryClient.prefetchQuery({
      queryKey: [["category", "getHierarchy"], { type: "query" }],
      queryFn: async () => await api.category.getHierarchy(),
    }),
    queryClient.prefetchQuery({
      queryKey: [["shareToken", "get"], { type: "query" }],
      queryFn: async () => await api.shareToken.get(),
    }),
    queryClient.prefetchQuery({
      queryKey: [["sharedFilter", "getAll"], { type: "query" }],
      queryFn: async () => await api.sharedFilter.getAll(),
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
