import { Filter, FilterItem } from "@/db/schema";

export type FilterWithItems = Filter & {
  filterItems: FilterItem[];
};

export type FilterWithItemIds = Filter & {
  filterItems: { itemId: number }[];
};
