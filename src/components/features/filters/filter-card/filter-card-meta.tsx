import type { PublicFilterListDTO } from "@/types/filter";
import { cn } from "@/lib/utils";
import { CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserBadge } from "@/components/shared/user-badge";

export function FilterCardMeta({
  filter,
}: {
  filter: PublicFilterListDTO;
}) {
  const isDescriptionLong = filter.description
    ? filter.description.length > 60
    : false;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        isDescriptionLong && "mt-0.5!",
      )}
    >
      <CardDescription>{filter.filterItems.length} items</CardDescription>
      {filter.author && (
        <>
          <Separator
            className='hidden data-[orientation=vertical]:h-4 sm:block'
            orientation='vertical'
          />
          <CardDescription className='flex min-w-0 items-center gap-x-2 truncate'>
            Created by{" "}
            <span className='truncate font-bold'>{filter.author}</span>
          </CardDescription>
          <div className='flex flex-wrap gap-1.5'>
            {filter.badges?.map((badge) => (
              <UserBadge key={badge} type={badge} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
