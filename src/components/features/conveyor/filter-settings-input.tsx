import { ChevronDown, ChevronUp } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { FilterSettingsFieldDescription } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FilterSettingsTooltip } from "@/components/features/conveyor/filter-settings-tooltip";

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

    setValue(`items.${index}.${property}`, newValue, { shouldDirty: true });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const numericValue = isNaN(Number(inputValue)) ? 0 : Number(inputValue);

    setValue(`items.${index}.${property}`, numericValue, { shouldDirty: true });
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  return (
    <FormItem>
      <div className='mt-2 flex rounded-md'>
        <FormLabel className='inline-flex h-9 w-16 flex-none items-center rounded-l-md border border-r-0 border-input px-3 text-muted-foreground'>
          {label}
        </FormLabel>
        <FilterSettingsTooltip tooltipText={getTooltipText(property)}>
          <FormControl>
            <Input
              type='text'
              id={id}
              placeholder='0'
              className='rounded-none border-r-0 text-end focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-inset'
              {...field}
              onFocus={handleInputFocus}
              onChange={handleInputChange}
            />
          </FormControl>
        </FilterSettingsTooltip>
        <div className='flex flex-col justify-center'>
          <Button
            type='button'
            size='icon'
            aria-label={`Increment ${label}`}
            className='h-4.5 w-4.5 rounded-none rounded-tr-md'
            onClick={() => handleValueChange(index, "increment", property)}
          >
            <ChevronUp className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            size='icon'
            aria-label={`Decrement ${label}`}
            className='h-4.5 w-4.5 rounded-none rounded-br-md'
            onClick={() => handleValueChange(index, "decrement", property)}
          >
            <ChevronDown className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </FormItem>
  );
}
