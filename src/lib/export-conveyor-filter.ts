import { type ConveyorFilterItem } from "@/types/filter";
import { GameConveyorFilterItem } from "@/types/gameItem";

export function exportConveyorFilter(filter: ConveyorFilterItem[]) {
  const conveyorFilter: GameConveyorFilterItem[] = filter.map((filterItem) => ({
    TargetCategory: filterItem.category?.id ?? null,
    MaxAmountInOutput: filterItem.max,
    BufferAmount: filterItem.buffer,
    MinAmountInInput: filterItem.min,
    IsBlueprint: false,
    BufferTransferRemaining: 0,
    TargetItemName: filterItem.item?.shortname ?? "",
  }));

  return JSON.stringify(conveyorFilter, null, 2);
}
