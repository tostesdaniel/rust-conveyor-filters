import { Suspense } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { FiltersSidebarContent } from "@/components/features/filters/sidebar/filters-sidebar-content";
import { FiltersSidebarHeader } from "@/components/features/filters/sidebar/filters-sidebar-header";
import { SearchBar } from "@/components/features/filters/sidebar/search-bar";
import { SidebarDonateCard } from "@/components/features/filters/sidebar/sidebar-donate-card";

export function FiltersSidebar() {
  return (
    <Sidebar
      className='sticky top-0 hidden h-svh bg-transparent md:flex'
      collapsible='none'
    >
      <SidebarHeader>
        <FiltersSidebarHeader />
        <SidebarGroup className='py-0'>
          <SidebarGroupContent className='shrink-0'>
            <Suspense fallback={<SidebarMenuSkeleton showIcon />}>
              <SearchBar />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent className='*:data-[slot=sidebar-group]:py-0'>
        <FiltersSidebarContent />
        <SidebarGroup className='px-3 pt-2'>
          <SidebarGroupContent>
            <SidebarDonateCard />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
