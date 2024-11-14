import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getBookmarkedFilters } from "@/actions/bookmark-filter";
import {
  getUserCategories,
  getUserCategoryHierarchy,
} from "@/actions/categoryActions";
import { getUserFiltersByCategory } from "@/lib/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedFilters } from "@/components/filters/saved-filters";
import { MyFilters } from "@/components/my-filters";
import { MyFiltersHeading } from "@/components/my-filters/my-filters-heading";

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
  ]);

  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MyFiltersHeading />
        <Tabs defaultValue='your-filters' className='mt-4'>
          <TabsList>
            <TabsTrigger value='your-filters'>Your Filters</TabsTrigger>
            <TabsTrigger value='saved-filters'>Saved Filters</TabsTrigger>
          </TabsList>
          <TabsContent value='your-filters'>
            <MyFilters />
          </TabsContent>
          <TabsContent value='saved-filters'>
            <SavedFilters />
          </TabsContent>
        </Tabs>
      </HydrationBoundary>
    </>
  );
}
