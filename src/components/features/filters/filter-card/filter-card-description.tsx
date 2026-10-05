import { InfoIcon } from "lucide-react";

import type { PublicFilterListDTO } from "@/types/filter";
import { CardDescription } from "@/components/ui/card";

export function FilterCardDescription({
  filter,
}: {
  filter: PublicFilterListDTO;
}) {
  if (!filter.description) {
    return (
      <CardDescription className='flex items-center gap-2 text-muted-foreground/75 italic'>
        <InfoIcon aria-hidden='true' className='size-4' />
        No description provided
      </CardDescription>
    );
  }

  return (
    <CardDescription className='line-clamp-2' title={filter.description}>
      {filter.description}
    </CardDescription>
  );
}
