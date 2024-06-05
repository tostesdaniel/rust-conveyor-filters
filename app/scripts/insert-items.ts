import * as fs from "fs";
import path from "path";

import { db } from "../../db";
import { items, NewItem } from "../../db/schema";

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
