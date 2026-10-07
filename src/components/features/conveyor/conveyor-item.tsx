import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import { gameCategoryOf } from "@/utils/category-mapping";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormDescription, FormField } from "@/components/ui/form";
import { getCategoryIcon } from "@/components/features/conveyor/category-icons";
import { FilterSettingsInput } from "@/components/features/conveyor/filter-settings-input";
import { useRowPlan } from "@/components/features/conveyor/output-container-plan";
import {
  ImageBadges,
  type ImageBadge,
  type RowMessage,
} from "@/components/features/conveyor/row-status";
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
  const badges = imageBadges(rowPlan, item.shortname);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    attributes: { role: "listitem", roleDescription: "draggable item" },
  });

  function handleRemove() {
    onRemove(index);
    trigger("items");
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative -m-1.5 cursor-grab rounded-lg p-1.5 transition-colors outline-none select-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        isDragging &&
          "z-10 cursor-grabbing bg-primary/5 outline-2 -outline-offset-2 outline-primary/50 outline-dashed hover:bg-primary/5",
      )}
      {...attributes}
      {...listeners}
    >
      <div inert={isDragging} className={cn(isDragging && "opacity-40")}>
        <div className='relative h-40 w-auto'>
          <div
            className={cn(
              "absolute inset-0 transition-[opacity,filter] duration-200",
              rowPlan?.plan.notAccepted && "opacity-40 grayscale",
            )}
          >
            <ConveyorItemArt item={item} />
          </div>
          <ImageBadges badges={badges} />
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
                messages={maxMessages(rowPlan, !item.itemId)}
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
      </div>
    </li>
  );
}

function ConveyorItemArt({ item }: { item: ItemWithFields }) {
  if (!item.itemId) {
    const CategoryIcon = getCategoryIcon(gameCategoryOf(item.name)!);
    return <CategoryIcon className='h-full w-full' />;
  }
  return (
    <ItemIcon
      imagePath={item.imagePath}
      version={item.iconVersion}
      size='full'
      alt={item.name}
      fill
      sizes='160px'
      className='object-contain'
    />
  );
}

export function ConveyorItemPreview({ item }: { item: ItemWithFields }) {
  return (
    <div className='scale-105 rotate-3 cursor-grabbing p-1.5 drop-shadow-xl'>
      <div className='relative h-40 w-auto'>
        <ConveyorItemArt item={item} />
      </div>
    </div>
  );
}

function imageBadges(
  rowPlan: ReturnType<typeof useRowPlan>,
  shortname: string,
): ImageBadge[] {
  if (!rowPlan) return [];
  const { plan, containerName } = rowPlan;
  const badges: ImageBadge[] = [];
  if (plan.notAccepted) {
    badges.push({
      key: "rejected",
      Icon: BanIcon,
      tone: "warning",
      text: `Not accepted by ${containerName}`,
    });
  }
  if (plan.goesToBox) {
    badges.push({
      key: "route",
      Icon: PackageIcon,
      tone: "note",
      text: "Goes to the box",
    });
  } else if (plan.slotGroup === "fuel") {
    badges.push({
      key: "route",
      Icon: FlameKindlingIcon,
      tone: "note",
      text: "Goes to the fuel slot",
    });
  } else if (plan.slotGroup === "input") {
    badges.push({
      key: "route",
      Icon: shortname === "crude.oil" ? FuelIcon : StoneIcon,
      tone: "note",
      text: "Goes to the input slot",
    });
  }
  return badges;
}

function maxMessages(
  rowPlan: ReturnType<typeof useRowPlan>,
  isCategory: boolean,
): RowMessage[] {
  if (!rowPlan) return [];
  const { plan, containerName } = rowPlan;
  const warnings = [
    plan.aboveCapacity &&
      `A ${containerName} holds at most ${plan.rowCapacity?.toLocaleString("en-US")}.`,
    plan.sharesSlots &&
      `Shares ${slotsName(plan.slotGroup)} with other rows. The ${containerName} has none left for it.`,
    plan.belowKeepLit &&
      "Below what keeps the oven running between conveyor runs.",
    plan.stopsOven &&
      `Once the box holds this many, results drop on the ground and the ${containerName} switches off.`,
    aboveShareWarning(rowPlan),
  ];
  const notes = [isCategory ? assumedStackNote(rowPlan) : keepUpNote(rowPlan)];
  const tagged =
    (tone: RowMessage["tone"]) => (text: string | false | undefined) =>
      text ? [{ tone, text }] : [];
  return [
    ...warnings.flatMap(tagged("warning")),
    ...notes.flatMap(tagged("note")),
  ];
}

function slotsName(slotGroup: string | null) {
  return !slotGroup || slotGroup === "main" ? "slots" : `${slotGroup} slots`;
}

function aboveShareWarning(rowPlan: ReturnType<typeof useRowPlan>) {
  if (!rowPlan?.plan.aboveShare || rowPlan.plan.splitShare === null) return;
  return `Above this row's share of ${rowPlan.plan.splitShare.toLocaleString("en-US")}. Other rows may not fit once the ${rowPlan.containerName} fills up.`;
}

function assumedStackNote(rowPlan: ReturnType<typeof useRowPlan>) {
  if (!rowPlan?.plan.stackSize) return;
  return `Assumes ${rowPlan.plan.stackSize.toLocaleString("en-US")} per stack.`;
}

function keepUpNote(rowPlan: ReturnType<typeof useRowPlan>) {
  if (rowPlan?.plan.keepUpCount == null) return;
  return `One stack in the box keeps up with ${rowPlan.plan.keepUpCount} of these.`;
}
