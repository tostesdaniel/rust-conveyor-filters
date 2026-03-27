import type { Metadata } from "next";

import { MyFiltersFloatingVideo } from "@/components/nitro/my-filters-floating-video";
import { MyFiltersRailLeft } from "@/components/nitro/my-filters-rail-left";
import { MyFiltersRailRight } from "@/components/nitro/my-filters-rail-right";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type MyFiltersLayoutProps = {
  children: React.ReactNode;
};

export default function MyFiltersLayout({ children }: MyFiltersLayoutProps) {
  return (
    <>
      <MyFiltersRailLeft />
      <MyFiltersRailRight />
      <MyFiltersFloatingVideo />
      <div className='container 2xl:max-w-[1280px]'>{children}</div>
    </>
  );
}
