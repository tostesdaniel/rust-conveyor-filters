import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FilterCardSkeleton() {
  return (
    <Card className='max-w-screen-sm'>
      <CardHeader>
        <Skeleton className='h-6 w-3/5' />
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
      <CardFooter className='items-end justify-center min-[475px]:justify-between'>
        <div className='hidden space-y-1.5 pt-0.5 min-[475px]:block'>
          <Skeleton className='h-4 w-36' />
          <Skeleton className='h-4 w-36' />
        </div>
        <div className='min- [475px]:block flex w-full items-center justify-center  space-x-4 min-[475px]:w-auto'>
          <Skeleton className='h-9 w-full min-[475px]:w-24' />
          <Skeleton className='h-9 w-full min-[475px]:w-24' />
        </div>
      </CardFooter>
    </Card>
  );
}
