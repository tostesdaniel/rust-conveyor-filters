import type { PublicFilterListDTO } from "@/types/filter";
import { CardContent } from "@/components/ui/card";
import { FilterItemsCarousel } from "@/components/features/filters/components/filter-items-carousel";

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
