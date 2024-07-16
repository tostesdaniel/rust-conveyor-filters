import { formatDistanceToNowStrict } from "date-fns";
import { EyeIcon } from "lucide-react";

import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { CardDescription, CardFooter } from "@/components/ui/card";
import { ExportConveyorFilter } from "@/components/export-conveyor-filter";

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
        <ButtonWithIcon
          type='button'
          variant='secondary'
          size='sm'
          icon={EyeIcon}
          title='Visualize'
          className='w-full min-[475px]:w-auto'
        />
        <ExportConveyorFilter
          type='button'
          filter={filter.filterItems}
          className='w-full min-[475px]:w-auto'
        />
      </div>
    </CardFooter>
  );
}
