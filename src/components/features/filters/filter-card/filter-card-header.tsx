import type { PublicFilterListDTO } from "@/types/filter";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkToggle } from "@/components/features/filters/filter-card/bookmark-toggle";
import { FilterAttribution } from "@/components/features/filters/filter-card/filter-attribution";
import { FilterCardDescription } from "@/components/features/filters/filter-card/filter-card-description";
import { FilterCardMeta } from "@/components/features/filters/filter-card/filter-card-meta";
import { FilterCardTags } from "@/components/features/filters/filter-card/filter-card-tags";
import { OutputContainerIcon } from "@/components/features/filters/filter-card/output-container-icon";
import { RemixButton } from "@/components/features/filters/filter-card/remix-button";
import { ShareButton } from "@/components/features/filters/filter-card/share-button";

export function FilterCardHeader({ filter }: { filter: PublicFilterListDTO }) {
  return (
    <CardHeader className='grid-cols-1 content-start'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <OutputContainerIcon container={filter.outputContainer} size={28} />
          <CardTitle className='min-w-0 text-2xl wrap-break-word'>
            {filter.name}
          </CardTitle>
        </div>
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
