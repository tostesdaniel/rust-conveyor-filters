import type { PublicFilterListDTO } from "@/types/filter";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { FilterCardContent } from "@/components/features/filters/filter-card/filter-card-content";
import { FilterCardFooter } from "@/components/features/filters/filter-card/filter-card-footer";
import { FilterCardHeader } from "@/components/features/filters/filter-card/filter-card-header";

/**
 * Render a card that displays a filter's header, content, and footer.
 *
 * @param filter - The filter data to render inside the card's header, content, and footer.
 * @param className - Optional additional CSS class names to apply to the card container.
 * @returns A React element representing the composed filter card.
 */
export function FilterCard({
  filter,
  className,
}: {
  filter: PublicFilterListDTO;
  className?: string;
}) {
  return (
    <Card
      className={cn("flex h-full max-w-(--breakpoint-sm) flex-col", className)}
    >
      <FilterCardHeader filter={filter} />
      <FilterCardContent filter={filter} />
      <FilterCardFooter filter={filter} />
    </Card>
  );
}