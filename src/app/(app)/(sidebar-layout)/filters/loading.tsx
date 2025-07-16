import { FilterCardSkeleton } from "@/components/features/filters/filter-card/filter-card-skeleton";

export default function FiltersLoading() {
  return (
    <div className='grid grid-cols-1 gap-4 py-6 lg:grid-cols-2 lg:pb-16'>
      <FilterCardSkeleton />
      <FilterCardSkeleton />
      <FilterCardSkeleton />
      <FilterCardSkeleton />
      <FilterCardSkeleton />
      <FilterCardSkeleton />
    </div>
  );
}
