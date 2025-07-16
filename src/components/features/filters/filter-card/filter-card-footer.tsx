import { format, formatDistanceToNowStrict } from "date-fns";
import { ArrowBigUpDashIcon, ClockFadingIcon } from "lucide-react";

import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { cn } from "@/lib/utils";
import { CardDescription, CardFooter } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExportConveyorFilter } from "@/components/export-conveyor-filter";
import ViewFilter from "@/components/features/filters/components/view-filter";

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
        <Tooltip>
          <TooltipTrigger asChild>
            <CardDescription className='flex items-center gap-1.5 leading-6'>
              <ClockFadingIcon
                aria-hidden='true'
                className='size-4 text-muted-foreground/75'
              />
              <span className='text-xs font-medium tracking-wide text-muted-foreground/75 uppercase'>
                Updated:
              </span>
              <span>{formatDistanceToNowStrict(filter.updatedAt)} ago</span>
            </CardDescription>
          </TooltipTrigger>
          <TooltipContent>{format(filter.updatedAt, "PPpp")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <CardDescription className='flex items-center gap-1 leading-6'>
              <ArrowBigUpDashIcon
                aria-hidden='true'
                className='-ml-0.5 size-5 text-muted-foreground/75'
              />
              <span className='text-xs font-medium tracking-wide text-muted-foreground/75 uppercase'>
                Created:
              </span>
              <span>{format(filter.createdAt, "MMM d, yyyy")}</span>
            </CardDescription>
          </TooltipTrigger>
          <TooltipContent>{format(filter.createdAt, "PPpp")}</TooltipContent>
        </Tooltip>
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
