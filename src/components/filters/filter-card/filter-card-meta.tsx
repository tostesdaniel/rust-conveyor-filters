import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { cn } from "@/lib/utils";
import { CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserBadge } from "@/components/ui/user-badge";

export function FilterCardMeta({
  filter,
}: {
  filter: ConveyorFilterWithAuthor;
}) {
  const isDescriptionLong = filter.description
    ? filter.description.length > 60
    : false;

  return (
    <div
      className={cn(
        "flex items-center space-x-2",
        isDescriptionLong && "mt-0.5!",
      )}
    >
      <CardDescription>{filter.filterItems.length} items</CardDescription>
      {filter.author && (
        <>
          <Separator className='h-4' orientation='vertical' />
          <CardDescription className='flex items-center gap-x-2'>
            Created by <span className='font-bold'>{filter.author}</span>
          </CardDescription>
          {filter.badges?.map((badge) => (
            <UserBadge key={badge} type={badge} />
          ))}
        </>
      )}
    </div>
  );
}
