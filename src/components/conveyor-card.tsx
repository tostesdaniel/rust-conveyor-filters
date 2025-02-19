"use client";

import { BoxIcon } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ItemWithFields, type NewConveyorItem } from "@/types/item";
import { normalizeFilterData } from "@/lib/normalizeFilterData";
import { ImportButton } from "@/components/import-button";

import { ConveyorCombobox } from "./conveyor-combobox";
import { ConveyorItemGrid } from "./conveyor-item-grid";
import { ExportConveyorFilter } from "./export-conveyor-filter";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { CheckboxWithDescription } from "./ui/checkbox-with-text";
import { FormField } from "./ui/form";

export function ConveyorCard() {
  const { control, watch } = useFormContext();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });
  const filter: ItemWithFields[] = watch("items");

  const handleAppend = (item: NewConveyorItem) => {
    append(item, { shouldFocus: false });
  };

  return (
    <Card className='divide-y'>
      <CardHeader className='relative py-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-6'>
        <div className='flex items-center gap-x-2 pr-10'>
          <BoxIcon className='h-5 w-5 shrink-0 text-muted-foreground' />
          <CardTitle className='shrink-0 text-xl'>Conveyor Filter</CardTitle>
        </div>

        <ConveyorCombobox onInsertItem={handleAppend} />

        <p className='font-semibold tracking-tight whitespace-nowrap tabular-nums min-[400px]:absolute min-[400px]:top-2 min-[400px]:right-6 min-[400px]:m-0 sm:static'>
          {fields.length}/30 filters
        </p>
      </CardHeader>
      <CardContent className='min-h-40 py-3'>
        <ConveyorItemGrid
          items={fields as ItemWithFields[]}
          onRemove={remove}
        />
      </CardContent>
      <CardFooter className='flex-col gap-x-4 gap-y-3 py-3 min-[550px]:flex-row sm:justify-end'>
        <div className='order-last flex-1 self-start min-[550px]:order-none min-[550px]:self-auto sm:flex-none'>
          <FormField
            control={control}
            name='isPublic'
            render={({ field }) => (
              <CheckboxWithDescription
                label='I want to make this filter public'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        <div className='grid w-full grid-cols-2 gap-x-4 min-[550px]:flex min-[550px]:w-auto min-[550px]:items-center'>
          <ImportButton
            onImport={replace}
            className='w-full min-[550px]:w-auto'
          />
          <ExportConveyorFilter
            type='button'
            filter={normalizeFilterData(filter)}
            className='w-full min-[550px]:w-auto'
          />
        </div>
      </CardFooter>
    </Card>
  );
}
