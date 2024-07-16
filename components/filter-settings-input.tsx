import { ChevronDown, ChevronUp } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { FilterSettingsFieldDescription } from "@/lib/constants";

import { FilterSettingsTooltip } from "./filter-settings-tooltip";
import { Button } from "./ui/button";
import { FormControl, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";

interface FilterSettingsInputProps {
  label: string;
  id: string;
  index: number;
  property: "max" | "min" | "buffer";
}

function getTooltipText(property: "max" | "min" | "buffer") {
  return FilterSettingsFieldDescription[
    property.toUpperCase() as keyof typeof FilterSettingsFieldDescription
  ];
}

export function FilterSettingsInput({
  label,
  id,
  index,
  property,
  ...field
}: FilterSettingsInputProps) {
  const { setValue, getValues } = useFormContext();

  const handleValueChange = (
    index: number,
    action: "increment" | "decrement",
    property: "max" | "buffer" | "min",
  ) => {
    const currentValue = parseInt(getValues(`items.${index}.${property}`), 10);
    const validValue = isNaN(currentValue) ? 0 : currentValue;
    const change = action === "increment" ? 1 : -1;
    const newValue = Math.max(0, validValue + change);

    setValue(`items.${index}.${property}`, newValue);
  };

  return (
    <FormItem>
      <div className='mt-2 flex rounded-md'>
        <FormLabel className='inline-flex w-16 flex-none items-center rounded-l-md border border-r-0 border-input px-3 text-muted-foreground'>
          {label}
        </FormLabel>
        <FilterSettingsTooltip tooltipText={getTooltipText(property)}>
          <FormControl>
            <Input
              type='text'
              id={id}
              placeholder='0'
              className='rounded-none border-r-0 text-end focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-offset-0'
              {...field}
            />
          </FormControl>
        </FilterSettingsTooltip>
        <div className='flex flex-col justify-center'>
          <Button
            type='button'
            size='icon'
            className='h-5 w-5 rounded-none rounded-tr-md'
            onClick={() => handleValueChange(index, "increment", property)}
          >
            <ChevronUp className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            size='icon'
            className='h-5 w-5 rounded-none rounded-br-md'
            onClick={() => handleValueChange(index, "decrement", property)}
          >
            <ChevronDown className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </FormItem>
  );
}
