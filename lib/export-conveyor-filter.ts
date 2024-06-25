import { FilterItemWithItemInfo, FilterWithItemsAndInfo } from "@/types/filter";
import { GameConveyorFilterItem } from "@/types/gameitem";

export function exportConveyorFilter(filter: FilterItemWithItemInfo[]) {
  const conveyorFilter: GameConveyorFilterItem[] = filter.map((filterItem) => ({
    TargetCategory: null,
    MaxAmountInOutput: filterItem.max,
    BufferAmount: filterItem.buffer,
    MinAmountInInput: filterItem.min,
    IsBlueprint: false,
    BufferTransferRemaining: 0,
    TargetItemName: filterItem.item.shortname,
  }));

  return JSON.stringify(conveyorFilter, null, 2);
}
