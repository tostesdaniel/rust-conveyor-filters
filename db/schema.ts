import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  itemId: integer("itemid").notNull(),
  shortname: varchar("shortname", { length: 256 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  category: varchar("category", { length: 256 }).notNull(),
  imagePath: varchar("image_path", { length: 256 }).notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export const itemsRelations = relations(items, ({ many }) => ({
  filterItems: many(filterItems),
}));

export const filters = pgTable("filters", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: varchar("description", { length: 256 }),
  authorId: varchar("author_id", { length: 256 }).notNull(),
  imagePath: varchar("image_path", { length: 256 }).notNull(),
});

export type Filter = typeof filters.$inferSelect;
export type NewFilter = typeof filters.$inferInsert;

export const filtersRelations = relations(filters, ({ many }) => ({
  filterItems: many(filterItems),
}));

export const filterItems = pgTable(
  "filter_items",
  {
    id: serial("id").primaryKey(),
    filterId: integer("filter_id")
      .notNull()
      .references(() => filters.id),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id),
    max: integer("max").notNull(),
    buffer: integer("buffer").notNull(),
    min: integer("min").notNull(),
  },
  (t) => ({
    uniqueIndex: uniqueIndex("unique_idx").on(t.itemId, t.filterId),
  }),
);

export type FilterItem = typeof filterItems.$inferSelect;
export type NewFilterItem = typeof filterItems.$inferInsert;

export const filterItemRelations = relations(filterItems, ({ one }) => ({
  filterId: one(filters, {
    fields: [filterItems.filterId],
    references: [filters.id],
  }),
  itemId: one(items, {
    fields: [filterItems.itemId],
    references: [items.id],
  }),
}));

export const categories = pgTable("categories", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
