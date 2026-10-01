import { ChevronDown, ChevronUp } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { FilterSettingsFieldDescription } from "@/config/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FilterSettingsTooltip } from "@/components/features/conveyor/filter-settings-tooltip";
import {
  RowStatusIcon,
  type RowMessage,
} from "@/components/features/conveyor/row-status";

interface FilterSettingsInputProps {
  label: string;
  id: string;
  index: number;
  property: "max" | "min" | "buffer";
  messages?: readonly RowMessage[];
}

function getTooltipText(property: "max" | "min" | "buffer") {
  return FilterSettingsFieldDescription[
    property.toUpperCase() as keyof typeof FilterSettingsFieldDescription
  ];
}

function handleInputFocus(event: React.FocusEvent<HTMLInputElement>) {
  event.target.select();
}

export function FilterSettingsInput({
  label,
  id,
  index,
  property,
  messages = [],
  ...field
}: FilterSettingsInputProps) {
  const { setValue, getValues } = useFormContext();
  const warned = messages.some((message) => message.tone === "warning");

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

  return (
    <FormItem>
      <div className='mt-2 flex rounded-md'>
        <FormLabel className='inline-flex h-9 w-16 flex-none items-center rounded-l-md border border-r-0 border-input px-3 text-muted-foreground'>
          {label}
        </FormLabel>
        <div className='relative min-w-0 flex-1'>
          <FilterSettingsTooltip tooltipText={getTooltipText(property)}>
            <FormControl>
              <Input
                type='text'
                id={id}
                placeholder='0'
                className={cn(
                  "rounded-none border-r-0 pl-7 text-end focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-inset",
                  warned && "text-yellow-600 dark:text-yellow-400",
                )}
                {...field}
                onFocus={handleInputFocus}
                onChange={handleInputChange}
              />
            </FormControl>
          </FilterSettingsTooltip>
          <RowStatusIcon label={label} messages={messages} />
        </div>
        <div className='flex flex-col justify-center'>
          <Button
            type='button'
            size='icon'
            aria-label={`Increment ${label}`}
            className='size-4.5 rounded-none rounded-tr-md border-0'
            onClick={() => handleValueChange(index, "increment", property)}
          >
            <ChevronUp className='size-4' />
          </Button>
          <Button
            type='button'
            size='icon'
            aria-label={`Decrement ${label}`}
            className='size-4.5 rounded-none rounded-br-md border-0'
            onClick={() => handleValueChange(index, "decrement", property)}
          >
            <ChevronDown className='size-4' />
          </Button>
        </div>
      </div>
    </FormItem>
  );
}
