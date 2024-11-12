import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkToggle } from "@/components/filters/filter-card/bookmark-toggle";
import { FilterCardDescription } from "@/components/filters/filter-card/filter-card-description";
import { FilterCardMeta } from "@/components/filters/filter-card/filter-card-meta";

export function FilterCardHeader({
  filter,
}: {
  filter: ConveyorFilterWithAuthor;
}) {
  return (
    <CardHeader className='flex-1'>
      <div className='flex items-center justify-between'>
        <CardTitle>{filter.name}</CardTitle>
        <BookmarkToggle filterId={filter.id} />
      </div>
      <FilterCardDescription filter={filter} />
      <FilterCardMeta filter={filter} />
    </CardHeader>
  );
}
