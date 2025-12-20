import { api, HydrateClient } from "@/trpc/server";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FiltersPageHeader } from "@/components/features/filters/components/filters-page-header";
import { FiltersSidebar } from "@/components/features/filters/sidebar/filters-sidebar";
import { BannerWrapper } from "@/components/layout/banner-wrapper";

export default async function FiltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prefetch items data to eliminate loading state
  await api.stats.getItems.prefetch();

  return (
    <HydrateClient>
      <SidebarProvider className='mx-auto max-w-[1400px] px-4 min-[1600px]:max-w-screen-2xl sm:px-6 lg:px-8'>
        <FiltersSidebar />
        <SidebarInset>
          <BannerWrapper />
          <FiltersPageHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </HydrateClient>
  );
}
