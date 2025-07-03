import { Suspense } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { CategorySelection } from "@/components/filters/sidebar/category-selection";
import { ClearFiltersButton } from "@/components/filters/sidebar/clear-filters-button";
import { ItemsSelection } from "@/components/filters/sidebar/items-selection";
import { SearchBar } from "@/components/filters/sidebar/search-bar";

export function MobileFiltersSidebar() {
  return (
    <Sidebar collapsible='none' className='-mx-4 bg-background'>
      <SidebarContent>
        <SidebarGroup className='px-0'>
          <SidebarMenu>
            <SidebarMenuItem className='px-4'>
              <Suspense fallback={<SidebarMenuSkeleton showIcon />}>
                <SearchBar />
              </Suspense>
            </SidebarMenuItem>

            <Suspense fallback={<SidebarMenuSkeleton />}>
              <ItemsSelection />
            </Suspense>

            <Suspense fallback={<SidebarMenuSkeleton />}>
              <CategorySelection />
            </Suspense>

            <Suspense fallback={<SidebarMenuSkeleton />}>
              <ClearFiltersButton />
            </Suspense>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
