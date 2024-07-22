"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { type ItemWithFields, type NewConveyorItem } from "@/types/item";
import { useGetItems } from "@/hooks/use-get-items";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Item } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
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
  const { getValues, trigger } = useFormContext();
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (search === "") {
      inputRef.current?.focus();
    }
  }, [search]);

  const insertItem = React.useCallback(
    (item: Item) => {
      const items: ItemWithFields[] = getValues("items");

      const newItem = {
        id: item.id,
        itemId: item.itemId,
        name: item.name,
        imagePath: item.imagePath,
        shortname: item.shortname,
        max: 0,
        buffer: 0,
        min: 0,
      };

      const itemAlreadyExists = items.some(
        (item) => item.itemId === newItem.itemId,
      );

      if (itemAlreadyExists) {
        return toast.error("Item already exists in conveyor");
      }

      if (items.length >= 30) {
        return toast.error("You cannot have more than 30 items");
      }

      onInsertItem(newItem);
      trigger("items");
      setSearch("");
    },
    [getValues, onInsertItem, trigger],
  );

  if (items?.success) {
    return (
      <Command>
        <CommandInput
          ref={inputRef}
          value={search}
          onValueChange={setSearch}
          placeholder='Filter items...'
        />
        <CommandList>
          <CommandEmpty>No items found</CommandEmpty>
          {items ? (
            items.data?.map((item) => (
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
            ))
          ) : (
            <p>Loading...</p>
          )}
        </CommandList>
      </Command>
    );
  }
});

ItemList.displayName = "ItemList";
