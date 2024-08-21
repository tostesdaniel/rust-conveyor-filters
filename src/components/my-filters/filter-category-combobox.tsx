"use client";

import type { createFilterSchema } from "@/schemas/filterFormSchema";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import type { ControllerRenderProps } from "react-hook-form";
import type { z } from "zod";

import { useGetUserCategories } from "@/hooks/use-get-user-categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { FormControl } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CreateCategoryDialog } from "@/components/my-filters/categories/dialogs/create-category-dialog";

export interface FilterCategoryComboboxProps {
  field: ControllerRenderProps<
    z.infer<typeof createFilterSchema>,
    "categoryId"
  >;
}

export function FilterCategoryCombobox({ field }: FilterCategoryComboboxProps) {
  const { data: categories } = useGetUserCategories();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant='outline'
            role='combobox'
            className={cn(
              "w-[200px] justify-between",
              !field.value && "text-muted-foreground",
            )}
          >
            {field.value
              ? categories?.find((category) => category.id === field.value)
                  ?.name
              : "Select a category"}
            <ChevronsUpDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0'>
        <Command>
          <CommandInput placeholder='Search category...' />
          <CommandList>
            <CommandEmpty className='pb-1 pt-3 text-center text-sm'>
              No categories found.
              <Separator className='my-3' />
              <div className=' px-1'>
                <CreateCategoryDialog>
                  <Button
                    className='h-8 w-full justify-start rounded-sm px-2 py-1.5'
                    size='sm'
                  >
                    <PlusIcon className='mr-2 h-4 w-4' />
                    Create Category
                  </Button>
                </CreateCategoryDialog>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {categories?.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => field.onChange(category.id)}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      category.id === field.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CreateCategoryDialog>
                <Button
                  size='sm'
                  className='h-8 w-full justify-start rounded-sm px-2 py-1.5'
                >
                  <PlusIcon className='mr-2 h-4 w-4' />
                  Create Category
                </Button>
              </CreateCategoryDialog>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
