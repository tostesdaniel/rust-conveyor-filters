import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { FiltersSidebarContent } from "@/components/filters/sidebar/filters-sidebar-content";
import { FiltersSidebarHeader } from "@/components/filters/sidebar/filters-sidebar-header";
import { SearchBar } from "@/components/filters/sidebar/search-bar";

export function FiltersSidebar() {
  return (
    <Sidebar
      className='sticky top-0 hidden bg-transparent md:flex'
      collapsible='none'
    >
      <SidebarHeader>
        <FiltersSidebarHeader />
        <SidebarGroup className='py-0'>
          <SidebarGroupContent className='shrink-0'>
            <SearchBar />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <FiltersSidebarContent />
      </SidebarContent>
    </Sidebar>
  );
}
