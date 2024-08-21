"use client";

import { FolderPlusIcon, PlusIcon } from "lucide-react";

import { useGetCategoriesWithOwnFilters } from "@/hooks/use-get-categories-with-items";
import { useGetUserFiltersByCategory } from "@/hooks/use-get-user-filters-by-category";
import { EmptyState } from "@/components/empty-state";
import { CategoryHeading } from "@/components/my-filters/categories/category-heading";

import { MyFilterCard as FilterCard } from "./my-filter-card";

export function MyFilters() {
  const { data: uncategorizedFilters } = useGetUserFiltersByCategory(null);
  const { data: categoriesWithOwnFilters } = useGetCategoriesWithOwnFilters();

  const hasFilters =
    uncategorizedFilters?.length || categoriesWithOwnFilters?.length;

  if (!hasFilters) {
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
    <>
      <section className='py-6'>
        <CategoryHeading title='No category' withAction />
        <ul
          role='list'
          className='mt-6 grid grid-cols-1 gap-5 sm:gap-6 min-[680px]:grid-cols-2 lg:grid-cols-3'
        >
          {uncategorizedFilters?.map((filter) => (
            <FilterCard key={filter.id} filter={filter} />
          ))}
        </ul>
      </section>
      {categoriesWithOwnFilters?.map((category) => {
        const { filters } = category;
        return (
          <section key={category.id} className='py-6'>
            <CategoryHeading
              title={category.name}
              withAction={false}
              categoryId={category.id}
            />
            <ul
              role='list'
              className='mt-6 grid grid-cols-1 gap-5 sm:gap-6 min-[680px]:grid-cols-2 lg:grid-cols-3'
            >
              {filters.map((filter) => (
                <FilterCard key={filter.id} filter={filter} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
