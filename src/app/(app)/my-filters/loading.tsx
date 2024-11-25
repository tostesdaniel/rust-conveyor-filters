import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { FilterCardSkeleton } from "@/components/my-filters/filter-card-skeleton";

function CategoryHeadingSkeleton({ withAction = false }) {
  return (
    <div className='border-b border-border pb-5 sm:flex sm:items-center sm:justify-between'>
      <Skeleton className='h-6 w-32' />
      {withAction && (
        <div className='mt-3 sm:ml-4 sm:mt-0'>
          <Skeleton className='h-9 w-32' />
        </div>
      )}
    </div>
  );
}

export default function MyFiltersLoading() {
  return (
    <>
      <div className='md:flex md:items-center md:justify-between'>
        <Typography variant='h1'>My Filters</Typography>
        <Skeleton className='mt-4 h-9 w-28 md:mt-0' />
      </div>

      <Tabs defaultValue='your-filters' className='mt-4'>
        <TabsList>
          <TabsTrigger disabled value='your-filters'>
            Your Filters
          </TabsTrigger>
          <TabsTrigger disabled value='saved-filters'>
            Saved Filters
          </TabsTrigger>
        </TabsList>

        {/* Uncategorized Filters Section */}
        <section className='py-8'>
          <CategoryHeadingSkeleton withAction />
          <div className='mt-6 grid grid-cols-1 gap-5 sm:gap-6 min-[680px]:grid-cols-2 lg:grid-cols-3'>
            {[...Array(2)].map((_, i) => (
              <FilterCardSkeleton key={`uncategorized-${i}`} />
            ))}
          </div>
        </section>

        {/* Categories Sections */}
        {[...Array(2)].map((_, categoryIndex) => (
          <section key={`category-${categoryIndex}`} className='py-6'>
            <CategoryHeadingSkeleton />
            <div className='mt-6 grid grid-cols-1 gap-5 sm:gap-6 min-[680px]:grid-cols-2 lg:grid-cols-3'>
              {[...Array(2)].map((_, i) => (
                <FilterCardSkeleton key={`category-${categoryIndex}-${i}`} />
              ))}
            </div>

            {/* Subcategory */}
            <div className='ml-6 border-l border-border py-6 pl-6'>
              <CategoryHeadingSkeleton />
              <div className='mt-6 grid grid-cols-1 gap-5 sm:gap-6 min-[680px]:grid-cols-2 lg:grid-cols-3'>
                {[...Array(2)].map((_, i) => (
                  <FilterCardSkeleton
                    key={`subcategory-${categoryIndex}-${i}`}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}
      </Tabs>
    </>
  );
}
