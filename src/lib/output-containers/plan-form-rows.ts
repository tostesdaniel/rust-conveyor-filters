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

export interface FormSplit {
  /** New Max per row, index for index. Null leaves the row alone. */
  maxes: (number | null)[];
  written: Map<string, number>;
}

/**
 * A row still holding what the last split wrote hasn't been capped by the
 * author, so it splits again like a row at 0.
 */
export function splitFormRows(
  container: OutputContainer,
  rows: readonly FormRow[],
  catalogue: ReadonlyMap<number, CatalogueItem>,
  lastWritten: ReadonlyMap<string, number>,
): FormSplit {
  const leftToSplit = (row: FormRow) => {
    const max = maxOf(row);
    return max === 0 || lastWritten.get(rowKey(row)) === max;
  };
  const plans = planFormRows(container, rows, catalogue, leftToSplit);

  const written = new Map<string, number>();
  const maxes = rows.map((row, index) => {
    const plan = plans[index];
    if (!plan) return null;
    if (leftToSplit(row)) written.set(rowKey(row), plan.max);
    return plan.max;
  });
  return { maxes, written };
}

/**
 * What the last split wrote isn't saved, so a reloaded row counts as
 * split-owned only while it still holds what a fresh split gives it.
 */
export function seedWritten(
  container: OutputContainer,
  rows: readonly FormRow[],
  catalogue: ReadonlyMap<number, CatalogueItem>,
): Map<string, number> {
  const plans = planFormRows(container, rows, catalogue, () => true);
  const written = new Map<string, number>();
  rows.forEach((row, index) => {
    const plan = plans[index];
    if (plan && plan.max === maxOf(row)) written.set(rowKey(row), plan.max);
  });
  return written;
}

export function fitAddedRow(
  container: OutputContainer,
  rows: readonly FormRow[],
  added: FormRow,
  catalogue: ReadonlyMap<number, CatalogueItem>,
  lastWritten: ReadonlyMap<string, number>,
): { max: number; written: Map<string, number> } {
  const plan = planFormRows(container, [...rows, added], catalogue).at(-1);
  const written = new Map(lastWritten);
  if (!plan) return { max: maxOf(added), written };
  written.set(rowKey(added), plan.max);
  return { max: plan.max, written };
}
