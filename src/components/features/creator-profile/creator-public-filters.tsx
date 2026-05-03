import type {
  CreatorPublicCategory,
  CreatorPublicHierarchy,
} from "@/data/creator-public";
import type { PublicFilterListDTO } from "@/types/filter";
import { FilterCard } from "@/components/features/filters/filter-card/filter-card";
import { Typography } from "@/components/shared/typography";

function CategorySectionTitle({
  title,
  nested,
}: {
  title: string;
  nested?: boolean;
}) {
  return (
    <h2
      className={
        nested
          ? "text-sm leading-6 font-semibold text-muted-foreground"
          : "text-lg leading-7 font-semibold tracking-tight sm:text-xl"
      }
    >
      {title}
    </h2>
  );
}

function FilterGrid({ filters }: { filters: PublicFilterListDTO[] }) {
  return (
    <ul
      role='list'
      className='mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2'
    >
      {filters.map((filter) => (
        <li key={filter.id}>
          <FilterCard filter={filter} />
        </li>
      ))}
    </ul>
  );
}

export function CreatorPublicFilters({
  hierarchy,
}: {
  hierarchy: CreatorPublicHierarchy;
}) {
  const hasUncategorized = hierarchy.uncategorized.length > 0;
  const hasCategories = hierarchy.categories.length > 0;

  if (!hasUncategorized && !hasCategories) {
    return (
      <section className='py-12'>
        <Typography variant='p' className='text-muted-foreground'>
          No public filters yet.
        </Typography>
      </section>
    );
  }

  return (
    <div className='pb-12 pt-2'>
      {hasUncategorized ? (
        <section
          id='filters-uncategorized'
          className='scroll-mt-24 border-t border-border pt-10 first:border-t-0 first:pt-0 not-first:mt-10'
        >
          <CategorySectionTitle title='No category' />
          <FilterGrid filters={hierarchy.uncategorized} />
        </section>
      ) : null}

      {hierarchy.categories.map((category: CreatorPublicCategory) => (
        <section
          key={category.id}
          id={`filters-category-${category.id}`}
          className='scroll-mt-24 border-t border-border pt-10 first:border-t-0 first:pt-0 not-first:mt-10'
        >
          <CategorySectionTitle title={category.name} />
          {category.filters.length > 0 ? (
            <FilterGrid filters={category.filters} />
          ) : null}

          {category.subCategories.map((subCategory) => (
            <div
              key={subCategory.id}
              className='mt-8 rounded-xl bg-muted/30 p-4 sm:p-5 dark:bg-muted/15'
            >
              <CategorySectionTitle title={subCategory.name} nested />
              <FilterGrid filters={subCategory.filters} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
