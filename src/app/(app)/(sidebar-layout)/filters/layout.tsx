import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getItems } from "@/actions/itemActions";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BannerWrapper } from "@/components/banner-wrapper";
import { FiltersPageHeader } from "@/components/filters/filters-page-header";
import { FiltersSidebar } from "@/components/filters/sidebar/filters-sidebar";

export default async function FiltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  // Prefetch items data to eliminate loading state
  await queryClient.prefetchQuery({
    queryKey: ["items"],
    queryFn: getItems,
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
