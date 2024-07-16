import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { FilterCardDescription } from "@/components/filters/filter-card/filter-card-description";
import { FilterCardMeta } from "@/components/filters/filter-card/filter-card-meta";

export function FilterCardHeader({
  filter,
}: {
  filter: ConveyorFilterWithAuthor;
}) {
  return (
    <CardHeader>
      <CardTitle>{filter.name}</CardTitle>
      <FilterCardDescription filter={filter} />
      <FilterCardMeta filter={filter} />
    </CardHeader>
  );
}
