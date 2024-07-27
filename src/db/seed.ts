import * as fs from "fs";
import path from "path";
import { eq, or, sql } from "drizzle-orm";

import { GameItem } from "@/types/gameItem";

import { db } from ".";
import { categories, filterItems, filters, items } from "./schema";

async function seed() {
  try {
    await clearDatabase();
    await insertCategories();
    await insertItems();
    await insertFilterItems();
    console.log("Seeding complete");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

const clearDatabase = async () => {
  try {
    await db.delete(filterItems).execute();
    await db.delete(filters).execute();
    await db.delete(items).execute();
    await db.delete(categories).execute();

    // Reset sequences
    await db.execute(
      sql`ALTER SEQUENCE public.filter_items_id_seq RESTART WITH 1`,
    );
    await db.execute(sql`ALTER SEQUENCE public.filters_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE public.items_id_seq RESTART WITH 1`);
    console.log("Database cleared and sequences reset.");
  } catch (error) {
    console.error("Error clearing database:", error);
  }
};

const insertItems = async () => {
  try {
    const files = fs
      .readdirSync(path.join(__dirname, "../assets/items"))
      .filter((file) => file.endsWith(".json"));

    const itemsData: GameItem[] = files.map((file) => {
      const data = fs.readFileSync(
        path.join(__dirname, "../assets/items", file),
        "utf-8",
      );
      return JSON.parse(data) as GameItem;
    });

    const insertPromises = itemsData.map((itemData) =>
      db.insert(items).values({
        itemId: itemData.itemid,
        shortname: itemData.shortname,
        name: itemData.Name,
        category: itemData.Category,
        imagePath: itemData.shortname,
      }),
    );

    await Promise.all(insertPromises);
    console.log("Items insertion complete.");
  } catch (error) {
    console.error("Error inserting items:", error);
  }
};

const insertCategories = async () => {
  try {
    const values = [
      { id: 0, name: "Weapons" },
      { id: 1, name: "Construction" },
      { id: 2, name: "#bp_deployables" },
      { id: 3, name: "Resources" },
      { id: 4, name: "Clothing" },
      { id: 5, name: "Tools" },
      { id: 6, name: "Medical" },
      { id: 7, name: "Food" },
      { id: 8, name: "Ammo" },
      { id: 9, name: "Traps" },
      { id: 10, name: "Other" },
      { id: 13, name: "Components" },
      { id: 16, name: "Electrical" },
      { id: 17, name: "Fun" },
    ];
    await db.insert(categories).values(values);
    console.log("Categories insertion complete.");
  } catch (error) {
    console.error("Error inserting categories:", error);
  }
};

const insertFilters = async () => {
  try {
    const result = await db
      .insert(filters)
      .values([
        {
          name: "T1 Weapons",
          description: "Filter for T1 weapons",
          authorId: "1",
          imagePath: "pistol.revolver",
        },
        {
          name: "T2 Weapons",
          description: "Filter for T2 weapons",
          authorId: "1",
          imagePath: "smg.thompson",
        },
      ])
      .returning({ id: filters.id });
    console.log("Filters insertion complete.");
    return result;
  } catch (error) {
    console.error("Error inserting filters:", error);
    throw error;
  }
};

const insertFilterItems = async () => {
  try {
    const [filter1, filter2] = await insertFilters();

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

    const filterItemsData = [
      {
        itemId: t1Items[0].id,
        filterId: filter1.id,
        max: 0,
        buffer: 0,
        min: 0,
      },
      {
        itemId: t1Items[1].id,
        filterId: filter1.id,
        max: 0,
        buffer: 0,
        min: 0,
      },
      {
        itemId: t2Items[0].id,
        filterId: filter2.id,
        max: 0,
        buffer: 0,
        min: 0,
      },
      {
        itemId: t2Items[1].id,
        filterId: filter2.id,
        max: 0,
        buffer: 0,
        min: 0,
      },
    ];

    await db.insert(filterItems).values(filterItemsData);
    console.log("Items to filters insertion complete.");
  } catch (error) {
    console.error("Error inserting items to filters:", error);
  }
};

async function main() {
  await seed();
}

main();
