import { Filter, FilterItem, Item } from "@/db/schema";

export interface ConveyorFilterWithAuthor extends ConveyorFilter {
  author: string | null;
}

export interface ConveyorFilter extends Filter {
  filterItems: ConveyorFilterItem[];
}

export interface ConveyorFilterItem extends FilterItem {
  item: Item;
}
