import { api } from "@/trpc/server";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FiltersPageHeader } from "@/components/features/filters/components/filters-page-header";
import { FiltersSidebar } from "@/components/features/filters/sidebar/filters-sidebar";
import { BannerWrapper } from "@/components/layout/banner-wrapper";

export default async function FiltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  // Prefetch items data to eliminate loading state
  await queryClient.prefetchQuery({
    queryKey: [["stats", "getItems"], { type: "query" }],
    queryFn: async () => await api.stats.getItems(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider className='mx-auto max-w-[1400px] px-4 min-[1600px]:max-w-screen-2xl sm:px-6 lg:px-8'>
        <FiltersSidebar />
        <SidebarInset>
          <BannerWrapper />
          <FiltersPageHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
