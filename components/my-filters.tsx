import { FilterWithItemsAndInfo } from "@/types/filter";

import { MyFilterCard as FilterCard } from "./my-filter-card";

export function MyFilters({ filters }: { filters: FilterWithItemsAndInfo[] }) {
  return (
    <ul
      role='list'
      className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4'
    >
      {filters?.map((filter) => <FilterCard key={filter.id} filter={filter} />)}
    </ul>
  );
}
