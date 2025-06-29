import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BannerWrapper } from "@/components/banner-wrapper";
import { FiltersPageHeader } from "@/components/filters/filters-page-header";
import { FiltersSidebar } from "@/components/filters/sidebar/filters-sidebar";

export default function FiltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className='container py-0'>
      <BannerWrapper />
      <FiltersSidebar />
      <SidebarInset>
        <FiltersPageHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
