import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { FilterCardSkeleton } from "@/components/my-filters/filter-card-skeleton";

export default function MyFiltersLoading() {
  return (
    <>
      <div className='md:flex md:items-center md:justify-between'>
        <Typography variant='h1'>My Filters</Typography>
        <Skeleton className='mt-4 h-9 w-28 md:mt-0' />
      </div>
      <div className='mt-6 grid grid-cols-1 gap-5 sm:gap-6 min-[680px]:grid-cols-2 lg:grid-cols-3'>
        {[...Array(27)].map((_, i) => (
          <FilterCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
