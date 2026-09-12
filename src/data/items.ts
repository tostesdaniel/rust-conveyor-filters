import "server-only";

import { db } from "@/db";

export async function getItems() {
  return await db.query.items.findMany({
    orderBy: (items, { asc }) => [asc(items.name)],
  });
}

let imagePathsPromise: Promise<Set<string>> | null = null;

export async function getItemImagePaths(): Promise<Set<string>> {
  if (!imagePathsPromise) {
    imagePathsPromise = db.query.items
      .findMany({ columns: { imagePath: true } })
      .then((rows) => new Set(rows.map((row) => row.imagePath)));

    imagePathsPromise.catch(() => {
      imagePathsPromise = null;
    });
  }

  return imagePathsPromise;
}
