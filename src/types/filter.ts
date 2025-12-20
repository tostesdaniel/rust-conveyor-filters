import type { BadgeType } from "@/types/badges";
import { Filter, FilterItem, Item, type Category } from "@/db/schema";

export interface ConveyorFilterWithAuthor extends ConveyorFilter {
  author: string | null;
  badges: BadgeType[];
}

export interface ConveyorFilter extends Filter {
  filterItems: ConveyorFilterItem[];
}

export interface ConveyorFilterItem extends FilterItem {
  item: Item | null;
  category: Category | null;
}

export type {
  PublicFilterListDTO,
  FilterItemDTO,
  OwnerFilterDTO,
  SharedFilterDTO,
} from "@/types/dto/public-filter";
export type { BookmarkDTO } from "@/types/dto/bookmark";
