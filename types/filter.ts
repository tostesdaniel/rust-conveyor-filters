import { Filter, FilterItem, Item } from "@/db/schema";

export interface ConveyorFilter extends Filter {
  filterItems: ConveyorFilterItem[];
}

export interface ConveyorFilterItem extends FilterItem {
  item: Item;
}
