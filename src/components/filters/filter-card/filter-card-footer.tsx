import { formatDistanceToNowStrict } from "date-fns";

import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { cn } from "@/lib/utils";
import { CardDescription, CardFooter } from "@/components/ui/card";
import { ExportConveyorFilter } from "@/components/export-conveyor-filter";
import ViewFilter from "@/components/filters/view-filter";

export function FilterCardFooter({
  filter,
}: {
  filter: ConveyorFilterWithAuthor;
}) {
  return (
    <CardFooter
      className={cn(
        "flex-col gap-3",
        "sm:flex-row sm:justify-between",
        "lg:flex-col",
        "xl:flex-row",
      )}
    >
      <div className='self-start'>
        <CardDescription>
          Created at: {formatDistanceToNowStrict(filter.createdAt)} ago
        </CardDescription>
        <CardDescription>
          Updated at: {formatDistanceToNowStrict(filter.updatedAt)} ago
        </CardDescription>
      </div>
      <div className='flex w-full justify-center gap-2 sm:w-auto lg:w-full xl:w-auto'>
        <ViewFilter filter={filter} log />
        <ExportConveyorFilter
          type='button'
          filter={filter.filterItems}
          filterId={filter.id}
          log
          className='flex-1 sm:flex-none lg:flex-1 xl:flex-none'
        />
      </div>
    </CardFooter>
  );
}
