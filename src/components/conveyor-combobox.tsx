"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import type { ConveyorFilterItem } from "@/types/filter";
import { type NewConveyorItem } from "@/types/item";
import { useGetCategories } from "@/hooks/use-get-categories";
import { useGetItems } from "@/hooks/use-get-items";
import { useMediaQuery } from "@/hooks/use-media-query";
import { categoryMapping } from "@/lib/categoryMapping";
import { Item, type Category } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getCategoryIcon } from "@/components/category-icons";
import { ClearInputButton } from "@/components/my-filters/new-filter/clear-input-button";

interface ConveyorComboboxProps {
  onInsertItem: (item: NewConveyorItem) => void;
}

export function ConveyorCombobox({ onInsertItem }: ConveyorComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const TriggerButton = React.useMemo(
    () => (
      <Button
        variant='outline'
        role='combobox'
        aria-expanded={open}
        className='w-[300px] justify-between text-muted-foreground'
      >
        <div className='mr-2 flex items-center gap-x-2'>
          <Plus className='h-4 w-4 shrink-0 text-muted-foreground' />
          Insert item
        </div>
        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
      </Button>
    ),
    [open],
  );

  if (isDesktop) {
    return (
      <div className='flex items-center gap-x-3'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
          <PopoverContent className='w-fit p-0' align='start'>
            <ItemList onInsertItem={onInsertItem} />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
      <DrawerContent>
        <div className='mt-4 border-t'>
          <ItemList onInsertItem={onInsertItem} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface ItemListProps {
  onInsertItem: (item: NewConveyorItem) => void;
}

const ItemList = React.memo(({ onInsertItem }: ItemListProps) => {
  const { data: items } = useGetItems();
  const { data: categories, isSuccess: categoriesSuccess } = useGetCategories();
  const { getValues, trigger } = useFormContext();
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (search === "") {
      inputRef.current?.focus();
    }
  }, [search]);

  const insertItem = React.useCallback(
    (filterItem: Item | Category) => {
      const items: ConveyorFilterItem[] = getValues("items");
      let newItem: NewConveyorItem;
      if ("itemId" in filterItem) {
        newItem = {
          itemId: filterItem.id,
          name: filterItem.name,
          shortname: filterItem.shortname,
          category: filterItem.category,
          imagePath: filterItem.imagePath,
          max: 0,
          buffer: 0,
          min: 0,
        };
      } else {
        newItem = {
          categoryId: filterItem.id,
          name: filterItem.name,
          max: 0,
          buffer: 0,
          min: 0,
        };
      }

      const itemAlreadyExists = items.some((existingItem) => {
        return "itemId" in newItem
          ? existingItem.itemId === newItem.itemId
          : existingItem.categoryId === newItem.categoryId;
      });
      if (itemAlreadyExists) {
        return toast.error("Item already exists in conveyor");
      }

      if (items.length >= 30) {
        return toast.error("You cannot have more than 30 items");
      }

      onInsertItem(newItem);
      trigger("items");
    },
    [getValues, onInsertItem, trigger],
  );

  if (items?.data && categoriesSuccess) {
    const categorizedItems = items.data.reduce(
      (acc, item) => {
        const category = categoryMapping[item.category];
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      },
      {} as Record<string, Item[]>,
    );

    return (
      <Command shouldFilter={false}>
        <div className='relative'>
          <CommandInput
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder='Filter items...'
            className='pr-6'
          />
          {search && <ClearInputButton setSearch={setSearch} />}
        </div>
        <CommandList>
          <CommandEmpty>No items found</CommandEmpty>
          {categories.map((category) => {
            const categoryName = Object.keys(categoryMapping).find(
              (key) => categoryMapping[key] === category.name,
            );
            if (!categoryName) return null;
            const CategoryIcon = getCategoryIcon(categoryName);

            const searchLower = search.toLowerCase();
            const isCategoryMatch = Object.entries(categoryMapping).some(
              ([key, value]) => {
                return (
                  (key.toLowerCase().includes(searchLower) ||
                    value.toLowerCase().includes(searchLower)) &&
                  value === category.name
                );
              },
            );

            const hasMatchingItems =
              !isCategoryMatch &&
              categorizedItems[category.name].some((item) =>
                item.name.toLowerCase().includes(searchLower),
              );

            const showCategory = !search || isCategoryMatch || hasMatchingItems;

            if (!showCategory) return null;

            return (
              <CommandGroup key={category.id} heading={categoryName}>
                {isCategoryMatch && (
                  <CommandItem
                    onSelect={() => insertItem(category)}
                    className='mb-1'
                  >
                    <div className='-mb-2 flex w-full items-center gap-x-2 border-b pb-2 font-semibold tracking-wide [&_svg]:size-6'>
                      <CategoryIcon className='rounded-sm border border-foreground object-contain p-px' />
                      <p className='flex-1'>{category.name}</p>
                      <span className='text-end text-xs text-muted-foreground'>
                        CATEGORY
                      </span>
                    </div>
                  </CommandItem>
                )}

                {(isCategoryMatch
                  ? categorizedItems[category.name]
                  : categorizedItems[category.name].filter((item) =>
                      item.name.toLowerCase().includes(searchLower),
                    )
                ).map((item) => (
                  <CommandItem
                    key={item.id}
                    className='flex items-center gap-x-2'
                    onSelect={() => insertItem(item)}
                  >
                    <div className='relative h-6 w-6'>
                      <Image
                        src={`/items/${item.imagePath}.png`}
                        alt={item.name}
                        height={24}
                        width={24}
                        loading='lazy'
                        className='rounded-sm object-contain'
                      />
                    </div>
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    );
  }
});

ItemList.displayName = "ItemList";
