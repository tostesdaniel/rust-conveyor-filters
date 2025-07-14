import { ConveyorFilterItem } from "@/types/filter";
import { ItemWithFields } from "@/types/item";

export function normalizeFilterData(
  filter: ItemWithFields[],
): ConveyorFilterItem[] {
  return filter.map((item) => ({
    ...item,
    item: "itemId" in item ? { shortname: item.shortname } : null,
    categoryId: "categoryId" in item ? item.categoryId : null,
  })) as unknown as ConveyorFilterItem[];
}
