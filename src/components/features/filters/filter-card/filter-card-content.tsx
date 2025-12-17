import type { PublicFilterListDTO } from "@/types/filter";
import { CardContent } from "@/components/ui/card";
import { FilterItemsCarousel } from "@/components/features/filters/components/filter-items-carousel";

/**
 * Render card content that displays a carousel of filter items from a public filter.
 *
 * @param filter - The public filter whose `filterItems` are rendered in the carousel.
 * @returns The CardContent element containing a FilterItemsCarousel populated with `filter.filterItems`.
 */
export function FilterCardContent({
  filter,
}: {
  filter: PublicFilterListDTO;
}) {
  return (
    <CardContent className='pb-0'>
      <FilterItemsCarousel filterItems={filter.filterItems} />
    </CardContent>
  );
}