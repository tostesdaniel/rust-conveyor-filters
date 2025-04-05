import Image from "next/image";
import { createFilterSchema } from "@/schemas/filterFormSchema";
import { XIcon } from "lucide-react";
import { Control, useFormContext } from "react-hook-form";
import { z } from "zod";

import { type ItemWithFields } from "@/types/item";
import { categoryMapping } from "@/lib/categoryMapping";
import { FilterSettingsFieldDescription } from "@/lib/constants";
import { getR2ImageUrl } from "@/lib/utils/r2-images";
import { Button } from "@/components/ui/button";
import { getCategoryIcon } from "@/components/category-icons";

import { FilterSettingsInput } from "./filter-settings-input";
import { FormDescription, FormField } from "./ui/form";

interface ConveyorItemProps {
  item: ItemWithFields;
  index: number;
  control: Control<z.infer<typeof createFilterSchema>>;
  onRemove: (index: number) => void;
}

export function ConveyorItem({
  item,
  index,
  control,
  onRemove,
}: ConveyorItemProps) {
  const { trigger } = useFormContext();

  function handleRemove() {
    onRemove(index);
    trigger("items");
  }

  const categoryKey = Object.keys(categoryMapping).find(
    (key) => categoryMapping[key] === item.name,
  );
  const isCategory = !item.itemId;
  const CategoryIcon = getCategoryIcon(categoryKey!);

  return (
    <li key={`${item.id}`}>
      <div className='relative h-40 w-auto'>
        {isCategory ? (
          <CategoryIcon className='h-full w-full object-contain' />
        ) : (
          <Image
            src={getR2ImageUrl(item.imagePath + ".webp", "full")}
            alt={item.name}
            fill
            className='object-contain'
          />
        )}
        <div className='absolute inset-y-0 right-0'>
          <Button
            type='button'
            variant='destructive'
            size='icon'
            className='mt-2 h-5 w-5'
            onClick={handleRemove}
          >
            <XIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>
      <p className='pointer-events-none mt-2 truncate text-sm font-medium text-foreground/80'>
        {item.name}
      </p>
      <FormField
        control={control}
        name={`items.${index}.max`}
        render={({ field }) => (
          <>
            <FilterSettingsInput
              label='Max'
              id={item.id}
              index={index}
              property='max'
              {...field}
            />
            <FormDescription className='sr-only'>
              {FilterSettingsFieldDescription["MAX"]}
            </FormDescription>
          </>
        )}
      />
      <FormField
        control={control}
        name={`items.${index}.buffer`}
        render={({ field }) => (
          <>
            <FilterSettingsInput
              label='Buffer'
              id={item.id}
              index={index}
              property='buffer'
              {...field}
            />
            <FormDescription className='sr-only'>
              {FilterSettingsFieldDescription["BUFFER"]}
            </FormDescription>
          </>
        )}
      />
      <FormField
        control={control}
        name={`items.${index}.min`}
        render={({ field }) => (
          <>
            <FilterSettingsInput
              label='Min'
              id={item.id}
              index={index}
              property='min'
              {...field}
            />
            <FormDescription className='sr-only'>
              {FilterSettingsFieldDescription["MIN"]}
            </FormDescription>
          </>
        )}
      />
    </li>
  );
}
