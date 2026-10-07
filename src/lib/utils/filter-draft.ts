import type { CreateFilterInput } from "@/schemas/filterFormSchema";

import type { Item } from "@/db/schema";

type CatalogueItem = Pick<
  Item,
  "id" | "name" | "shortname" | "imagePath" | "iconVersion"
>;

export function reconcileFilterDraft(
  values: CreateFilterInput,
  catalogue: readonly CatalogueItem[],
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

  const coverExists = catalogue.some(
    (item) => item.imagePath === values.imagePath,
  );

  return {
    values: {
      ...values,
      imagePath: coverExists ? values.imagePath : "",
      items,
    },
    droppedCount: values.items.length - items.length,
  };
}
