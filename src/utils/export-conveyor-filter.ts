import type { PublicFilterItemDTO } from "@/types/filter";
import { GameConveyorFilterItem } from "@/types/gameItem";

/**
 * Serialize an array of public filter items into a conveyor-system filter JSON string.
 *
 * @param filter - Array of public filter items to convert into conveyor filter entries
 * @returns A JSON-formatted string representing the conveyor filter array, pretty-printed with two-space indentation
 */
export function exportConveyorFilter(filter: PublicFilterItemDTO[]) {
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