import { gameCategoryOf } from "@/utils/category-mapping";

import {
  keepLitMaxOf,
  perfectSmeltingOf,
  planOutputContainer,
  type PerfectSmelting,
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

// Rows missing from the catalogue become null to keep indexes aligned.
function toPlannerRows(
  rows: readonly FormRow[],
  catalogue: ReadonlyMap<number, CatalogueItem>,
  maxFor: (row: FormRow) => number = maxOf,
): (PlannerRow | null)[] {
  return rows.map((row) => {
    const max = maxFor(row);
    if ("categoryId" in row) {
      const category = gameCategoryOf(row.name);
      if (!category) return null;
      const items = [...catalogue.values()].filter(
        (item) => item.category === category,
      );
      return { kind: "category", category, items, max };
    }
    const item = catalogue.get(row.itemId);
    if (!item) return null;
    return {
      kind: "item",
      shortname: item.shortname,
      stackSize: item.stackSize,
      itemType: item.itemType,
      category: item.category,
      max,
    };
  });
}

function keepLitOfRow(
  container: OutputContainer,
  row: FormRow,
  catalogue: ReadonlyMap<number, CatalogueItem>,
) {
  const [planned] = toPlannerRows([row], catalogue);
  return planned ? keepLitMaxOf(container, planned) : null;
}

/** One plan per form row, index for index, null for rows it can't plan. */
export function planFormRows(
  container: OutputContainer,
  rows: readonly FormRow[],
  catalogue: ReadonlyMap<number, CatalogueItem>,
  isUncapped: (row: FormRow) => boolean = () => false,
  { perfectSmelting = false }: { perfectSmelting?: boolean } = {},
): (RowPlan | null)[] {
  const planned = toPlannerRows(rows, catalogue, (row) =>
    isUncapped(row) ? 0 : maxOf(row),
  );
  const plans = planOutputContainer(
    container,
    planned.filter((row) => row !== null),
    { perfectSmelting },
  );
  let position = 0;
  return planned.map((row) => (row ? plans[position++] : null));
}

export function perfectSmeltingOfForm(
  container: OutputContainer,
  rows: readonly FormRow[],
  catalogue: ReadonlyMap<number, CatalogueItem>,
): PerfectSmelting {
  return perfectSmeltingOf(
    container,
    toPlannerRows(rows, catalogue).filter((row) => row !== null),
  );
}

export interface FormSplit {
  /** New Max per row, index for index. Null leaves the row alone. */
  maxes: (number | null)[];
  written: Map<string, number>;
}

/** Rows still holding the last split's value count as uncapped. */
export function splitFormRows(
  container: OutputContainer,
  rows: readonly FormRow[],
  catalogue: ReadonlyMap<number, CatalogueItem>,
  lastWritten: ReadonlyMap<string, number>,
  { perfectSmelting = false }: { perfectSmelting?: boolean } = {},
): FormSplit {
  const leftToSplit = (row: FormRow) => {
    const max = maxOf(row);
    return max === 0 || lastWritten.get(rowKey(row)) === max;
  };
  const plans = planFormRows(container, rows, catalogue, leftToSplit, {
    perfectSmelting,
  });

  const written = new Map<string, number>();
  const maxes = rows.map((row, index) => {
    const plan = plans[index];
    if (!plan) return null;
    const keepLit =
      perfectSmelting && keepLitOfRow(container, row, catalogue) !== null;
    if (leftToSplit(row) && !keepLit) written.set(rowKey(row), plan.max);
    return plan.max;
  });
  return { maxes, written };
}

export function switchPerfectSmelting(
  container: OutputContainer,
  rows: readonly FormRow[],
  catalogue: ReadonlyMap<number, CatalogueItem>,
  lastWritten: ReadonlyMap<string, number>,
  on: boolean,
): FormSplit {
  if (on) {
    return splitFormRows(container, rows, catalogue, lastWritten, {
      perfectSmelting: true,
    });
  }
  const smeltOwned = new Map(lastWritten);
  for (const row of rows) {
    if (keepLitOfRow(container, row, catalogue) !== null) {
      smeltOwned.set(rowKey(row), maxOf(row));
    }
  }
  return splitFormRows(container, rows, catalogue, smeltOwned);
}

/** The last split isn't saved, so seedWritten rebuilds it from a fresh split. */
export function seedWritten(
  container: OutputContainer,
  rows: readonly FormRow[],
  catalogue: ReadonlyMap<number, CatalogueItem>,
): Map<string, number> {
  const perfectSmelting =
    perfectSmeltingOfForm(container, rows, catalogue) === "on";
  const plans = planFormRows(container, rows, catalogue, () => true, {
    perfectSmelting,
  });
  const written = new Map<string, number>();
  rows.forEach((row, index) => {
    const plan = plans[index];
    if (!plan || plan.max !== maxOf(row)) return;
    if (perfectSmelting && keepLitOfRow(container, row, catalogue) !== null) {
      return;
    }
    written.set(rowKey(row), plan.max);
  });
  return written;
}

export function fitAddedRow(
  container: OutputContainer,
  rows: readonly FormRow[],
  added: FormRow,
  catalogue: ReadonlyMap<number, CatalogueItem>,
  lastWritten: ReadonlyMap<string, number>,
  { perfectSmelting = false }: { perfectSmelting?: boolean } = {},
): { max: number; written: Map<string, number> } {
  const written = new Map(lastWritten);
  const keepLit = perfectSmelting
    ? keepLitOfRow(container, added, catalogue)
    : null;
  if (keepLit !== null) return { max: keepLit, written };
  const plan = planFormRows(container, [...rows, added], catalogue).at(-1);
  if (!plan) return { max: maxOf(added), written };
  written.set(rowKey(added), plan.max);
  return { max: plan.max, written };
}
