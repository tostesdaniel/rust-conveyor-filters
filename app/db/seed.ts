import { eq, or } from "drizzle-orm";
import * as fs from "fs";
import path from "path";
import { db } from ".";
import { NewItem, collections, items, itemsToCollections } from "./schema";

async function seed() {
  await insertItems();
  await insertItemsToCollections();
}

const insertItems = async () => {
  const files = fs
    .readdirSync(path.join(__dirname, "../items"))
    .filter((file) => file.endsWith(".json"));

  for (const file of files) {
    try {
      const data = fs.readFileSync(
        path.join(__dirname, "../items", file),
        "utf-8",
      );
      const itemData: NewItem = JSON.parse(data);

      await db
        .insert(items)
        .values({
          itemid: itemData.itemid,
          shortname: itemData.shortname,
          Name: itemData.Name,
          Category: itemData.Category,
          imagePath: itemData.shortname,
        })
        .execute();
    } catch (error) {
      console.error(`Error inserting data from ${file}:`, error);
    }
  }

  console.log("Data insertion complete.");
};

const insertCollections = async () => {
  const result = await db
    .insert(collections)
    .values([
      { name: "T1 Weapons", authorId: "1", imagePath: "pistol.revolver" },
      { name: "T2 Weapons", authorId: "1", imagePath: "smg.thompson" },
    ])
    .returning({ id: collections.id });
  return result;
};

const insertItemsToCollections = async () => {
  const [collection1, collection2] = await insertCollections();
  const t1Items = await db
    .select()
    .from(items)
    .where(
      or(
        eq(items.shortname, "pistol.revolver"),
        eq(items.shortname, "crossbow"),
      ),
    );
  const t2Items = await db
    .select()
    .from(items)
    .where(
      or(
        eq(items.shortname, "smg.thompson"),
        eq(items.shortname, "rifle.semiauto"),
      ),
    );

  await db.insert(itemsToCollections).values([
    { itemId: t1Items[0].id, collectionId: collection1.id },
    { itemId: t1Items[1].id, collectionId: collection1.id },
    { itemId: t2Items[0].id, collectionId: collection2.id },
    { itemId: t2Items[1].id, collectionId: collection2.id },
  ]);
};

async function main() {
  try {
    await seed();
    console.log("Seeding complete");
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
}

main();
