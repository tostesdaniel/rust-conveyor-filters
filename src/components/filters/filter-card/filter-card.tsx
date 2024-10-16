import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { Card } from "@/components/ui/card";
import { FilterCardContent } from "@/components/filters/filter-card/filter-card-content";
import { FilterCardFooter } from "@/components/filters/filter-card/filter-card-footer";
import { FilterCardHeader } from "@/components/filters/filter-card/filter-card-header";

export function FilterCard({ filter }: { filter: ConveyorFilterWithAuthor }) {
  return (
    <Card className='max-w-screen-sm'>
      <FilterCardHeader filter={filter} />
      <FilterCardContent filter={filter} />
      <FilterCardFooter filter={filter} />
    </Card>
  );
}
