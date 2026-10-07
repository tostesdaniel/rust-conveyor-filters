import type { CreateFilterInput } from "@/schemas/filterFormSchema";

import type { Item } from "@/db/schema";

type CatalogueItem = Pick<
  Item,
  "id" | "name" | "shortname" | "imagePath" | "iconVersion"
>;

export function reconcileFilterDraft(
  values: CreateFilterInput,
  catalogue: readonly CatalogueItem[],
  savedCover?: string,
): { values: CreateFilterInput; droppedCount: number } {
  const byId = new Map(catalogue.map((item) => [item.id, item]));

  const items = values.items.flatMap((row): CreateFilterInput["items"] => {
    if (!("itemId" in row)) return [row];
    const item = byId.get(row.itemId);
    if (!item) return [];
    const refreshed = {
      ...row,
      name: item.name,
      shortname: item.shortname,
      imagePath: item.imagePath,
      iconVersion: item.iconVersion,
    };
    return [refreshed];
  });

  const coverExists =
    values.imagePath === savedCover ||
    catalogue.some((item) => item.imagePath === values.imagePath);

  return {
    values: {
      ...values,
      imagePath: coverExists ? values.imagePath : "",
      items,
    },
    droppedCount: values.items.length - items.length,
  };
}

/** The fields a draft overwrites, so a draft can tell if the filter changed. */
export function filterDraftBase(values: CreateFilterInput): string {
  return JSON.stringify([
    values.name,
    values.description,
    values.imagePath,
    values.category.categoryId ?? null,
    values.category.subCategoryId ?? null,
    values.isPublic ?? null,
    values.outputContainer ?? null,
    values.items.map((row) => [
      "itemId" in row ? row.itemId : `category:${row.categoryId}`,
      row.max,
      row.buffer,
      row.min,
    ]),
  ]);
}
