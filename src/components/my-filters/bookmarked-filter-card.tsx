import Image from "next/image";

import { ConveyorFilter } from "@/types/filter";
import { BookmarkToggle } from "@/components/filters/filter-card/bookmark-toggle";
import ViewFilter from "@/components/filters/view-filter";

interface BookmarkedFilterCardProps {
  filter: ConveyorFilter;
}

export function BookmarkedFilterCard({ filter }: BookmarkedFilterCardProps) {
  return (
    <li className='col-span-1 flex min-w-[300px] rounded-md shadow-sm'>
      <div className='flex w-16 shrink-0 items-center justify-center rounded-l-md border-2 border-foreground/70 bg-card p-1.5 text-sm font-medium text-card-foreground'>
        <Image
          src={`/items/${filter.imagePath}.png`}
          alt='Collection image'
          width='64'
          height='64'
        />
      </div>
      <div className='flex flex-1 items-center justify-between rounded-r-md border-2 border-l-0 border-card-foreground/70'>
        <div className='flex-1 px-4 py-2 text-sm'>
          <p className='font-medium'>{filter.name}</p>
          <p className='text-muted-foreground'>{`${filter.filterItems.length} items`}</p>
        </div>
        <div className='pr-2'>
          <ViewFilter filter={filter} variant='icon' />
          <BookmarkToggle filterId={filter.id} initialBookmarked={true} />
        </div>
      </div>
    </li>
  );
}
