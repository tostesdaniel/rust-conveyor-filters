import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  primaryKey,
  serial,
  varchar,
} from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  itemid: integer("itemid").notNull(),
  shortname: varchar("shortname", { length: 256 }).notNull(),
  Name: varchar("name", { length: 256 }).notNull(),
  Category: varchar("category", { length: 256 }).notNull(),
  imagePath: varchar("image_path", { length: 256 }).notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export const itemsRelations = relations(items, ({ many }) => ({
  itemsToCollections: many(itemsToCollections),
}));

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  authorId: varchar("author_id", { length: 256 }).notNull(),
  imagePath: varchar("image_path", { length: 256 }).notNull(),
});

export const collectionsRelations = relations(collections, ({ many }) => ({
  itemsToCollections: many(itemsToCollections),
}));

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

export const itemsToCollections = pgTable(
  "items_to_collections",
  {
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id),
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collections.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.itemId, t.collectionId] }),
  }),
);

export const itemsToCollectionsRelations = relations(
  itemsToCollections,
  ({ one }) => ({
    collections: one(collections, {
      fields: [itemsToCollections.collectionId],
      references: [collections.id],
    }),
    items: one(items, {
      fields: [itemsToCollections.itemId],
      references: [items.id],
    }),
  }),
);

export type ItemToCollection = typeof itemsToCollections.$inferSelect;
export type NewItemToCollection = typeof itemsToCollections.$inferInsert;

export const categories = pgTable("categories", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
