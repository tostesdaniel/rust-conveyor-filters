import { ConveyorFilterItem } from "@/types/filter";
import { ItemWithFields } from "@/types/item";

export function normalizeFilterData(
  filter: ItemWithFields[],
): ConveyorFilterItem[] {
  return filter.map((item) => ({
    ...item,
    item: "itemId" in item ? { shortname: item.shortname } : null,
    // The exporter reads `category?.id`, so a bare `categoryId` would export as
    // a null category. Shape it into the object the exporter expects.
    category: "categoryId" in item ? { id: item.categoryId } : null,
  })) as unknown as ConveyorFilterItem[];
}
