"use client";

import type { createFilterSchema } from "@/schemas/filterFormSchema";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  CornerDownRight,
  PlusIcon,
} from "lucide-react";
import type { ControllerRenderProps } from "react-hook-form";
import { z } from "zod";

import { useGetUserCategories } from "@/hooks/use-get-user-categories";
import { cn } from "@/lib/utils";
import { type SubCategory } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
  field: ControllerRenderProps<z.infer<typeof createFilterSchema>, "category">;
}

export function FilterCategoryCombobox({ field }: FilterCategoryComboboxProps) {
  const { data: categories } = useGetUserCategories();

  const getSelectedName = () => {
    if (!field.value) return "Select a category";

    if (field.value.subCategoryId) {
      const category = categories?.find((c) => c.id === field.value.categoryId);
      const subcategory = category?.subCategories.find(
        (s) => s.id === field.value.subCategoryId,
      );
      return subcategory?.name;
    }

    return categories?.find((c) => c.id === field.value.categoryId)?.name;
  };

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
            {getSelectedName() ?? "Select a category"}
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
              <div className='px-1'>
                <CreateCategoryDialog parentId={null}>
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

            {/* Main Categories */}
            {categories?.map((category, index, array) => (
              <div key={category.id}>
                <CommandGroup>
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() =>
                      field.onChange({
                        categoryId: category.id,
                        subCategoryId: null,
                      })
                    }
                    className='group justify-between font-medium'
                  >
                    <div className='flex items-center'>
                      <CheckIcon
                        className={cn(
                          "mr-2",
                          category.id === field.value.categoryId &&
                            !field.value.subCategoryId
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {category.name}
                    </div>
                    {/* Create Subcategory Button */}
                    <CreateCategoryDialog parentId={category.id}>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PlusIcon className='h-4 w-4' />
                        <span className='sr-only'>Add subcategory</span>
                      </Button>
                    </CreateCategoryDialog>
                  </CommandItem>

                  {/* Subcategories */}
                  {category.subCategories?.map((subCategory) => (
                    <SubcategoryItem
                      key={subCategory.id}
                      subCategory={subCategory}
                      field={field}
                    />
                  ))}
                </CommandGroup>

                {/* Add separator if not the last category */}
                {index < array.length - 1 && <Separator />}
              </div>
            ))}

            {/* Create Category Button */}
            {categories?.length !== 0 && (
              <CommandGroup>
                <CreateCategoryDialog parentId={null}>
                  <Button
                    size='sm'
                    className='h-8 w-full justify-start rounded-sm px-2 py-1.5'
                  >
                    <PlusIcon className='mr-2 h-4 w-4' />
                    Create Category
                  </Button>
                </CreateCategoryDialog>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const SubcategoryItem = ({
  subCategory,
  field,
}: {
  subCategory: SubCategory;
  field: ControllerRenderProps<z.infer<typeof createFilterSchema>, "category">;
}) => (
  <CommandItem
    value={subCategory.name}
    onSelect={() =>
      field.onChange({
        categoryId: subCategory.parentId,
        subCategoryId: subCategory.id,
      })
    }
    className='text-muted-foreground'
  >
    <CheckIcon
      className={cn(
        "mr-2 h-4 w-4",
        subCategory.id === field.value.subCategoryId
          ? "opacity-100"
          : "opacity-0",
      )}
    />
    <CornerDownRight className='mr-2 h-4 w-4 text-muted-foreground' />
    {subCategory.name}
  </CommandItem>
);
