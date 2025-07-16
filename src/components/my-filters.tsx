"use client";

import { FolderPlusIcon, PlusIcon } from "lucide-react";

import type { ConveyorFilter } from "@/types/filter";
import { useGetUserCategoryHierarchy } from "@/hooks/use-get-user-category-hierarchy";
import { useGetUserFiltersByCategory } from "@/hooks/use-get-user-filters-by-category";
import { CategoryHeading } from "@/components/features/my-filters/categories/category-heading";
import { EmptyState } from "@/components/shared/empty-state";

import { MyFilterCard as FilterCard } from "./my-filter-card";

export function MyFilters() {
  const { data: uncategorizedFilters } = useGetUserFiltersByCategory(null);
  const { data: categories } = useGetUserCategoryHierarchy();
  const hasFilters = uncategorizedFilters?.length || categories?.length;

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
      {/* Uncategorized Filters */}
      <section className='py-6'>
        <CategoryHeading
          title='No category'
          withAction
          filters={uncategorizedFilters ?? []}
        />
        {uncategorizedFilters?.length ? (
          <FilterGrid filters={uncategorizedFilters} />
        ) : (
          <EmptyCategory />
        )}
      </section>

      {/* Category tree */}
      {categories?.map((category) => {
        return (
          <section key={category.id} className='py-6'>
            {/* Root Category | No category */}
            <CategoryHeading
              title={category.name}
              categoryId={category.id}
              canCreateSubcategory
              filters={category.filters}
            />
            {category.filters.length ? (
              <FilterGrid filters={category.filters} />
            ) : (
              <EmptyCategory />
            )}

            {/* Subcategories */}
            {category.subCategories.map((subCategory) => (
              <div
                key={subCategory.id}
                className='ml-6 border-l border-border py-6 pl-6'
              >
                <CategoryHeading
                  title={subCategory.name}
                  withAction={false}
                  categoryId={subCategory.id}
                  isSubCategory
                  filters={subCategory.filters}
                />
                {subCategory.filters.length ? (
                  <FilterGrid filters={subCategory.filters} />
                ) : (
                  <EmptyCategory />
                )}
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}

function FilterGrid({ filters }: { filters: ConveyorFilter[] }) {
  return (
    <ul
      role='list'
      className='mt-6 grid grid-cols-1 gap-5 min-[680px]:grid-cols-2 sm:gap-6 lg:grid-cols-3'
    >
      {filters.map((filter) => (
        <FilterCard key={filter.id} filter={filter} />
      ))}
    </ul>
  );
}

function EmptyCategory() {
  return (
    <p className='mt-4 text-sm text-muted-foreground'>
      No filters in this category.
    </p>
  );
}
