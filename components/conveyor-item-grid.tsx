import { useFormContext } from "react-hook-form";

import { type ItemWithFields } from "@/types/item";

import { ConveyorItem } from "./conveyor-item";

interface ConveyorItemGridProps {
  items: ItemWithFields[];
}

export function ConveyorItemGrid({ items }: ConveyorItemGridProps) {
  const { control } = useFormContext();

  if (!items.length) {
    return (
      <div className='grid h-32 place-items-center'>
        <h3 className='font-medium text-muted-foreground'>
          No items added yet.
        </h3>
      </div>
    );
  }

  return (
    <ul
      role='list'
      className='grid snap-y snap-mandatory grid-cols-2 gap-4 gap-x-4 gap-y-8 overflow-y-auto scroll-smooth p-1.5 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-5'
    >
      {items?.map((item, index) => (
        <ConveyorItem
          key={item.id}
          item={item}
          index={index}
          control={control}
        />
      ))}
    </ul>
  );
}
