import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import { gameCategoryOf } from "@/utils/category-mapping";
import {
  BanIcon,
  FlameKindlingIcon,
  FuelIcon,
  PackageIcon,
  StoneIcon,
  XIcon,
} from "lucide-react";
import { Control, useFormContext } from "react-hook-form";

import { type ItemWithFields } from "@/types/item";
import { FilterSettingsFieldDescription } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { FormDescription, FormField } from "@/components/ui/form";
import { getCategoryIcon } from "@/components/features/conveyor/category-icons";
import { FilterSettingsInput } from "@/components/features/conveyor/filter-settings-input";
import { useRowPlan } from "@/components/features/conveyor/output-container-plan";
import { ItemIcon } from "@/components/shared/item-icon";

interface ConveyorItemProps {
  item: ItemWithFields;
  index: number;
  control: Control<CreateFilterInput, unknown, CreateFilter>;
  onRemove: (index: number) => void;
}

export function ConveyorItem({
  item,
  index,
  control,
  onRemove,
}: ConveyorItemProps) {
  const { trigger } = useFormContext();
  const rowPlan = useRowPlan(index);
  const route = ovenRoute(rowPlan, item.shortname);

  function handleRemove() {
    onRemove(index);
    trigger("items");
  }

  const categoryKey = gameCategoryOf(item.name);
  const isCategory = !item.itemId;
  const CategoryIcon = getCategoryIcon(categoryKey!);

  return (
    <li key={`${isCategory ? "category" : "item"} - ${item.id}`}>
      <div className='relative h-40 w-auto'>
        {isCategory ? (
          <CategoryIcon className='h-full w-full' />
        ) : (
          <ItemIcon
            imagePath={item.imagePath}
            version={item.iconVersion}
            size='full'
            alt={item.name}
            fill
            sizes='160px'
            className='object-contain'
          />
        )}
        <div className='absolute inset-y-0 right-0'>
          <Button
            type='button'
            variant='destructive'
            size='icon'
            className='mt-2 size-5'
            onClick={handleRemove}
          >
            <XIcon className='size-4' />
          </Button>
        </div>
      </div>
      <p className='pointer-events-none mt-2 truncate text-sm font-medium text-foreground/80'>
        {item.name}
      </p>
      {rowPlan?.plan.notAccepted && (
        <p className='mt-1 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400'>
          <BanIcon className='size-3.5 shrink-0' />
          Not accepted by {rowPlan.containerName}
        </p>
      )}
      {route && (
        <p className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
          <route.Icon className='size-3.5 shrink-0' />
          {route.label}
        </p>
      )}
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
              warning={aboveShareWarning(rowPlan)}
              note={isCategory ? assumedStackNote(rowPlan) : undefined}
              {...field}
            />
            <FormDescription className='sr-only'>
              {FilterSettingsFieldDescription["MAX"]}
            </FormDescription>
            {rowPlan?.plan.aboveCapacity && (
              <p className='mt-1 text-xs text-yellow-600 dark:text-yellow-400'>
                A {rowPlan.containerName} holds at most{" "}
                {rowPlan.plan.rowCapacity?.toLocaleString("en-US")}.
              </p>
            )}
            {rowPlan?.plan.stopsOven && (
              <p className='mt-1 text-xs text-yellow-600 dark:text-yellow-400'>
                Once the box holds this many, results drop on the ground and the{" "}
                {rowPlan.containerName} switches off.
              </p>
            )}
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

function ovenRoute(rowPlan: ReturnType<typeof useRowPlan>, shortname: string) {
  if (rowPlan?.plan.goesToBox) {
    return { Icon: PackageIcon, label: "Goes to the box" };
  }
  if (rowPlan?.plan.slotGroup === "fuel") {
    return { Icon: FlameKindlingIcon, label: "Goes to the fuel slot" };
  }
  if (rowPlan?.plan.slotGroup === "input") {
    return {
      Icon: shortname === "crude.oil" ? FuelIcon : StoneIcon,
      label: "Goes to the input slot",
    };
  }
  return null;
}

function aboveShareWarning(rowPlan: ReturnType<typeof useRowPlan>) {
  if (!rowPlan?.plan.aboveShare || rowPlan.plan.splitShare === null) return;
  return `Above this row's share of ${rowPlan.plan.splitShare.toLocaleString("en-US")}. Other rows may not fit once the ${rowPlan.containerName} fills up.`;
}

function assumedStackNote(rowPlan: ReturnType<typeof useRowPlan>) {
  if (!rowPlan?.plan.stackSize) return;
  return `Assumes ${rowPlan.plan.stackSize.toLocaleString("en-US")} per stack.`;
}
