import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FilterCardSkeleton() {
  return (
    <Card className='flex h-full max-w-(--breakpoint-sm) flex-col'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-6 w-3/5' />
          <div className='flex items-center gap-1.5'>
            <Skeleton className='size-5 rounded-md' />
            <Skeleton className='size-5 rounded-md' />
            <Skeleton className='size-5 rounded-md' />
          </div>
        </div>
        <Skeleton className='h-5 w-1/2' />
        <Skeleton className='h-5 w-2/5' />
      </CardHeader>
      <CardContent className='pb-0'>
        <div className='overflow-hidden'>
          <div className='-ml-4 flex'>
            {[...Array(6)].map((_, i) => (
              <div
                className='min-w-0 shrink-0 grow-0 basis-1/3 pl-4 min-[360px]:basis-1/4 min-[440px]:basis-1/5 min-[550px]:basis-1/6'
                key={i}
              >
                <Card className='p-1'>
                  <CardContent className='aspect-square'>
                    <Skeleton className='rounded-lg' />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
        <div className='flex justify-center py-2'>
          <Skeleton className='h-5 w-36' />
        </div>
      </CardContent>
      <CardFooter className='flex-col gap-3 sm:flex-row sm:justify-between lg:flex-col xl:flex-row'>
        <div className='space-y-1.5 self-start pt-0.5'>
          <Skeleton className='h-4 w-36' />
          <Skeleton className='h-4 w-36' />
        </div>
        <div className='flex w-full gap-2 sm:w-auto lg:w-full xl:w-auto'>
          <Skeleton className='h-9 flex-1 sm:w-24 sm:flex-none lg:flex-1 xl:w-24 xl:flex-none' />
          <Skeleton className='h-9 flex-1 sm:w-24 sm:flex-none lg:flex-1 xl:w-24 xl:flex-none' />
        </div>
      </CardFooter>
    </Card>
  );
}
