"use client";

import * as React from "react";
import { categoryMapping } from "@/utils/category-mapping";
import { searchItems } from "@/utils/item-search";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import type { ConveyorFilterItem } from "@/types/filter";
import { type NewConveyorItem } from "@/types/item";
import { MAX_FILTER_ITEMS } from "@/config/constants";
import { useGetCategories } from "@/hooks/use-get-categories";
import { useGetItems } from "@/hooks/use-get-items";
import { useMediaQuery } from "@/hooks/use-media-query";
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
import { getCategoryIcon } from "@/components/features/conveyor/category-icons";
import { ClearInputButton } from "@/components/features/my-filters/new-filter/clear-input-button";
import { ItemIcon } from "@/components/shared/item-icon";
import { SearchTipTooltip } from "@/components/shared/search-tip-tooltip";

interface ConveyorComboboxProps {
  onInsertItem: (item: NewConveyorItem) => void;
}

export function ConveyorCombobox({ onInsertItem }: ConveyorComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const listboxId = React.useId();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const TriggerButton = React.useMemo(
    () => (
      <Button
        variant='outline'
        role='combobox'
        aria-expanded={open}
        aria-controls={listboxId}
        className='w-full justify-between text-muted-foreground sm:w-[300px]'
      >
        <div className='mr-2 flex items-center gap-x-2'>
          <Plus className='text-muted-foreground' />
          Insert item
        </div>
        <ChevronsUpDown className='opacity-50' />
      </Button>
    ),
    [open, listboxId],
  );

  if (isDesktop) {
    return (
      <div className='flex items-center gap-x-3'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={TriggerButton} />
          <PopoverContent
            id={listboxId}
            className='w-fit gap-0 p-0'
            align='start'
          >
            <ItemList onInsertItem={onInsertItem} />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger render={TriggerButton} />
      <DrawerContent id={listboxId}>
        <ItemList onInsertItem={onInsertItem} />
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
  const { control, getValues, trigger } = useFormContext();
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const conveyorItems = useWatch({ control, name: "items" }) as
    | NewConveyorItem[]
    | undefined;

  const { insertedItemIds, insertedCategoryIds } = React.useMemo(() => {
    const itemIds = new Set<number>();
    const categoryIds = new Set<number>();
    for (const entry of conveyorItems ?? []) {
      if ("itemId" in entry) itemIds.add(entry.itemId);
      else categoryIds.add(entry.categoryId);
    }
    return { insertedItemIds: itemIds, insertedCategoryIds: categoryIds };
  }, [conveyorItems]);

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
          iconVersion: filterItem.iconVersion,
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

      if (items.length >= MAX_FILTER_ITEMS) {
        return toast.error(
          `You cannot have more than ${MAX_FILTER_ITEMS} items`,
        );
      }

      onInsertItem(newItem);
      trigger("items");
    },
    [getValues, onInsertItem, trigger],
  );

  if (items && categoriesSuccess) {
    const categorizedItems = items.reduce(
      (acc: Record<string, Item[]>, item: Item) => {
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
      <>
        <SearchTipTooltip />
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

              // A category hit lists the whole category, so the matcher only
              // runs when the query has to pick items out of it.
              const matches = isCategoryMatch
                ? []
                : searchItems(categorizedItems[category.name], search);

              const showCategory =
                !search || isCategoryMatch || matches.length > 0;

              if (!showCategory) return null;

              const shown = isCategoryMatch
                ? categorizedItems[category.name]
                : matches.map(({ item }) => item);

              return (
                <CommandGroup key={category.id} heading={categoryName}>
                  {isCategoryMatch && (
                    <CommandItem
                      onSelect={() => insertItem(category)}
                      data-checked={insertedCategoryIds.has(category.id)}
                      className='mb-1 gap-x-2 rounded-b-none border-b pb-2 font-semibold tracking-wide'
                    >
                      <span className='size-6 shrink-0 rounded-sm border border-foreground p-px'>
                        <CategoryIcon className='size-full' />
                      </span>
                      <p className='flex-1'>{category.name}</p>
                      <span className='text-end text-xs text-muted-foreground'>
                        CATEGORY
                      </span>
                    </CommandItem>
                  )}

                  {shown.map((item) => (
                    <CommandItem
                      key={item.id}
                      className='flex items-center gap-x-2'
                      data-checked={insertedItemIds.has(item.id)}
                      onSelect={() => insertItem(item)}
                    >
                      <div className='relative size-6'>
                        <ItemIcon
                          imagePath={item.imagePath}
                          version={item.iconVersion}
                          size='tiny'
                          alt={item.name}
                          height={24}
                          width={24}
                          loading='lazy'
                          unoptimized
                          className='rounded-sm object-contain'
                        />
                      </div>
                      <p className='min-w-0 flex-1 truncate'>{item.name}</p>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </>
    );
  }
});

ItemList.displayName = "ItemList";
