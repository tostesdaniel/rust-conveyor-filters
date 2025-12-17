import Image from "next/image";
import { getR2ImageUrl } from "@/utils/r2-images";

import type { PublicFilterListDTO } from "@/types/filter";
import { ExportConveyorFilter } from "@/components/features/conveyor/export-conveyor-filter";
import ViewFilter from "@/components/features/filters/components/view-filter";
import { BookmarkToggle } from "@/components/features/filters/filter-card/bookmark-toggle";

interface BookmarkedFilterCardProps {
  filter: PublicFilterListDTO;
}

export function BookmarkedFilterCard({ filter }: BookmarkedFilterCardProps) {
  return (
    <li className='col-span-1 flex min-w-[300px] rounded-md shadow-xs'>
      <div className='flex w-16 shrink-0 items-center justify-center rounded-l-md border-2 border-foreground/70 bg-card p-1.5 text-sm font-medium text-card-foreground'>
        <Image
          src={getR2ImageUrl(filter.imagePath + ".webp", "medium")}
          alt='Collection image'
          width='64'
          height='64'
          unoptimized
        />
      </div>
      <div className='flex flex-1 items-center justify-between overflow-hidden rounded-r-md border-2 border-l-0 border-card-foreground/70'>
        <div className='flex-1 overflow-hidden px-4 py-2 text-sm'>
          <p className='overflow-hidden font-medium text-ellipsis'>
            {filter.name}
          </p>
          <p className='text-muted-foreground'>{`${filter.filterItems.length} items`}</p>
        </div>
        <div className='space-x-2 pr-2'>
          <ViewFilter filter={filter} variant='icon' />
          <ExportConveyorFilter type='icon' filter={filter.filterItems} />
          <BookmarkToggle filterId={filter.id} initialBookmarked={true} />
        </div>
      </div>
    </li>
  );
}
