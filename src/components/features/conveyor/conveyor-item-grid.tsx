import { useId, useState } from "react";
import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Activators,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardSensorOptions,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useFormContext } from "react-hook-form";

import { type ItemWithFields } from "@/types/item";
import {
  ConveyorItem,
  ConveyorItemPreview,
} from "@/components/features/conveyor/conveyor-item";

const CONTROLS = "input, textarea, select, button, a, [role='button']";

function startsOnItem(target: EventTarget | null) {
  return !(target instanceof Element && target.closest(CONTROLS));
}

class ItemPointerSensor extends PointerSensor {
  static activators = PointerSensor.activators.map((activator) => ({
    ...activator,
    handler: (...args: Parameters<typeof activator.handler>) =>
      startsOnItem(args[0].nativeEvent.target) && activator.handler(...args),
  }));
}

class ItemTouchSensor extends TouchSensor {
  static activators = TouchSensor.activators.map((activator) => ({
    ...activator,
    handler: (...args: Parameters<typeof activator.handler>) =>
      startsOnItem(args[0].nativeEvent.target) && activator.handler(...args),
  }));
}

class ItemKeyboardSensor extends KeyboardSensor {
  static activators: Activators<KeyboardSensorOptions> =
    KeyboardSensor.activators.map((activator) => ({
      ...activator,
      handler: (event, options, context) =>
        event.target === event.currentTarget &&
        activator.handler(event, options, context),
    }));
}

interface ConveyorItemGridProps {
  items: ItemWithFields[];
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
}

export function ConveyorItemGrid({
  items,
  onRemove,
  onMove,
}: ConveyorItemGridProps) {
  const { control } = useFormContext<
    CreateFilterInput,
    unknown,
    CreateFilter
  >();
  const dndId = useId();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(ItemPointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(ItemTouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(ItemKeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const activeIndex = items.findIndex((item) => item.id === activeId);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from !== -1 && to !== -1) onMove(from, to);
  }

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
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <ul className='grid snap-y snap-mandatory grid-cols-1 gap-4 gap-x-4 gap-y-8 overflow-y-auto scroll-smooth p-1.5 min-[412px]:grid-cols-2 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-5'>
          {items.map((item, index) => (
            <ConveyorItem
              key={item.id}
              item={item}
              index={index}
              control={control}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </SortableContext>
      <DragOverlay>
        {activeIndex !== -1 ? (
          <ConveyorItemPreview item={items[activeIndex]} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
