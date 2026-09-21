import { useState } from "react";
import { categoryMapping } from "@/utils/category-mapping";
import { trackEvent } from "@/utils/rybbit";
import { EyeIcon } from "lucide-react";

import type {
  FilterItemDTO,
  OwnerFilterDTO,
  PublicFilterListDTO,
  SharedFilterDTO,
} from "@/types/filter";
import { useLogFilterEvent } from "@/hooks/use-log-filter-event";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCategoryIcon } from "@/components/features/conveyor/category-icons";
import { RemixButton } from "@/components/features/filters/filter-card/remix-button";
import { ButtonWithIcon } from "@/components/shared/button-with-icon";
import { ItemIcon } from "@/components/shared/item-icon";

interface ViewFilterProps {
  filter: OwnerFilterDTO | SharedFilterDTO | PublicFilterListDTO;
  log?: boolean;
  variant?: "button" | "dropdown" | "icon";
  remixFilterId?: number;
}

function TriggerButton({
  variant,
  ...props
}: {
  variant: ViewFilterProps["variant"];
}) {
  return variant === "button" ? (
    <ButtonWithIcon
      type='button'
      variant='secondary'
      icon={EyeIcon}
      className='flex-1 sm:flex-none lg:flex-1 xl:flex-none'
      {...props}
    >
      Visualize
    </ButtonWithIcon>
  ) : variant === "dropdown" ? (
    <DropdownMenuItem
      nativeButton
      render={<button type='button' className='w-full' />}
      closeOnClick={false}
      {...props}
    >
      <EyeIcon />
      Visualize
    </DropdownMenuItem>
  ) : (
    <Button
      variant='ghost'
      size='icon'
      className='size-4 hover:bg-transparent hover:text-muted-foreground'
      {...props}
    >
      <EyeIcon className='size-4' />
    </Button>
  );
}

export default function ViewFilter({
  filter,
  log = false,
  variant = "button",
  remixFilterId,
}: ViewFilterProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { logEvent } = useLogFilterEvent();

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !open) {
      trackEvent("filter_viewed", { filterId: filter.id });
      if (log) {
        logEvent("view", filter.id);
      }
    }
    setOpen(newOpen);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={<TriggerButton variant={variant} />} />
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{filter.name}</DialogTitle>
            <DialogDescription>{filter.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea
            className='h-[360px]'
            viewportClassName='snap-y snap-mandatory scroll-pt-0.5'
          >
            <div className='px-4 py-0.5'>
              <ul className='grid grid-cols-5 gap-x-6 gap-y-8'>
                {filter.filterItems.map((filterItem, i) => (
                  <FilterItem key={i} filterItem={filterItem} />
                ))}
              </ul>
            </div>
          </ScrollArea>
          {remixFilterId !== undefined && (
            <div className='flex justify-end'>
              <RemixButton filterId={remixFilterId} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger render={<TriggerButton variant={variant} />} />
      <DrawerContent>
        <DrawerHeader className='pb-4 text-left'>
          <DrawerTitle>{filter.name}</DrawerTitle>
          <DrawerDescription>{filter.description}</DrawerDescription>
        </DrawerHeader>
        <ScrollArea
          className='h-[360px]'
          viewportClassName='snap-y snap-mandatory scroll-pt-0.5'
        >
          <div className='px-4 py-0.5'>
            <ul className='grid grid-cols-3 gap-x-4 gap-y-6 min-[414px]:grid-cols-4 min-[520px]:grid-cols-5'>
              {filter.filterItems.map((filterItem, i) => (
                <FilterItem key={i} filterItem={filterItem} />
              ))}
            </ul>
          </div>
        </ScrollArea>
        <DrawerFooter className='pt-4'>
          {remixFilterId !== undefined && (
            <RemixButton filterId={remixFilterId} className='w-full' />
          )}
          <DrawerClose render={<Button type='button' variant='secondary' />}>
            Close
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

const FilterItem = ({ filterItem }: { filterItem: FilterItemDTO }) => {
  const { item, category } = filterItem;
  const categoryKey = Object.keys(categoryMapping).find(
    (key) => categoryMapping[key] === category?.name,
  );
  const CategoryIcon = getCategoryIcon(categoryKey!);
  return (
    <li className='snap-start'>
      <Card className='aspect-square w-20 py-0'>
        {category ? (
          <CategoryIcon className='h-full w-full py-2' />
        ) : item ? (
          <ItemIcon
            imagePath={item.imagePath}
            version={item.iconVersion}
            size='medium'
            alt={item.name}
            width={80}
            height={80}
            unoptimized
            className='pointer-events-none object-contain p-1'
          />
        ) : null}
      </Card>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={<p className='mt-2 truncate text-sm font-medium' />}
          >
            {item?.name || category?.name}
          </TooltipTrigger>
          <TooltipContent>
            <p className='text-sm font-medium'>
              {item?.name || category?.name}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className='mt-1 text-xs font-medium text-muted-foreground'>
        <div className='flex max-w-20 justify-between'>
          <span className='flex-1'>Max:</span>{" "}
          <p className='font-semibold tracking-tighter text-primary tabular-nums'>
            {filterItem.max === 0 ? "-" : filterItem.max}
          </p>
        </div>
        <div className='flex max-w-20 justify-between'>
          <span className='flex-1'>Buffer:</span>{" "}
          <p className='font-semibold tracking-tighter text-primary tabular-nums'>
            {filterItem.buffer === 0 ? "-" : filterItem.buffer}
          </p>
        </div>
        <div className='flex max-w-20 justify-between'>
          <span className='flex-1'>Min:</span>{" "}
          <p className='font-semibold tracking-tighter text-primary tabular-nums'>
            {filterItem.min === 0 ? "-" : filterItem.min}
          </p>
        </div>
      </div>
    </li>
  );
};
