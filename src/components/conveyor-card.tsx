import { BoxIcon } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ItemWithFields } from "@/types/item";
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

  return (
    <Card className='divide-y'>
      <CardHeader className='py-3 sm:flex-row sm:items-center sm:justify-between sm:space-x-6 sm:space-y-0'>
        <div className='flex items-center gap-x-2'>
          <BoxIcon className='h-5 w-5 shrink-0 text-muted-foreground' />
          <CardTitle className='text-xl'>Conveyor Filter</CardTitle>
        </div>
        <ConveyorCombobox onInsertItem={append} />
        <p className='font-semibold tabular-nums tracking-tight'>
          {fields.length}/30 filters
        </p>
      </CardHeader>
      <CardContent className='min-h-40 py-3'>
        <ConveyorItemGrid
          items={fields as ItemWithFields[]}
          onRemove={remove}
        />
      </CardContent>
      <CardFooter className='justify-end gap-x-4 py-3'>
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
        <ImportButton onImport={replace} />
        <ExportConveyorFilter
          type='button'
          filter={normalizeFilterData(filter)}
        />
      </CardFooter>
    </Card>
  );
}
