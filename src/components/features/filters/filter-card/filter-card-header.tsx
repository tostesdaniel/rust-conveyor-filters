import type { PublicFilterListDTO } from "@/types/filter";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkToggle } from "@/components/features/filters/filter-card/bookmark-toggle";
import { FilterAttribution } from "@/components/features/filters/filter-card/filter-attribution";
import { FilterCardDescription } from "@/components/features/filters/filter-card/filter-card-description";
import { FilterCardMeta } from "@/components/features/filters/filter-card/filter-card-meta";
import { FilterCardTags } from "@/components/features/filters/filter-card/filter-card-tags";
import { RemixButton } from "@/components/features/filters/filter-card/remix-button";
import { ShareButton } from "@/components/features/filters/filter-card/share-button";

export function FilterCardHeader({ filter }: { filter: PublicFilterListDTO }) {
  return (
    <CardHeader className='flex-1'>
      <div className='flex items-center justify-between'>
        <CardTitle className='overflow-hidden text-2xl text-ellipsis'>
          {filter.name}
        </CardTitle>
        <div className='-mr-3 flex items-center gap-1 self-start'>
          <ShareButton filterId={filter.id} />
          <RemixButton filterId={filter.id} iconOnly />
          <BookmarkToggle filterId={filter.id} />
        </div>
      </div>
      <FilterCardDescription filter={filter} />
      <FilterCardMeta filter={filter} />
      {filter.forkedFrom && (
        <FilterAttribution forkedFrom={filter.forkedFrom} />
      )}
      <FilterCardTags tags={filter.tags} />
    </CardHeader>
  );
}
