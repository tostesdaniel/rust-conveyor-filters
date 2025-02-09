import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function FormSkeleton() {
  return (
    <div className='space-y-6 py-6'>
      <FormItemSkeleton className={{ label: "w-10", message: "w-[400px]" }} />
      <FormItemSkeleton className={{ label: "w-20", message: "w-[550px]" }} />
      <ImageComboboxSkeleton />
      <ConveyorSkeleton className={{ label: "w-20" }} />
      <Skeleton className='h-10 w-[120px]' />
    </div>
  );
}

function FormItemSkeleton({
  className,
}: {
  className: { label: string; message: string };
}) {
  return (
    <div className='space-y-2'>
      <Skeleton className={cn("h-[17px]", className.label)} />
      <Skeleton className='h-10 w-full' />
      <Skeleton className={cn("h-3.5", className.message)} />
    </div>
  );
}

function ImageComboboxSkeleton() {
  return (
    <div className='space-y-2'>
      <Skeleton className='h-[17px] w-20' />
      <div className='flex items-center gap-x-3'>
        <Skeleton className='h-10 w-10' />
        <Skeleton className='h-10 w-[300px]' />
      </div>
    </div>
  );
}

function ConveyorSkeleton({ className }: { className: { label: string } }) {
  return (
    <div className='space-y-2'>
      <Skeleton className={cn("h-[17px]", className.label)} />
      <Skeleton className='h-3.5 w-[370px]' />
      <Skeleton className='h-[300px] w-full' />
    </div>
  );
}
