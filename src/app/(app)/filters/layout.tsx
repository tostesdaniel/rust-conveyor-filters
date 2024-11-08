import { BannerWrapper } from "@/app/(app)/filters/banner-wrapper";

export default function FiltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BannerWrapper />
      <div className='container px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        {children}
      </div>
    </>
  );
}
