import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { FilterCardContent } from "@/components/filters/filter-card/filter-card-content";
import { FilterCardFooter } from "@/components/filters/filter-card/filter-card-footer";
import { FilterCardHeader } from "@/components/filters/filter-card/filter-card-header";

export function FilterCard({
  filter,
  className,
}: {
  filter: ConveyorFilterWithAuthor;
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full max-w-(--breakpoint-sm) flex-col", className)}>
      <FilterCardHeader filter={filter} />
      <FilterCardContent filter={filter} />
      <FilterCardFooter filter={filter} />
    </Card>
  );
}
