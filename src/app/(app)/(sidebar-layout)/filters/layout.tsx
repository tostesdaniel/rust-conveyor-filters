import { api, HydrateClient } from "@/trpc/server";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FiltersPageHeader } from "@/components/features/filters/components/filters-page-header";
import { FiltersSidebar } from "@/components/features/filters/sidebar/filters-sidebar";
import { NewFeatureBanner } from "@/components/layout/new-feature-banner";
import { FiltersFloatingLeft } from "@/components/nitro/filters-floating-left";
import { FiltersStickyStackLeft } from "@/components/nitro/filters-sticky-stack-left";
import { FiltersStickyStackRight } from "@/components/nitro/filters-sticky-stack-right";

export default async function FiltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prefetch items data to eliminate loading state
  await api.stats.getItems.prefetch();

  return (
    <>
      <NewFeatureBanner />
      <HydrateClient>
        <div className='flex items-stretch justify-center'>
          <FiltersFloatingLeft />
          <FiltersStickyStackLeft />
          <SidebarProvider className='max-w-[1400px] flex-1 px-4 min-[1600px]:max-w-screen-2xl sm:px-6 lg:px-8'>
            <FiltersSidebar />
            <SidebarInset>
              <FiltersPageHeader />
              {children}
            </SidebarInset>
          </SidebarProvider>
          <FiltersStickyStackRight />
        </div>
      </HydrateClient>
    </>
  );
}
