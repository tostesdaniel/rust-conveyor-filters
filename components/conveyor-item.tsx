import Image from "next/image";
import { XIcon } from "lucide-react";
import { Control } from "react-hook-form";

import { type ItemWithFields } from "@/types/item";
import { FilterSettingsFieldDescription } from "@/lib/constants";
import { Button } from "@/components/ui/button";

import { FilterSettingsInput } from "./filter-settings-input";
import { FormDescription, FormField } from "./ui/form";

interface ConveyorItemProps {
  item: ItemWithFields;
  index: number;
  control: Control<any>;
  onRemove: (index: number) => void;
}

export function ConveyorItem({
  item,
  index,
  control,
  onRemove,
}: ConveyorItemProps) {
  return (
    <li key={`${item.id}`}>
      <div className='relative h-40 w-auto'>
        <Image
          src={`/items/${item.imagePath}.png`}
          alt={item.name}
          fill
          className='object-contain'
        />
        <div className='absolute inset-y-0 right-0'>
          <Button
            variant='destructive'
            size='icon'
            className='mt-2 h-5 w-5'
            onClick={() => onRemove(index)}
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
