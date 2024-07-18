import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { CardDescription } from "@/components/ui/card";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";

export function FilterCardDescription({
  filter,
}: {
  filter: ConveyorFilterWithAuthor;
}) {
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
            <AccordionTrigger className='overflow-hidden pb-1 pt-0 text-sm'>
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
