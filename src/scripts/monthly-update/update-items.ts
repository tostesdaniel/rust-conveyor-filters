import fs from "fs/promises";
import { glob } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { eq } from "drizzle-orm";

import { GameItem } from "@/types/gameItem";
import { items, type Item } from "@/db/schema";

async function updateItems() {
  try {
    const itemsSinkDir = path.join(__dirname, "items-sink");

    const existingItems = await db.query.items.findMany({
      columns: {
        id: false,
      },
    });

    const existingItemsMap = new Map<number, Omit<Item, "id">>(
      existingItems.map((item) => [item.itemId, item]),
    );

    const newItemFiles = glob("**/*.json", { cwd: itemsSinkDir });
    const updatedItems: Omit<Item, "id">[] = [];
    const newItems: Omit<Item, "id">[] = [];

    for await (const file of newItemFiles) {
      const filePath = path.join(itemsSinkDir, file);
      const content = await fs.readFile(filePath, "utf-8");
      const item = JSON.parse(content) as GameItem;

      if (existingItemsMap.has(item.itemid)) {
        const changed = checkForChanges(
          existingItemsMap.get(item.itemid)!,
          item,
        );

        if (changed) {
          updatedItems.push(normalizeItem(item));
        }
      } else {
        newItems.push(normalizeItem(item));
      }
    }

    for (const item of updatedItems) {
      await db.update(items).set(item).where(eq(items.itemId, item.itemId));
    }

    for (const item of newItems) {
      await db.insert(items).values(item);
    }

    console.log("Item update completed successfully!");
    const addedCount = newItems.length;
    const updatedCount = updatedItems.length;

    console.log(`Added ${addedCount} new items:`);
    console.log(newItems.map((item) => item.name).join(", "));

    console.log(`\nUpdated ${updatedCount} items:`);
    console.log(updatedItems.map((item) => item.name).join(", "));

    console.log(`\nTotal changes: ${addedCount + updatedCount} items`);
  } catch (error) {
    console.error("Error updating items:", error);
    process.exit(1);
  }
}

function checkForChanges(existingItem: Omit<Item, "id">, newItem: GameItem) {
  if (existingItem.itemId !== newItem.itemid) {
    throw new Error(
      `Item ID mismatch between ${existingItem.name} and ${newItem.Name} (${existingItem.itemId} !== ${newItem.itemid})`,
    );
  }

  const normalizedNewItem = normalizeItem(newItem);

  if (JSON.stringify(existingItem) !== JSON.stringify(normalizedNewItem)) {
    return true;
  }
}

function normalizeItem(item: GameItem): Omit<Item, "id"> {
  return {
    itemId: item.itemid,
    shortname: item.shortname,
    name: item.Name,
    category: item.Category,
    imagePath: item.shortname,
  };
}

async function main() {
  await updateItems();
}

main();
