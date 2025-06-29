import { FilterCardSkeleton } from "@/components/filters/filter-card/filter-card-skeleton";

export default function FiltersLoading() {
  return (
    <div className='lg:place-items-stretc grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2 lg:justify-between'>
      <FilterCardSkeleton />
      <FilterCardSkeleton />
      <FilterCardSkeleton />
      <FilterCardSkeleton />
      <FilterCardSkeleton />
      <FilterCardSkeleton />
    </div>
  );
}
