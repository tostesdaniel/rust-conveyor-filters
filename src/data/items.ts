import "server-only";

import { db } from "@/db";

export async function getItems() {
  return await db.query.items.findMany({
    where: (items, { eq }) => eq(items.insertable, true),
    orderBy: (items, { asc }) => [asc(items.name)],
  });
}

export type ItemIcons = ReadonlyMap<string, string | null>;

let itemIconsPromise: Promise<ItemIcons> | null = null;

/**
 * Icon version by image path, for every insertable item. Filter covers only
 * store the path, so this is where they get their version. Items only change
 * when the boot sync runs, so the cache lives as long as the process.
 */
export async function getItemIcons(): Promise<ItemIcons> {
  if (!itemIconsPromise) {
    itemIconsPromise = db.query.items
      .findMany({
        columns: { imagePath: true, iconVersion: true },
        where: (items, { eq }) => eq(items.insertable, true),
      })
      .then(
        (rows) => new Map(rows.map((row) => [row.imagePath, row.iconVersion])),
      );

    itemIconsPromise.catch(() => {
      itemIconsPromise = null;
    });
  }

  return itemIconsPromise;
}
