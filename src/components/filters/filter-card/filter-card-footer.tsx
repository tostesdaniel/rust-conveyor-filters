import { formatDistanceToNowStrict } from "date-fns";

import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { CardDescription, CardFooter } from "@/components/ui/card";
import { ExportConveyorFilter } from "@/components/export-conveyor-filter";
import ViewFilter from "@/components/filters/view-filter";

export function FilterCardFooter({
  filter,
}: {
  filter: ConveyorFilterWithAuthor;
}) {
  return (
    <CardFooter className='items-end justify-center min-[475px]:justify-between'>
      <div className='hidden min-[475px]:block'>
        <CardDescription>
          Created at: {formatDistanceToNowStrict(filter.createdAt)} ago
        </CardDescription>
        <CardDescription>
          Updated at: {formatDistanceToNowStrict(filter.updatedAt)} ago
        </CardDescription>
      </div>
      <div className='flex w-full items-center justify-center space-x-4 min-[475px]:block min-[475px]:w-auto'>
        <ViewFilter filter={filter} log />
        <ExportConveyorFilter
          type='button'
          filter={filter.filterItems}
          filterId={filter.id}
          log
          className='w-full min-[475px]:w-auto'
        />
      </div>
    </CardFooter>
  );
}
