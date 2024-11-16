import { useState } from "react";
import Image from "next/image";
import { EyeIcon } from "lucide-react";

import type { ConveyorFilter, ConveyorFilterItem } from "@/types/filter";
import { useLogFilterEvent } from "@/hooks/use-log-filter-event";
import { useMediaQuery } from "@/hooks/use-media-query";
import { categoryMapping } from "@/lib/categoryMapping";
import { Button } from "@/components/ui/button";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
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
import { getCategoryIcon } from "@/components/category-icons";

interface ViewFilterProps {
  filter: ConveyorFilter;
  log?: boolean;
  variant?: "button" | "dropdown" | "icon";
}

export default function ViewFilter({
  filter,
  log = false,
  variant = "button",
}: ViewFilterProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { logEvent } = useLogFilterEvent();

  const handleOpenChange = () => {
    if (log) {
      logEvent("view", filter.id);
    }
    setOpen(!open);
  };

  const TriggerButton = ({ ...props }) => {
    return variant === "button" ? (
      <ButtonWithIcon
        type='button'
        variant='secondary'
        size='sm'
        icon={EyeIcon}
        className='w-full min-[475px]:w-auto'
        {...props}
      >
        Visualize
      </ButtonWithIcon>
    ) : variant === "dropdown" ? (
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
        }}
        {...props}
      >
        <EyeIcon />
        Visualize
      </DropdownMenuItem>
    ) : (
      <Button
        variant='ghost'
        size='icon'
        className='h-4 w-4 hover:bg-transparent hover:text-muted-foreground'
        {...props}
      >
        <EyeIcon className='h-4 w-4' />
      </Button>
    );
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <TriggerButton />
        </DialogTrigger>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{filter.name}</DialogTitle>
            <DialogDescription>{filter.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea
            className='h-[360px]'
            viewportClassName='snap-y snap-mandatory'
          >
            <div className='px-4'>
              <ul role='list' className='grid grid-cols-5 gap-x-6 gap-y-8'>
                {filter.filterItems.map((filterItem, i) => (
                  <FilterItem key={i} filterItem={filterItem} />
                ))}
              </ul>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <TriggerButton />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className='text-left'>
          <DrawerTitle>{filter.name}</DrawerTitle>
          <DrawerDescription>{filter.description}</DrawerDescription>
        </DrawerHeader>
        <ScrollArea
          className='h-[360px]'
          viewportClassName='snap-y snap-mandatory'
        >
          <div className='px-4'>
            <ul
              role='list'
              className='grid grid-cols-3 gap-x-4 gap-y-6 min-[414px]:grid-cols-4 min-[520px]:grid-cols-5'
            >
              {filter.filterItems.map((filterItem, i) => (
                <FilterItem key={i} filterItem={filterItem} />
              ))}
            </ul>
          </div>
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button type='button' variant='secondary' size='sm'>
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

const FilterItem = ({ filterItem }: { filterItem: ConveyorFilterItem }) => {
  const { item, category } = filterItem;
  const categoryKey = Object.keys(categoryMapping).find(
    (key) => categoryMapping[key] === category?.name,
  );
  const CategoryIcon = getCategoryIcon(categoryKey!);
  return (
    <li className='snap-start'>
      <Card className='aspect-square w-20'>
        {category ? (
          <CategoryIcon className='h-full w-full object-cover py-2' />
        ) : item ? (
          <Image
            src={`/items/${item.imagePath}.png`}
            alt={item.name}
            width={80}
            height={80}
            className='pointer-events-none object-contain p-1'
          />
        ) : null}
      </Card>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className='mt-2 truncate text-sm font-medium'>
              {item?.name || category?.name}
            </p>
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
          <p className='font-semibold tabular-nums tracking-tighter text-primary'>
            {filterItem.max === 0 ? "-" : filterItem.max}
          </p>
        </div>
        <div className='flex max-w-20 justify-between'>
          <span className='flex-1'>Buffer:</span>{" "}
          <p className='font-semibold tabular-nums tracking-tighter text-primary'>
            {filterItem.buffer === 0 ? "-" : filterItem.buffer}
          </p>
        </div>
        <div className='flex max-w-20 justify-between'>
          <span className='flex-1'>Min:</span>{" "}
          <p className='font-semibold tabular-nums tracking-tighter text-primary'>
            {filterItem.min === 0 ? "-" : filterItem.min}
          </p>
        </div>
      </div>
    </li>
  );
};
