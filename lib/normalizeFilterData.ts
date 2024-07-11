import { ConveyorFilterItem } from "@/types/filter";
import { ItemWithFields } from "@/types/item";

export function normalizeFilterData(
  filter: ItemWithFields[],
): ConveyorFilterItem[] {
  return filter.map((item) => ({
    ...item,
    item: {
      shortname: item.shortname,
    },
  })) as unknown as ConveyorFilterItem[];
}
