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
    <SidebarProvider className='mx-auto max-w-[1400px] px-4 min-[1600px]:max-w-screen-2xl sm:px-6 lg:px-8'>
      <FiltersSidebar />
      <SidebarInset>
        <BannerWrapper />
        <FiltersPageHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
