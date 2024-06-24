import { Filter, FilterItem, Item } from "@/db/schema";

export type FilterWithItems = Filter & {
  filterItems: FilterItem[];
};

export type FilterItemWithItemInfo = FilterItem & {
  item: Item;
};

export type FilterWithItemsAndInfo = Filter & {
  filterItems: FilterItemWithItemInfo[];
};

export type FilterWithItemIds = Filter & {
  filterItems: { itemId: number }[];
};
