import { gameCategoryOf } from "@/utils/category-mapping";

import {
  planOutputContainer,
  type PlannerRow,
  type RowPlan,
} from "@/lib/output-containers/capacity-planner";
import type { OutputContainer } from "@/lib/output-containers/container-table";
import type { Item } from "@/db/schema";

export type FormRow =
  | { itemId: number; max: number | string }
  | { categoryId: number; name: string; max: number | string };

export type CatalogueItem = Pick<
  Item,
  "shortname" | "stackSize" | "itemType" | "category"
>;

// The settings input can leave a string behind mid-edit.
export function maxOf(row: FormRow) {
  return Number(row.max) || 0;
}

export function rowKey(row: FormRow) {
  return "itemId" in row ? `item:${row.itemId}` : `category:${row.categoryId}`;
}

/**
 * One plan per form row, index for index. A row whose item or category left
 * the catalogue gets null, since there's no stack size to plan it with.
 */
export function planFormRows(
  container: OutputContainer,
  rows: readonly FormRow[],
  catalogue: ReadonlyMap<number, CatalogueItem>,
  isUncapped: (row: FormRow) => boolean = () => false,
): (RowPlan | null)[] {
  const planned: { index: number; row: PlannerRow }[] = [];
  rows.forEach((row, index) => {
    const max = isUncapped(row) ? 0 : maxOf(row);
    if ("categoryId" in row) {
      const category = gameCategoryOf(row.name);
      if (!category) return;
      const items = [...catalogue.values()].filter(
        (item) => item.category === category,
      );
      planned.push({ index, row: { kind: "category", category, items, max } });
      return;
    }
    const item = catalogue.get(row.itemId);
    if (!item) return;
    planned.push({
      index,
      row: {
        kind: "item",
        shortname: item.shortname,
        stackSize: item.stackSize,
        itemType: item.itemType,
        category: item.category,
        max,
      },
    });
  });

  const plans = planOutputContainer(
    container,
    planned.map(({ row }) => row),
  );
  const result: (RowPlan | null)[] = rows.map(() => null);
  planned.forEach(({ index }, position) => {
    result[index] = plans[position];
  });
  return result;
}
