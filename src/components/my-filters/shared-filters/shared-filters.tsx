import type { ConveyorFilter } from "@/types/filter";
import { useGetSharedFilters } from "@/hooks/useGetSharedFilters";
import { cn } from "@/lib/utils";
import { MyFilterCard as FilterCard } from "@/components/my-filter-card";

import { CategoryHeading } from "../categories/category-heading";

export function SharedFilters() {
  const { data: sharedFilters } = useGetSharedFilters();

  if (!sharedFilters) return null;

  return sharedFilters.map(
    ({ senderUsername, uncategorizedFilters, categories }, index) => (
      <section
        className={cn(
          "my-6",
          index % 2 !== 0 && "mt-12 border-t-2 border-primary pt-12",
        )}
        key={`${senderUsername}-${index}`}
      >
        <h2 className='mb-4 text-xl font-bold tracking-tight text-primary'>
          <span className='sr-only'>Filters shared by </span>
          <span aria-hidden='true' className='text-secondary-foreground/85'>
            Shared by{" "}
          </span>
          <span className='underline decoration-primary/30 decoration-2'>
            {senderUsername}
          </span>
        </h2>

        {uncategorizedFilters.length > 0 && (
          <section
            key={`${senderUsername}'s-uncategorized-filters`}
            className='my-6'
          >
            <CategoryHeading
              title='No category'
              filters={uncategorizedFilters}
            />
            <FilterGrid filters={uncategorizedFilters} />
          </section>
        )}

        {categories.map(({ id, name, filters, subCategories }) => (
          <section key={`${senderUsername}'s-category-${id}`} className='my-6'>
            <CategoryHeading title={name} filters={filters} />
            {filters.length > 0 ? (
              <FilterGrid filters={filters} />
            ) : (
              <EmptyCategory />
            )}

            {subCategories.map(({ id, name, filters }) => (
              <div
                key={`${senderUsername}'s-subcategory-${id}`}
                className='ml-6 border-l border-border py-6 pl-6'
              >
                <CategoryHeading title={name} filters={filters} />
                <FilterGrid filters={filters} />
              </div>
            ))}
          </section>
        ))}
      </section>
    ),
  );
}

function FilterGrid({ filters }: { filters: ConveyorFilter[] }) {
  return (
    <ul
      role='list'
      className='mt-6 grid grid-cols-1 gap-5 sm:gap-6 min-[680px]:grid-cols-2 lg:grid-cols-3'
    >
      {filters.map((filter) => (
        <FilterCard key={filter.id} filter={filter} isFilterShared />
      ))}
    </ul>
  );
}

function EmptyCategory() {
  return (
    <p className='mb-6 mt-4 text-sm text-muted-foreground'>
      No filters in this category.
    </p>
  );
}
