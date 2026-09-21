"use client";

import * as React from "react";
import type { CreateFilterInput } from "@/schemas/filterFormSchema";
import { ChevronsUpDown } from "lucide-react";
import { ControllerRenderProps, useFormContext } from "react-hook-form";

import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { type Item } from "@/db/schema";
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
import { FormControl } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterImage } from "@/components/features/my-filters/components/filter-image";
import { ItemIcon } from "@/components/shared/item-icon";

type SelectedImage = string;

interface FilterImageComboboxProps {
  field: ControllerRenderProps<CreateFilterInput, "imagePath">;
  items: Item[];
}

const FilterImageCombobox = React.memo(
  ({ field, items }: FilterImageComboboxProps) => {
    const [open, setOpen] = React.useState(false);
    const listboxId = React.useId();
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [selectedImage, setSelectedImage] = React.useState<SelectedImage>(
      field.value,
    );

    React.useEffect(() => {
      setSelectedImage(field.value);
    }, [field.value]);

    const selectedVersion = items.find(
      (item) => item.imagePath === selectedImage,
    )?.iconVersion;

    const handleSelect = React.useCallback(
      (imagePath: string) => {
        setSelectedImage(imagePath);
        setOpen(false);
        field.onChange(imagePath);
      },
      [field],
    );

    if (isDesktop) {
      return (
        <div className='flex items-center gap-x-3'>
          <FilterImage imagePath={selectedImage} version={selectedVersion} />
          <Popover open={open} onOpenChange={setOpen}>
            <FormControl>
              <PopoverTrigger
                render={
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    aria-controls={listboxId}
                    className={cn(
                      "w-[300px] justify-between",
                      !field.value && "text-muted-foreground",
                    )}
                  />
                }
              >
                {field.value
                  ? items.find((item) => item.imagePath === field.value)?.name
                  : "Select item"}
                <ChevronsUpDown className='opacity-50' />
              </PopoverTrigger>
            </FormControl>
            <PopoverContent id={listboxId} className='w-fit p-0' align='start'>
              <ItemList
                items={items}
                setOpen={setOpen}
                setSelectedImage={handleSelect}
                field={field}
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <div className='flex items-center gap-x-3'>
          <FilterImage imagePath={selectedImage} version={selectedVersion} />
          <DrawerTrigger
            render={
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={open}
                aria-controls={listboxId}
                className={cn(
                  "w-[300px] justify-between",
                  !field.value && "text-muted-foreground",
                )}
              />
            }
          >
            {field.value
              ? items.find((item) => item.imagePath === field.value)?.name
              : "Select item"}
            <ChevronsUpDown className='opacity-50' />
          </DrawerTrigger>
        </div>
        <DrawerContent id={listboxId}>
          <div className='mt-4 border-t'>
            <ItemList
              items={items}
              setOpen={setOpen}
              setSelectedImage={handleSelect}
              field={field}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  },
);

FilterImageCombobox.displayName = "FilterImageCombobox";

interface ItemListProps {
  items: Item[];
  setOpen: (open: boolean) => void;
  setSelectedImage: (image: string) => void;
  field: ControllerRenderProps<CreateFilterInput, "imagePath">;
}

const ItemList = React.memo(
  ({ items, setOpen, setSelectedImage, field }: ItemListProps) => {
    const form = useFormContext();

    return (
      <Command>
        <CommandInput placeholder='Filter items...' />
        <CommandList>
          <CommandEmpty>Item does not exist.</CommandEmpty>
          <CommandGroup>
            {items.map((item) => (
              <CommandItem
                key={item.itemId}
                className='flex items-center gap-x-2'
                value={item.name}
                onSelect={() => {
                  form.setValue("imagePath", item.imagePath, {
                    shouldTouch: true,
                  });
                  setSelectedImage(item.imagePath);
                  setOpen(false);
                  field.onChange(item.imagePath);
                }}
              >
                <div className='relative size-6'>
                  <ItemIcon
                    imagePath={item.imagePath}
                    version={item.iconVersion}
                    size='tiny'
                    alt={item.name}
                    width={24}
                    height={24}
                    unoptimized
                    className='rounded-sm object-contain'
                  />
                </div>
                {item.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );
  },
);

ItemList.displayName = "ItemList";

export { FilterImageCombobox };
