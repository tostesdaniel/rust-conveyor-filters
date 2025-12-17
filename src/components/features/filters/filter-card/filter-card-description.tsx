import { InfoIcon } from "lucide-react";

import type { PublicFilterListDTO } from "@/types/filter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CardDescription } from "@/components/ui/card";

export function FilterCardDescription({
  filter,
}: {
  filter: PublicFilterListDTO;
}) {
  if (!filter.description) {
    return (
      <CardDescription className='flex items-center gap-2 text-muted-foreground/75 italic'>
        <InfoIcon aria-hidden='true' className='h-4 w-4' />
        No description provided
      </CardDescription>
    );
  }

  const isDescriptionLong = filter.description
    ? filter.description.length > 60
    : false;

  return (
    <>
      {isDescriptionLong ? (
        <Accordion type='single' collapsible>
          <AccordionItem
            value='description'
            className='border-none shadow-[0_1px_0_0_rgba(0,0,0,1)] shadow-muted'
          >
            <AccordionTrigger className='overflow-hidden pt-0 pb-1 text-sm'>
              Expand Description
            </AccordionTrigger>
            <AccordionContent className='pb-2'>
              <CardDescription className='max-h-10 overflow-hidden text-clip'>
                {filter.description}
              </CardDescription>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <CardDescription>{filter.description}</CardDescription>
      )}
    </>
  );
}
