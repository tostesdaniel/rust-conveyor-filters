"use client";

import { FolderPlusIcon, PlusIcon } from "lucide-react";

import { useGetUserFilters } from "@/hooks/use-get-user-filters";
import { EmptyState } from "@/components/empty-state";

import { MyFilterCard as FilterCard } from "./my-filter-card";

export function MyFilters() {
  const { data: filters } = useGetUserFilters();

  if (!filters?.length) {
    return (
      <EmptyState
        Icon={FolderPlusIcon}
        title='No filters'
        description='Get started by creating a new filter.'
        label='New Filter'
        ButtonIcon={PlusIcon}
        redirectUrl='/my-filters/new-filter'
      />
    );
  }

  return (
    <ul
      role='list'
      className='mt-6 grid grid-cols-1 gap-5 sm:gap-6 min-[680px]:grid-cols-2 lg:grid-cols-3'
    >
      {filters?.map((filter) => <FilterCard key={filter.id} filter={filter} />)}
    </ul>
  );
}
