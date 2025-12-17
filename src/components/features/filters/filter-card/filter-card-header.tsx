import type { PublicFilterListDTO } from "@/types/filter";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkToggle } from "@/components/features/filters/filter-card/bookmark-toggle";
import { FilterCardDescription } from "@/components/features/filters/filter-card/filter-card-description";
import { FilterCardMeta } from "@/components/features/filters/filter-card/filter-card-meta";
import { ShareButton } from "@/components/features/filters/filter-card/share-button";

/**
 * Renders the header section for a filter card, including the title, share and bookmark actions, description, and metadata.
 *
 * @param filter - Public filter data used to populate the card title, action buttons, description, and metadata
 * @returns The CardHeader element for the provided filter
 */
export function FilterCardHeader({
  filter,
}: {
  filter: PublicFilterListDTO;
}) {
  return (
    <CardHeader className='flex-1'>
      <div className='flex items-center justify-between'>
        <CardTitle className='overflow-hidden text-2xl text-ellipsis'>
          {filter.name}
        </CardTitle>
        <div className='flex items-center gap-2 self-start'>
          <ShareButton filterId={filter.id} />
          <BookmarkToggle filterId={filter.id} />
        </div>
      </div>
      <FilterCardDescription filter={filter} />
      <FilterCardMeta filter={filter} />
    </CardHeader>
  );
}