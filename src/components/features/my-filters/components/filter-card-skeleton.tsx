import { EllipsisVerticalIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export function FilterCardSkeleton() {
  return (
    <div className='col-span-1 flex min-w-[300px]'>
      <div>
        <Skeleton className='flex h-16 w-16 items-center justify-center rounded-md rounded-tr-none rounded-br-none border-2 bg-transparent p-1.5'>
          <Skeleton className='h-full w-full rounded-sm' />
        </Skeleton>
      </div>
      <Skeleton className='flex flex-1 items-center justify-between rounded-l-none border-2 border-l-0 bg-transparent'>
        <div className='space-y-2 px-4'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-14' />
        </div>
        <div className='pr-2'>
          <div className='flex h-8 w-8 items-center justify-center'>
            <EllipsisVerticalIcon className='h-5 w-5 animate-pulse text-muted' />
          </div>
        </div>
      </Skeleton>
    </div>
  );
}
